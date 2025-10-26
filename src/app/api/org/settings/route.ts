/**
 * Organization settings API
 * Handles organization-specific settings and configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { withOrgAuth } from '@/lib/auth/api-auth';
import clientPromise from '@/lib/mongodb/client';
import { createOrgAuditLog } from '@/lib/organizations/utils';

// GET /api/org/settings - Fetch organization settings
export const GET = withOrgAuth(async (user, request: NextRequest) => {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');

    // Get organization settings
    const orgSettings = await db.collection('organization_settings').findOne({
      orgId: user.orgContext.orgId
    });

    // Default settings if none exist
    const defaultSettings = {
      // Basic Info
      name: user.orgContext.organization?.name || 'Your Organization',
      description: '',
      website: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      
      // Branding
      logoUrl: '',
      primaryColor: '#11acf8',
      customDomain: '',
      
      // Security & Compliance
      requireTwoFactor: false,
      sessionTimeout: 8,
      ipWhitelist: [],
      dataRetentionDays: 2555, // 7 years
      
      // Notifications
      emailNotifications: true,
      slackWebhook: '',
      weeklyReports: true,
      
      // Workflow Settings
      autoAssignCases: false,
      requireApproval: true,
      maxCaseload: 50
    };

    const settings = orgSettings ? { ...defaultSettings, ...orgSettings } : defaultSettings;

    return NextResponse.json({ 
      success: true,
      settings 
    });

  } catch (error) {
    console.error('Error fetching organization settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' }, 
      { status: 500 }
    );
  }
});

// PUT /api/org/settings - Update organization settings
export const PUT = withOrgAuth(async (user, request: NextRequest) => {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');
    
    const updatedSettings = await request.json();

    // Validate required fields
    if (!updatedSettings.name) {
      return NextResponse.json(
        { error: 'Organization name is required' }, 
        { status: 400 }
      );
    }

    // Get current settings for audit log
    const currentSettings = await db.collection('organization_settings').findOne({
      orgId: user.orgContext.orgId
    });

    // Update or create settings
    const settingsData = {
      ...updatedSettings,
      orgId: user.orgContext.orgId,
      updatedAt: new Date(),
      updatedBy: user.id
    };

    const result = await db.collection('organization_settings').updateOne(
      { orgId: user.orgContext.orgId },
      { 
        $set: settingsData,
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );

    // Create audit log
    await createOrgAuditLog(
      user.orgContext.orgId,
      user.id,
      'settings_updated',
      'organization_settings',
      user.orgContext.orgId,
      currentSettings || {},
      updatedSettings,
      { 
        modifiedCount: result.modifiedCount,
        upsertedCount: result.upsertedCount 
      }
    );

    return NextResponse.json({ 
      success: true,
      message: 'Settings updated successfully' 
    });

  } catch (error) {
    console.error('Error updating organization settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' }, 
      { status: 500 }
    );
  }
});

// GET /api/org/organization - Get organization info
export const GET_ORG = withOrgAuth(async (user, request: NextRequest) => {
  try {
    const client = await clientPromise;
    const db = client.db('referradb');

    // Get organization details
    const organization = await db.collection('organizations').findOne({
      _id: user.orgContext.orgId
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' }, 
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      organization: {
        id: organization._id,
        name: organization.name,
        domain: organization.domain,
        createdAt: organization.createdAt,
        settings: organization.settings || {}
      }
    });

  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization' }, 
      { status: 500 }
    );
  }
});
