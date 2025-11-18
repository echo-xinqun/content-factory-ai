import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function POST() {
  try {
    const db = getDatabase();

    // 更新ID为6的文章标题
    const correctTitle = "原生家庭如何塑造你的婚姻：情感模式与价值观传递解析";

    const updateResult = db.prepare('UPDATE generated_content SET title = ?, updated_at = ? WHERE id = ?').run(
      correctTitle,
      Math.floor(Date.now() / 1000),
      6
    );

    // 验证更新
    const updatedArticle = db.prepare('SELECT id, title FROM generated_content WHERE id = ?').get(6);

    return NextResponse.json({
      success: true,
      message: '文章标题更新成功',
      updateResult: {
        changes: updateResult.changes,
        lastID: updateResult.lastInsertRowid
      },
      updatedArticle
    });
  } catch (error) {
    console.error('Update article title error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}