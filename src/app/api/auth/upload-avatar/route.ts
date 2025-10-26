import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getAuthenticatedUser } from '@/lib/auth/helpers';
import clientPromise from '@/lib/mongodb/client';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    // Create unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `avatar-${user.id}-${timestamp}.${fileExtension}`;

    // Ensure uploads directory exists
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'avatars');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Save file to filesystem
    const filePath = join(uploadsDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create public URL
    const avatarUrl = `/uploads/avatars/${fileName}`;

    // Update user in MongoDB
    const client = await clientPromise;
    const db = client.db('referradb');
    
    // Find user by various ID fields
    const updateResult = await db.collection('users').updateOne(
      {
        $or: [
          { _id: new ObjectId(user.id) },
          { user_id: user.id },
          { id: user.id },
          { auth_id: user.id },
          { email: user.email }
        ]
      },
      {
        $set: {
          avatar_url: avatarUrl,
          updated_at: new Date()
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      avatarUrl,
      message: 'Avatar uploaded successfully' 
    });

  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload avatar' }, 
      { status: 500 }
    );
  }
}
