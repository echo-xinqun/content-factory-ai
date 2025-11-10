import { NextRequest, NextResponse } from 'next/server';
import { createOrUpdateSearchRecord, getSearchHistoryList, deleteSearchHistory, searchHistoryRecords } from '@/models/SearchHistory';
import { cleanupOldRecords } from '@/lib/db';

// GET - 获取搜索历史列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '30');

    let records;
    if (search) {
      records = searchHistoryRecords(search, limit);
    } else {
      records = getSearchHistoryList(limit);
    }

    return NextResponse.json({
      success: true,
      data: records
    });
  } catch (error) {
    console.error('Failed to get search history:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - 保存或更新搜索记录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, articles, wordCloud, insights } = body;

    if (!keyword || !articles || !wordCloud || !insights) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: keyword, articles, wordCloud, insights'
        },
        { status: 400 }
      );
    }

    const searchId = createOrUpdateSearchRecord(keyword, articles, wordCloud, insights);

    // 清理旧记录，只保留最近30条
    cleanupOldRecords();

    return NextResponse.json({
      success: true,
      data: {
        id: searchId,
        keyword,
        totalArticles: articles.length,
        message: 'Search record saved successfully'
      }
    });
  } catch (error) {
    console.error('Failed to save search record:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - 删除搜索记录
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameter: id'
        },
        { status: 400 }
      );
    }

    const success = deleteSearchHistory(parseInt(id));

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Search record deleted successfully'
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Search record not found'
        },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Failed to delete search record:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}