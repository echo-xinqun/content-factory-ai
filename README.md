# 内容工厂 - Content Factory

一个基于 Next.js 的智能内容创作与发布管理平台原型。

## 项目概述

内容工厂是一个集选题分析、内容创作、发布管理于一体的综合性内容管理平台，帮助用户高效地进行内容生产和管理。

### 核心功能

#### 1. 选题分析 🔍
- 关键词搜索获取公众号文章数据
- AI 驱动的文章概要分析
- 智能选题洞察报告生成
- 高频词云可视化
- Top 5 点赞文章和互动率文章分析

#### 2. 内容创作 📝
- 基于选题洞察的 AI 文章生成
- Unsplash 图片自动集成
- 文章预览和编辑功能
- 草稿保存功能

#### 3. 发布管理 📋
- 多平台发布支持（小红书、公众号、抖音、视频号）
- 文章状态管理（草稿、待发布、已发布、发布失败）
- 批量操作功能
- 搜索和筛选功能

#### 4. 数据仪表盘 📊
- 内容生产趋势图表
- 发布平台分布饼状图
- 关键数据指标展示
- 最近活动时间线
- 热门选题和最佳表现文章

## 技术栈

- **前端框架**: Next.js 16 (App Router)
- **UI 组件**: Tailwind CSS + Lucide React Icons
- **图表库**: Recharts
- **类型检查**: TypeScript
- **开发工具**: ESLint

## 项目结构

```
src/
├── app/                    # Next.js App Router 页面
│   ├── analysis/          # 选题分析页面
│   ├── create/            # 内容创作页面
│   ├── publish/           # 发布管理页面
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 仪表盘页面
│   └── globals.css        # 全局样式
├── components/            # React 组件
│   ├── Layout.tsx         # 布局组件
│   ├── Sidebar.tsx        # 侧边导航
│   ├── Dashboard.tsx      # 仪表盘组件
│   ├── Analysis.tsx       # 选题分析组件
│   ├── Create.tsx         # 内容创作组件
│   └── Publish.tsx        # 发布管理组件
└── types/                 # TypeScript 类型定义
    └── index.ts
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

应用将在 http://localhost:3000 启动。

### 构建生产版本

```bash
npm run build
npm start
```

## 页面导航

- **仪表盘** (`/`) - 数据概览和快速操作
- **选题分析** (`/analysis`) - 关键词分析和选题洞察
- **内容创作** (`/create`) - AI 文章生成和编辑
- **发布管理** (`/publish`) - 文章发布和状态管理

## 功能特性

### 响应式设计
- 支持桌面端和移动端
- 自适应布局
- 触摸友好的交互

### 数据可视化
- 交互式图表
- 实时数据更新
- 多维度数据展示

### 用户体验
- 直观的导航结构
- 清晰的状态指示
- 流畅的交互动画

## 开发说明

这是一个前端原型项目，目前使用模拟数据展示功能。后端 API 集成将在后续阶段实现：

- 公众号文章数据获取 API
- OpenAI 兼容的 AI 分析接口
- Unsplash 图片 API
- 多平台发布 API
- SQLite 数据库集成

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License