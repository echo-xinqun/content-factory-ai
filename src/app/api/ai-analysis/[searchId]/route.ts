import { NextRequest, NextResponse } from 'next/server';
import { getAIAnalysisResult } from '@/models/SearchHistory';

// GET - 获取保存的AI分析结果
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ searchId: string }> }
) {
  try {
    const { searchId: searchIdParam } = await params;
    const searchId = parseInt(searchIdParam);

    if (isNaN(searchId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid searchId parameter'
        },
        { status: 400 }
      );
    }

    const aiResult = getAIAnalysisResult(searchId);

    if (!aiResult) {
      return NextResponse.json(
        {
          success: false,
          message: 'No saved AI analysis found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: aiResult
    });
  } catch (error) {
    console.error('Failed to get AI analysis result:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}