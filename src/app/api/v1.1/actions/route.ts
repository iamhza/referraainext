/**
 * V1.1 Actions API - Simplified Action System
 * 
 * Uses 4 simplified action types:
 * - REQUEST_INTAKE
 * - REQUEST_UPDATE
 * - REQUEST_DOCUMENT
 * - GENERAL_MESSAGE
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/nextauth-helpers';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { ActionTypeV1_1, ActionStatusV1_1, ActionPriorityV1_1, SubjectType } from '@/types/actions-v1.1';

// POST /api/v1.1/actions - Create new action
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.subjectType || !data.subjectId || !data.type) {
      return NextResponse.json({ 
        error: 'Missing required fields: subjectType, subjectId, type' 
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // Verify subject exists and user has access
    let subjectDoc: any = null;
    if (data.subjectType === 'SERVICE_RELATIONSHIP') {
      subjectDoc = await db.collection('service_relationships').findOne({
        _id: new ObjectId(data.subjectId)
      });
    } else if (data.subjectType === 'CLIENT') {
      subjectDoc = await db.collection('clients').findOne({
        _id: new ObjectId(data.subjectId)
      });
    }

    if (!subjectDoc) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    // Security: Check organization access
    if (subjectDoc.organizationId !== user.organizationId && user.role !== 'PLATFORM_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get org_member ID for createdBy
    const orgMember = await db.collection('org_members').findOne({
      userId: user.id,
      organizationId: user.organizationId
    });

    if (!orgMember) {
      return NextResponse.json({ error: 'Org member not found' }, { status: 404 });
    }

    // Create v1.1 action
    const action = {
      organizationId: user.organizationId,
      
      // Subject
      subjectType: data.subjectType as SubjectType,
      subjectId: data.subjectId,
      
      // Action details
      type: data.type as ActionTypeV1_1,
      status: 'OPEN' as ActionStatusV1_1,
      priority: (data.priority || 'NORMAL') as ActionPriorityV1_1,
      
      // Request payload
      requestPayload: {
        notes: data.notes || '',
        docType: data.docType,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
        ...data.customFields
      },
      
      // Timestamps
      createdAt: new Date(),
      updatedAt: new Date(),
      dueAt: data.dueAt ? new Date(data.dueAt) : undefined,
      
      // Created by
      createdByMemberId: orgMember._id.toString(),
    };

    const result = await db.collection('actions').insertOne(action);

    console.log('✅ Created v1.1 action:', result.insertedId);

    return NextResponse.json({
      success: true,
      actionId: result.insertedId.toString()
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating action:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/v1.1/actions?subjectId=[id]&subjectType=[type] - Get actions for a subject
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');
    const subjectType = searchParams.get('subjectType');
    const status = searchParams.get('status');

    const client = await clientPromise;
    const db = client.db('referradb');

    // Build query
    const query: any = {
      organizationId: user.organizationId
    };

    if (subjectId) {
      query.subjectId = subjectId;
    }

    if (subjectType) {
      query.subjectType = subjectType;
    }

    if (status) {
      query.status = status;
    }

    const actions = await db.collection('actions')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // Hydrate creator names
    const memberIds = [...new Set(actions.map(a => a.createdByMemberId).filter(Boolean))];
    const members = await db.collection('org_members')
      .find({ _id: { $in: memberIds.map(id => new ObjectId(id)) } })
      .toArray();

    const memberMap = new Map(members.map(m => [m._id.toString(), m]));

    const hydrated = actions.map(action => ({
      ...action,
      _id: action._id.toString(),
      creatorName: memberMap.get(action.createdByMemberId)?.userId || 'Unknown'
    }));

    return NextResponse.json({
      actions: hydrated,
      count: hydrated.length
    });
  } catch (error) {
    console.error('Error fetching actions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

