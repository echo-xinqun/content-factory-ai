import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function POST() {
  try {
    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000);

    // 首先创建一个测试topic
    const topicQuery = `
      INSERT INTO content_topics (
        title,
        source_keyword,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?)
    `;

    const topicResult = db.prepare(topicQuery).run(
      '测试选题',
      '测试关键词',
      now,
      now
    );

    console.log(`创建主题成功，ID: ${topicResult.lastInsertRowid}`);

    return NextResponse.json({
      success: true,
      topicId: topicResult.lastInsertRowid
    });

  } catch (error) {
    console.error('创建主题失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}