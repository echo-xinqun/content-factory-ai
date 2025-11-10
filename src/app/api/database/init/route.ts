import { NextResponse } from 'next/server';
import { initializeDatabase, getDatabaseStats } from '@/lib/db';

export async function POST() {
  try {
    initializeDatabase();
    const stats = getDatabaseStats();

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      stats
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}