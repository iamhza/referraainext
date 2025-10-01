import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getAuthenticatedUser } from '@/lib/nextauth-helpers';
import { ObjectId } from 'mongodb';
import { computeSubmissionScore } from '@/lib/scoring';
import { ensureProviderSubscription, canSubmitToNetwork, incrementSubmissionUsage } from '@/lib/supabase-quota';



export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user || !['case_manager', 'platform_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const client = await clientPromise;
  const db = client.db('referradb');
  const referralId = new ObjectId(params.id);

  const submissions = await db
    .collection('submissions')
    .find({ referralId })
    .sort({ score: -1, createdAt: -1 })
    .limit(50)
    .toArray();

  return NextResponse.json({ submissions });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser();
  if (!user || !['provider', 'platform_admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const providerId = user.id;
  const body = await request.json();
  const now = new Date().toISOString();

  // Validate cover note length (anti-spam)
  if (!body.coverNote || body.coverNote.length < 300) {
    return NextResponse.json({ error: 'Cover note must be at least 300 characters' }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db('referradb');
  const referralId = new ObjectId(params.id);

  // Check if referral is open to network
  const referral = await db.collection('referrals').findOne({ _id: referralId });
  if (!referral?.isOpenToNetwork) {
    return NextResponse.json({ error: 'Referral not open to network submissions' }, { status: 400 });
  }

  // Check if within submission window (7 days from network posting)
  const networkPostedAt = new Date(referral.networkPostedAt || referral.createdAt);
  const now7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  if (networkPostedAt < now7Days) {
    return NextResponse.json({ error: 'Submission window has closed' }, { status: 400 });
  }

  // Basic anti-spam: one submission per provider per referral
  const existing = await db.collection('submissions').findOne({ referralId, providerId });
  if (existing) {
    // Allow single edit within 7-day window
    const update = { ...body, updatedAt: now };
    const res = await db.collection('submissions').findOneAndUpdate(
      { _id: existing._id },
      { $set: update },
      { returnDocument: 'after' }
    );
    return NextResponse.json({ submission: res.value });
  }

  // Quota enforcement for providers (admins bypass)
  if (user.role === 'provider') {
    try {
      const subscription = await ensureProviderSubscription(providerId);
      if (!canSubmitToNetwork(subscription)) {
        return NextResponse.json({ 
          error: 'Submission quota exceeded. Upgrade your plan to submit more.',
          needsUpgrade: true 
        }, { status: 403 });
      }

      // Increment usage counter
      await incrementSubmissionUsage(providerId);
    } catch (error) {
      console.error('Quota check failed:', error);
      return NextResponse.json({ error: 'Failed to verify submission quota' }, { status: 500 });
    }
  }

  // Minimal scoring context (can be expanded)
  const score = computeSubmissionScore(body, {
    serviceType: body.serviceType,
    preferredAreas: body.preferredAreas,
    preferredLanguages: body.preferredLanguages,
    requiredCredentials: body.requiredCredentials,
  });

  const doc = {
    referralId,
    providerId,
    ...body,
    score,
    status: 'submitted',
    createdAt: now,
  };

  const res = await db.collection('submissions').insertOne(doc);
  return NextResponse.json({ submission: { _id: res.insertedId, ...doc } }, { status: 201 });
}


