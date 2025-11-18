import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIService } from '@/services/openAIService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      keyword,
      selectedTopic,
      insightData,
      generationParams
    } = body;

    // 验证必需参数
    if (!selectedTopic) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameter: selectedTopic'
        },
        { status: 400 }
      );
    }

    // 获取AI服务
    const openAIService = getOpenAIService();

    // 构建文章生成Prompt
    const systemPrompt = `你是一个专业的内容创作者，擅长基于数据洞察生成高质量的行业分析文章。

任务要求：
1. 基于提供的洞察报告和选题，生成专业的行业分析文章
2. 文章应该结构清晰、内容详实、观点独到
3. 融合AI分析洞察，提供有价值的数据支撑
4. 语言流畅，符合专业写作标准

写作规范：
- 使用Markdown格式
- 包含标题、小标题、正文结构
- 适当使用数据和分析观点
- 保持客观专业的语调
- 字数控制在合理范围内`;

    const userPrompt = generateContentPrompt(keyword, selectedTopic, insightData, generationParams);

    // 调用AI生成内容
    const generatedContent = await openAIService.sendPrompt(userPrompt, systemPrompt);

    // 生成文章标题
    const titlePrompt = `基于以下信息，生成一个吸引人且专业的文章标题：

选题：${selectedTopic}
关键词：${keyword}
${insightData ? `相关洞察：${JSON.stringify(insightData).substring(0, 500)}...` : ''}

要求：
1. 标题要简洁有力，体现文章核心价值
2. 包含关键词或核心概念
3. 具有一定的吸引力但不过度夸张
4. 字数控制在20-30字之间
5. 只返回标题，不需要其他内容`;

    const generatedTitle = await openAIService.sendPrompt(titlePrompt);

    // 生成模拟图片提示词（用于未来图片生成）
    const imagePrompts = await generateImagePrompts(selectedTopic, keyword, insightData);

    return NextResponse.json({
      success: true,
      data: {
        title: generatedTitle.trim(),
        content: generatedContent.trim(),
        imagePrompts,
        metadata: {
          keyword,
          selectedTopic,
          generationParams,
          generatedAt: Date.now(),
          wordCount: generatedContent.length
        }
      }
    });

  } catch (error) {
    console.error('AI内容生成失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// 构建内容生成的详细Prompt
function generateContentPrompt(
  keyword: string,
  selectedTopic: string,
  insightData: any,
  generationParams: any
): string {
  let prompt = `请基于以下信息生成一篇高质量的行业分析文章：

## 基本信息
- 核心关键词：${keyword}
- 选择选题：${selectedTopic}
- 目标字数：${generationParams?.length || 2000}字左右
- 创新程度：${generationParams?.innovation || '中等创新'}
- 专业深度：${generationParams?.professional || '专业级'}
- 目标受众：${generationParams?.audience || '行业从业者'}

`;

  if (insightData) {
    prompt += `## 数据洞察支撑\n`;

    // 添加话题洞察
    if (insightData.topicInsights && insightData.topicInsights.length > 0) {
      prompt += `### 话题趋势洞察\n`;
      insightData.topicInsights.slice(0, 3).forEach((insight: any, index: number) => {
        prompt += `${index + 1}. ${insight.trend}（置信度：${Math.round(insight.confidence * 100)}%）\n`;
        if (insight.evidence && insight.evidence.length > 0) {
          prompt += `   支撑证据：${insight.evidence.slice(0, 2).join('、')}\n`;
        }
      });
      prompt += '\n';
    }

    // 添加机会识别
    if (insightData.opportunities && insightData.opportunities.length > 0) {
      prompt += `### 市场机会分析\n`;
      insightData.opportunities.slice(0, 2).forEach((opp: any, index: number) => {
        prompt += `${index + 1}. 机会：${opp.gap}\n`;
        prompt += `   市场潜力：${opp.potential}\n`;
        if (opp.suggestedAction) {
          prompt += `   建议行动：${opp.suggestedAction}\n`;
        }
      });
      prompt += '\n';
    }

    // 添加情感分析
    if (insightData.sentimentAnalysis) {
      const sentiment = insightData.sentimentAnalysis;
      prompt += `### 用户情感分析\n`;
      prompt += `- 整体情感倾向：${sentiment.overall === 'positive' ? '积极' : sentiment.overall === 'negative' ? '消极' : '中性'}\n`;
      if (sentiment.dominantEmotion) {
        prompt += `- 主导情感：${sentiment.dominantEmotion}\n`;
      }
      if (sentiment.emotionalTone && sentiment.emotionalTone.length > 0) {
        prompt += `- 情感调性：${sentiment.emotionalTone.join('、')}\n`;
      }
      prompt += '\n';
    }
  }

  prompt += `## 写作要求

### 文章结构
请按照以下结构组织文章：
1. **引言** - 简要介绍背景和文章价值
2. **现状分析** - 基于@数据洞察分析当前发展状况
3. **发展趋势** - 分析未来发展方向和趋势
4. **机遇挑战** - 基于机会识别分析发展机遇和面临的挑战
5. **结论建议** - 总结观点并提出建设性建议

### 内容要求
- 适当融入上述数据洞察，增强文章的说服力
- 结合专业深度要求，提供有价值的分析观点
- 根据创新程度调整观点的独到性和前瞻性
- 语言要符合目标受众的理解水平和专业需求
- 保持逻辑清晰，层次分明

### 风格要求
- 专业客观，避免过度夸张
- 数据支撑，观点明确
- 结构完整，内容详实
- 便于阅读和理解

请开始生成文章：`;

  return prompt;
}

// 生成图片提示词
async function generateImagePrompts(selectedTopic: string, keyword: string, insightData: any): Promise<string[]> {
  const basePrompts = [
    `${keyword}相关的科技感专业图表，数据可视化风格`,
    `${keyword}发展趋势示意图，现代简约风格`,
    `${keyword}应用场景展示，商务专业风格`
  ];

  // 如果有具体的洞察数据，生成更精准的图片提示
  if (insightData?.topicInsights && insightData.topicInsights.length > 0) {
    const topInsight = insightData.topicInsights[0];
    basePrompts.unshift(`${topInsight.trend}的专业配图，科技数据分析风格`);
  }

  if (insightData?.opportunities && insightData.opportunities.length > 0) {
    basePrompts.push(`${insightData.opportunities[0].gap}的机遇分析图，商业策略风格`);
  }

  return basePrompts.slice(0, 3); // 返回最多3个图片提示词
}