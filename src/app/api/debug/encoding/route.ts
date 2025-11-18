import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET() {
  try {
    const db = getDatabase();

    // 检查数据库编码设置
    const pragmaEncoding = db.prepare('PRAGMA encoding').get();

    // 获取有问题的文章数据
    const articles = db.prepare('SELECT id, title, hex(title) as title_hex FROM generated_content WHERE id IN (2, 3, 4)').all();

    // 测试插入新的中文数据
    const testTitle = '测试中文标题';
    const testInsert = db.prepare('INSERT INTO generated_content (topic_id, title, content, status, word_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      1,
      testTitle,
      '测试内容',
      'draft',
      4,
      Math.floor(Date.now() / 1000),
      Math.floor(Date.now() / 1000)
    );

    // 查询刚插入的数据
    const insertedArticle = db.prepare('SELECT id, title, hex(title) as title_hex FROM generated_content WHERE id = ?').get(testInsert.lastInsertRowid);

    return NextResponse.json({
      success: true,
      pragmaEncoding,
      existingArticles: articles,
      insertedArticle,
      testTitle
    });
  } catch (error) {
    console.error('Debug encoding error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}