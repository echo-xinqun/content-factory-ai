import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET() {
  try {
    const db = getDatabase();

    // 查询ID为6的文章详细信息
    const article = db.prepare('SELECT * FROM generated_content WHERE id = ?').get(6);

    return NextResponse.json({
      success: true,
      article
    });
  } catch (error) {
    console.error('Error fetching article 6:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}