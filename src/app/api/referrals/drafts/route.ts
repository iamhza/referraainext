import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import clientPromise from '@/lib/mongodb/client';
import { ObjectId } from 'mongodb';

// POST /api/referrals/drafts - Save a draft referral
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Draft API - POST request started');
    const user = await getAuthenticatedUser();
    console.log('👤 Draft API - User:', user ? `${user.email} (${user.role})` : 'No user found');
    
    if (!user) {
      console.log('❌ Draft API - No authenticated user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'case_manager') {
      return NextResponse.json({ error: 'Only case managers can save draft referrals' }, { status: 403 });
    }

    const body = await request.json();
    const { formData, clientId, step } = body;
    console.log('📝 Draft API - Request body:', { hasFormData: !!formData, clientId, step });

    if (!formData) {
      console.log('❌ Draft API - No form data provided');
      return NextResponse.json({ error: 'Form data is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('referradb');

    // Check if a draft already exists for this client
    let existingDraft = null;
    if (clientId) {
      console.log('🔍 Checking for existing draft for clientId:', clientId);
      existingDraft = await db.collection('referrals').findOne({
        status: 'draft',
        createdBy: new ObjectId(user.id),
        org_id: user.org_id,
        clientId: new ObjectId(clientId)
      });
      console.log('🔍 Existing draft found:', existingDraft ? existingDraft._id : 'None');
    } else {
      console.log('🔍 No clientId provided, will create new draft');
    }

    if (existingDraft) {
      // Update existing draft instead of creating new one
      const updateResult = await db.collection('referrals').updateOne(
        { _id: existingDraft._id },
        {
          $set: {
            draftData: {
              formData,
              currentStep: step || 1,
              lastSaved: new Date(),
            },
            serviceDetails: {
              type: formData.selectedServices?.[0] || formData.service_type || '',
              urgency: formData.urgency || 'medium',
              notes: formData.additionalNotes || formData.referralReason || '',
            },
            updatedAt: new Date(),
          }
        }
      );

      console.log('✅ Draft API - Existing draft updated:', existingDraft._id);
      return NextResponse.json({
        success: true,
        draftId: existingDraft._id,
        message: 'Draft updated successfully'
      });
    }

    // Create new draft referral document
    const draftReferral = {
      status: 'draft',
      createdBy: new ObjectId(user.id),
      org_id: user.org_id,
      clientId: clientId ? new ObjectId(clientId) : null,
      
      // Form data - preserve the current step and all filled fields
      draftData: {
        formData,
        currentStep: step || 1,
        lastSaved: new Date(),
      },
      
      // Basic referral fields for compatibility
      serviceDetails: {
        type: formData.selectedServices?.[0] || formData.service_type || '',
        urgency: formData.urgency || 'medium',
        notes: formData.additionalNotes || formData.referralReason || '',
      },
      
      // Client info from form (if no clientId)
      clientInfo: clientId ? null : {
        firstName: formData.firstName || '',
        lastName: formData.lastName || '',
        dateOfBirth: formData.dateOfBirth || '',
        email: formData.email || '',
        phone: formData.phone || '',
        sex: formData.sex || '',
        address: {
          street: formData.address || '',
          city: formData.city || '',
          state: formData.state || '',
          zipCode: formData.zipCode || '',
        },
        insurance: {
          type: formData.insurance || '',
          provider: formData.insuranceProvider || '',
          number: formData.insuranceNumber || '',
        },
        pmiNumber: formData.pmiNumber || '',
        waiverType: formData.waiverType || '',
        historyOfViolence: formData.historyOfViolence || false,
        mobilityStatus: formData.mobilityStatus || '',
        primaryDiagnosis: formData.primaryDiagnosis || '',
        livingSituation: formData.livingSituation || '',
        primaryLanguage: formData.primaryLanguage || '',
        needsTranslator: formData.needsTranslator || false,
        culturalConsiderations: formData.culturalConsiderations || '',
      },
      
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('💾 Draft API - Saving draft to database...');
    const result = await db.collection('referrals').insertOne(draftReferral);
    console.log('✅ Draft API - Draft saved successfully with ID:', result.insertedId);

    return NextResponse.json({
      success: true,
      draftId: result.insertedId,
      message: 'Draft saved successfully'
    });

  } catch (error) {
    console.error('Error saving draft referral:', error);
    return NextResponse.json(
      { error: 'Failed to save draft referral' },
      { status: 500 }
    );
  }
}

// GET /api/referrals/drafts - Get all draft referrals for the current user
export async function GET(request: NextRequest) {
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

    // Get all draft referrals for this user
    const drafts = await db.collection('referrals')
      .find({
        status: 'draft',
        createdBy: new ObjectId(user.id),
        org_id: user.org_id
      })
      .sort({ updatedAt: -1 })
      .toArray();

    // Format drafts for the UI
    const formattedDrafts = await Promise.all(drafts.map(async (draft) => {
      let clientName = 'New Client';
      
      console.log('🔍 Draft formatting - Draft ID:', draft._id, 'ClientId:', draft.clientId);
      console.log('🔍 Draft clientInfo:', draft.clientInfo);
      
      // If linked to existing client, get client name
      if (draft.clientId) {
        const client = await db.collection('clients').findOne({
          _id: draft.clientId,
          org_id: user.org_id
        });
        console.log('👤 Found client:', client ? `${client.firstName} ${client.lastName}` : 'No client found');
        if (client) {
          clientName = `${client.firstName} ${client.lastName}`;
        }
      } else if (draft.clientInfo?.firstName || draft.clientInfo?.lastName) {
        // Use client info from draft
        clientName = `${draft.clientInfo.firstName || ''} ${draft.clientInfo.lastName || ''}`.trim();
        console.log('📝 Using draft client info:', clientName);
      }
      
      // If still "New Client", try to get name from draftData.formData
      if (clientName === 'New Client' && draft.draftData?.formData) {
        const formData = draft.draftData.formData;
        if (formData.firstName || formData.lastName) {
          clientName = `${formData.firstName || ''} ${formData.lastName || ''}`.trim();
          console.log('📝 Using formData client info:', clientName);
        }
      }
      
      console.log('✅ Final client name:', clientName);

      return {
        _id: draft._id,
        clientName,
        clientId: draft.clientId,
        serviceType: draft.serviceDetails?.type || 'Not specified',
        urgency: draft.serviceDetails?.urgency || 'medium',
        currentStep: draft.draftData?.currentStep || 1,
        lastSaved: draft.draftData?.lastSaved || draft.updatedAt,
        createdAt: draft.createdAt,
      };
    }));

    return NextResponse.json({
      success: true,
      drafts: formattedDrafts
    });

  } catch (error) {
    console.error('Error fetching draft referrals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch draft referrals' },
      { status: 500 }
    );
  }
}
