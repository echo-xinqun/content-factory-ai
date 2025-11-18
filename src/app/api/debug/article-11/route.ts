import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET() {
  try {
    const db = getDatabase();

    // 查询最新创建的文章（包含图片数据）
    const article = db.prepare('SELECT * FROM generated_content WHERE id = ?').get(11);

    return NextResponse.json({
      success: true,
      article,
      insights_reference: article?.insights_reference,
      // 尝试解析insights_reference
      parsedImages: article?.insights_reference ? JSON.parse(article.insights_reference) : null
    });
  } catch (error) {
    console.error('Error checking article 11:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}