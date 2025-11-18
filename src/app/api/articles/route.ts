import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET() {
  try {
    const db = getDatabase();

    // 查询所有生成的内容（草稿和已发布的文章）
    const query = `
      SELECT
        id,
        title,
        content,
        status,
        insights_reference,
        created_at,
        updated_at
      FROM generated_content
      ORDER BY updated_at DESC
    `;

    const articles = db.prepare(query).all() as Array<{
      id: number;
      title: string | null;
      content: string;
      status: string;
      insights_reference: string | null;
      created_at: number;
      updated_at: number;
    }>;

    // 转换数据格式
    const formattedArticles = articles.map(article => {
      // 解析图片数据
      let selectedImages = [];
      try {
        if (article.insights_reference) {
          // 尝试解析JSON
          const parsed = JSON.parse(article.insights_reference);
          if (Array.isArray(parsed)) {
            selectedImages = parsed;
          }
        }
      } catch (e) {
        // 解析失败时保持为空数组
        selectedImages = [];
      }

      return {
        id: article.id.toString(),
        title: article.title || '未命名文章',
        content: article.content,
        status: {
          type: article.status,
          label: article.status === 'draft' ? '草稿' :
                 article.status === 'published' ? '已发布' :
                 article.status === 'archived' ? '已归档' : '待发布',
          color: article.status === 'draft' ? 'gray' :
                 article.status === 'published' ? 'green' : 'orange'
        },
        createdAt: new Date(article.created_at * 1000).toISOString().split('T')[0],
        updatedAt: new Date(article.updated_at * 1000).toISOString().split('T')[0],
        platforms: [], // 发布平台信息，后续可以扩展
        selectedImages: selectedImages, // 从数据库解析出的图片数据
        metadata: {
          insightSource: 'ai_insight',
          topicTitle: article.title
        }
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedArticles,
      total: formattedArticles.length
    }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    });

  } catch (error) {
    console.error('获取文章列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取文章列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      content,
      status = 'draft',
      selectedImages = [],
      topicTitle,
      topicDescription,
      insightKeyword,
      insightSource = 'ai_insight'
    } = body;

    if (!content) {
      return NextResponse.json(
        { success: false, error: '文章内容不能为空' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const now = Math.floor(Date.now() / 1000); // 转换为Unix时间戳

    // 插入到generated_content表
    const insertQuery = `
      INSERT INTO generated_content (
        topic_id,
        title,
        content,
        status,
        word_count,
        insights_reference,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // 计算字数
    const wordCount = content.length;

    // 优先使用AI生成的标题，其次使用推荐的选题标题
    const finalTitle = title || topicTitle || '未命名文章';

    // 将选中的图片转换为JSON字符串保存
    const imagesJson = selectedImages && selectedImages.length > 0
      ? JSON.stringify(selectedImages)
      : null;

    const result = db.prepare(insertQuery).run(
      1, // topic_id 使用创建的测试主题ID
      finalTitle,
      content,
      status,
      wordCount,
      imagesJson,
      now,
      now
    );

    console.log(`文章保存成功，ID: ${result.lastInsertRowid}`);

    return NextResponse.json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        title: title || topicTitle || '未命名文章',
        status,
        createdAt: new Date(now * 1000).toISOString().split('T')[0],
        updatedAt: new Date(now * 1000).toISOString().split('T')[0]
      }
    }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    });

  } catch (error) {
    console.error('保存文章失败:', error);
    return NextResponse.json(
      { success: false, error: '保存文章失败' },
      { status: 500 }
    );
  }
}