import { NextRequest, NextResponse } from 'next/server';
import { getSiliconFlowService } from '@/services/siliconflowService';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompts, style = 'tech', onProgress } = body;

    if (!prompts || !Array.isArray(prompts)) {
      return NextResponse.json(
        { success: false, error: '缺少图片提示词数组' },
        { status: 400 }
      );
    }

    const siliconFlowService = getSiliconFlowService();

    // 创建本地存储目录
    const uploadsDir = path.join(process.cwd(), 'public', 'generated-images');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // 生成图片
    const results = await siliconFlowService.generateMultipleImages(
      prompts.map(p => p.prompt),
      style,
      (current, total) => {
        console.log(`图片生成进度: ${current}/${total}`);
      }
    );

    // 下载并保存图片到本地
    const savedImages = [];
    for (let i = 0; i < results.length; i++) {
      try {
        const result = results[i];
        const response = await fetch(result.url);

        if (!response.ok) {
          throw new Error(`下载图片失败: ${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        const timestamp = Date.now();
        const filename = `image_${timestamp}_${i}.jpg`;
        const filepath = path.join(uploadsDir, filename);

        // 保存文件
        fs.writeFileSync(filepath, Buffer.from(buffer));

        savedImages.push({
          index: result.index,
          url: `/generated-images/${filename}`,
          originalUrl: result.url,
          prompt: result.prompt,
          description: prompts[result.index]?.description || `图片 ${result.index + 1}`,
          localPath: filepath
        });

      } catch (error) {
        console.error(`保存图片 ${i} 失败:`, error);
        // 返回占位图URL作为降级方案
        savedImages.push({
          index: results[i]?.index || i,
          url: generatePlaceholderImage(),
          originalUrl: '',
          prompt: prompts[i]?.prompt || '',
          description: prompts[i]?.description || `图片 ${i + 1}`,
          localPath: null,
          error: true
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: savedImages,
      total: savedImages.length,
      generatedAt: Date.now()
    });

  } catch (error) {
    console.error('生成图片失败:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        fallbackData: generateFallbackImages(body.prompts?.length || 3)
      },
      { status: 500 }
    );
  }
}

// 生成占位图片URL（降级方案）
function generatePlaceholderImage(index: number = 0): string {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f3f4f6' width='400' height='300'/%3E%3Cg fill='%239ca3af' text-anchor='middle' font-family='Arial, sans-serif'%3E%3Ctext x='200' y='140' font-size='16'%3E🖼️ 图片生成中...%3C/text%3E%3Ctext x='200' y='160' font-size='12'%3E图片 ${index + 1}%3C/text%3E%3C/g%3E%3C/svg%3E`;
}

// 生成降级图片数组
function generateFallbackImages(count: number): Array<{url: string; description: string; index: number}> {
  return Array.from({ length: count }, (_, i) => ({
    index: i,
    url: generatePlaceholderImage(i),
    description: `图片 ${i + 1}`,
    error: true
  }));
}