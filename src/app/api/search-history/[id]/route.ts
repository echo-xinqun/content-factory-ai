import { NextRequest, NextResponse } from 'next/server';
import { getSearchHistoryDetail } from '@/models/SearchHistory';

// GET - 获取搜索记录详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid ID parameter'
        },
        { status: 400 }
      );
    }

    const detail = getSearchHistoryDetail(id);

    if (!detail) {
      return NextResponse.json(
        {
          success: false,
          error: 'Search record not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: detail
    });
  } catch (error) {
    console.error('Failed to get search history detail:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}