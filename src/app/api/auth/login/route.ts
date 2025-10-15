import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Demo mode - hardcoded users (no database required)
    const demoUsers = {
      'user@example.com': {
        id: 1,
        email: 'user@example.com',
        role: 'user' as const,
        name: 'John Doe',
      },
      'admin@example.com': {
        id: 2,
        email: 'admin@example.com',
        role: 'admin' as const,
        name: 'Admin User',
      }
    };

    const user = demoUsers[email as keyof typeof demoUsers];

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // For demo purposes, accept any password for demo users
    if (!password || password.trim() === '') {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}