import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function POST() {
  try {
    const db = getDatabase();

    // 修复损坏的中文标题
    const fixes = [
      { id: 2, correctTitle: '测试数据文章' },
      { id: 3, correctTitle: '编辑测试文章' },
      { id: 4, correctTitle: '原生家庭婚姻指导' }
    ];

    const results = [];

    for (const fix of fixes) {
      try {
        // 先检查当前数据
        const current = db.prepare('SELECT title FROM generated_content WHERE id = ?').get(fix.id);

        // 更新为正确的中文标题
        const updateResult = db.prepare('UPDATE generated_content SET title = ? WHERE id = ?').run(fix.correctTitle, fix.id);

        // 验证更新
        const updated = db.prepare('SELECT id, title FROM generated_content WHERE id = ?').get(fix.id);

        results.push({
          id: fix.id,
          oldTitle: current?.title,
          newTitle: updated?.title,
          success: updateResult.changes > 0
        });
      } catch (error) {
        results.push({
          id: fix.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: '编码修复完成',
      results
    });
  } catch (error) {
    console.error('Fix encoding error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}