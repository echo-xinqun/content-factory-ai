import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET() {
  try {
    const db = getDatabase();

    // 查询文章中是否有图片相关字段
    const articles = db.prepare(`
      SELECT id, title,
             CASE
               WHEN LENGTH(CAST(insights_reference AS TEXT)) > 10 THEN CAST(insights_reference AS TEXT)
               ELSE NULL
             END as potential_images
      FROM generated_content
      ORDER BY created_at DESC
      LIMIT 5
    `).all();

    // 检查数据库表结构
    const schema = db.prepare('PRAGMA table_info(generated_content)').all();

    return NextResponse.json({
      success: true,
      articles,
      schema,
      message: '检查文章中是否包含图片数据'
    });
  } catch (error) {
    console.error('Error checking article images:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}