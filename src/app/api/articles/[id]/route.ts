import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: articleId } = await params;

    if (!articleId) {
      return NextResponse.json(
        { success: false, error: '文章ID不能为空' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, content, status = 'draft' } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { success: false, error: '标题和内容不能为空' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // 检查文章是否存在
    const checkQuery = 'SELECT id FROM generated_content WHERE id = ?';
    const existingArticle = db.prepare(checkQuery).get(articleId);

    if (!existingArticle) {
      return NextResponse.json(
        { success: false, error: '文章不存在' },
        { status: 404 }
      );
    }

    // 更新文章
    const now = Math.floor(Date.now() / 1000);
    const updateQuery = `
      UPDATE generated_content
      SET title = ?, content = ?, status = ?, word_count = ?, updated_at = ?
      WHERE id = ?
    `;

    const wordCount = content.length;
    const result = db.prepare(updateQuery).run(
      title.trim(),
      content.trim(),
      status,
      wordCount,
      now,
      articleId
    );

    if (result.changes > 0) {
      console.log(`文章更新成功，ID: ${articleId}`);
      return NextResponse.json({
        success: true,
        message: '文章更新成功',
        data: {
          id: articleId,
          title: title.trim(),
          status,
          updatedAt: new Date(now * 1000).toISOString().split('T')[0]
        }
      }, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      });
    } else {
      return NextResponse.json(
        { success: false, error: '更新失败，文章可能不存在' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('更新文章失败:', error);
    return NextResponse.json(
      { success: false, error: '更新文章失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: articleId } = await params;

    if (!articleId) {
      return NextResponse.json(
        { success: false, error: '文章ID不能为空' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // 检查文章是否存在
    const checkQuery = 'SELECT id FROM generated_content WHERE id = ?';
    const existingArticle = db.prepare(checkQuery).get(articleId);

    if (!existingArticle) {
      return NextResponse.json(
        { success: false, error: '文章不存在' },
        { status: 404 }
      );
    }

    // 删除文章
    const deleteQuery = 'DELETE FROM generated_content WHERE id = ?';
    const result = db.prepare(deleteQuery).run(articleId);

    if (result.changes > 0) {
      console.log(`文章删除成功，ID: ${articleId}`);
      return NextResponse.json({
        success: true,
        message: '文章删除成功'
      });
    } else {
      return NextResponse.json(
        { success: false, error: '删除失败，文章可能不存在' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('删除文章失败:', error);
    return NextResponse.json(
      { success: false, error: '删除文章失败' },
      { status: 500 }
    );
  }
}