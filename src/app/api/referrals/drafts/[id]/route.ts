import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/nextauth-helpers';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET /api/referrals/drafts/[id] - Get a specific draft for editing
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'case_manager') {
      return NextResponse.json({ error: 'Only case managers can view drafts' }, { status: 403 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');
    const draftId = params.id;

    if (!ObjectId.isValid(draftId)) {
      return NextResponse.json({ error: 'Invalid draft ID' }, { status: 400 });
    }

    // Get the draft
    const draft = await db.collection('referrals').findOne({
      _id: new ObjectId(draftId),
      status: 'draft',
      createdBy: new ObjectId(user.id),
      org_id: user.org_id
    });

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Get client data if linked to existing client
    let clientData = null;
    if (draft.clientId) {
      clientData = await db.collection('clients').findOne({
        _id: draft.clientId,
        org_id: user.org_id
      });
    }

    return NextResponse.json({
      success: true,
      draft: {
        _id: draft._id,
        clientId: draft.clientId,
        clientData,
        formData: draft.draftData?.formData || {},
        currentStep: draft.draftData?.currentStep || 1,
        lastSaved: draft.draftData?.lastSaved || draft.updatedAt,
        createdAt: draft.createdAt,
      }
    });

  } catch (error) {
    console.error('Error fetching draft:', error);
    return NextResponse.json(
      { error: 'Failed to fetch draft' },
      { status: 500 }
    );
  }
}

// PUT /api/referrals/drafts/[id] - Update a draft
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'case_manager') {
      return NextResponse.json({ error: 'Only case managers can update drafts' }, { status: 403 });
    }

    const body = await request.json();
    const { formData, step } = body;
    const draftId = params.id;

    if (!ObjectId.isValid(draftId)) {
      return NextResponse.json({ error: 'Invalid draft ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // Update the draft
    const updateResult = await db.collection('referrals').updateOne(
      {
        _id: new ObjectId(draftId),
        status: 'draft',
        createdBy: new ObjectId(user.id),
        org_id: user.org_id
      },
      {
        $set: {
          'draftData.formData': formData,
          'draftData.currentStep': step || 1,
          'draftData.lastSaved': new Date(),
          updatedAt: new Date(),
          
          // Update basic referral fields for compatibility
          'serviceDetails.type': formData.selectedServices?.[0] || formData.service_type || '',
          'serviceDetails.urgency': formData.urgency || 'medium',
          'serviceDetails.notes': formData.additionalNotes || formData.referralReason || '',
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Draft updated successfully'
    });

  } catch (error) {
    console.error('Error updating draft:', error);
    return NextResponse.json(
      { error: 'Failed to update draft' },
      { status: 500 }
    );
  }
}

// DELETE /api/referrals/drafts/[id] - Delete a draft
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'case_manager') {
      return NextResponse.json({ error: 'Only case managers can delete drafts' }, { status: 403 });
    }

    const draftId = params.id;

    if (!ObjectId.isValid(draftId)) {
      return NextResponse.json({ error: 'Invalid draft ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // Delete the draft
    const deleteResult = await db.collection('referrals').deleteOne({
      _id: new ObjectId(draftId),
      status: 'draft',
      createdBy: new ObjectId(user.id),
      org_id: user.org_id
    });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Draft deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting draft:', error);
    return NextResponse.json(
      { error: 'Failed to delete draft' },
      { status: 500 }
    );
  }
}
