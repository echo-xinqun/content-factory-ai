import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { runMigrations } from './db-migration';

// 数据库文件路径
const DB_PATH = path.join(process.cwd(), 'data', 'content-factory.db');

// 确保数据目录存在
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 创建数据库连接
export const db = new Database(DB_PATH);

// 启用外键约束
db.pragma('foreign_keys = ON');

// 创建表结构
export function initializeDatabase() {
  // 创建搜索历史表
  db.exec(`
    CREATE TABLE IF NOT EXISTS search_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keyword TEXT NOT NULL,
      search_time INTEGER NOT NULL,
      total_articles INTEGER NOT NULL DEFAULT 0,
      avg_read_count INTEGER NOT NULL DEFAULT 0,
      avg_like_count INTEGER NOT NULL DEFAULT 0,
      avg_interaction_rate REAL NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      UNIQUE(keyword)
    );
  `);

  // 创建文章表
  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      search_id INTEGER NOT NULL,
      article_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      summary TEXT,
      wx_name TEXT,
      publish_time TEXT,
      read_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      interactive_rate REAL DEFAULT 0,
      url TEXT,
      avatar TEXT,
      classify TEXT,
      is_original INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (search_id) REFERENCES search_history (id) ON DELETE CASCADE,
      UNIQUE(search_id, article_id)
    );
  `);

  // 创建词云表
  db.exec(`
    CREATE TABLE IF NOT EXISTS word_clouds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      search_id INTEGER NOT NULL,
      word TEXT NOT NULL,
      count INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (search_id) REFERENCES search_history (id) ON DELETE CASCADE
    );
  `);

  // 创建分析洞察表
  db.exec(`
    CREATE TABLE IF NOT EXISTS insights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      search_id INTEGER NOT NULL,
      insight TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (search_id) REFERENCES search_history (id) ON DELETE CASCADE
    );
  `);

  // AI分析结果表
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_analysis_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      search_id INTEGER NOT NULL,
      analysis_type TEXT NOT NULL DEFAULT 'enhanced',
      result_data TEXT NOT NULL, -- JSON格式存储AI分析结果
      confidence_score REAL DEFAULT 0,
      processing_time INTEGER DEFAULT 0,
      ai_model TEXT DEFAULT 'gpt-4',
      articles_analyzed INTEGER DEFAULT 0,
      tokens_used INTEGER DEFAULT 0,
      version TEXT DEFAULT '2.0',
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (search_id) REFERENCES search_history (id) ON DELETE CASCADE
    );
  `);

  // 选题洞察专用表
  db.exec(`
    CREATE TABLE IF NOT EXISTS topic_insights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      search_id INTEGER NOT NULL,
      insight_id TEXT NOT NULL,
      trend_text TEXT NOT NULL,
      evidence TEXT, -- JSON数组存储支撑证据
      confidence REAL DEFAULT 0,
      recommendation TEXT,
      difficulty TEXT DEFAULT 'medium', -- 'easy' | 'medium' | 'hard'
      potential TEXT DEFAULT 'medium', -- 'high' | 'medium' | 'low'
      category TEXT DEFAULT 'trend', -- 'trend' | 'opportunity' | 'strategy' | 'content' | 'audience'
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (search_id) REFERENCES search_history (id) ON DELETE CASCADE
    );
  `);

  // 文章AI摘要表
  db.exec(`
    CREATE TABLE IF NOT EXISTS article_ai_summaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      search_id INTEGER NOT NULL,
      article_id TEXT NOT NULL,
      summary TEXT NOT NULL,
      key_points TEXT, -- JSON数组存储关键要点
      highlights TEXT, -- JSON数组存储文章亮点
      sentiment TEXT DEFAULT 'neutral',
      topics TEXT, -- JSON数组存储话题标签
      keywords TEXT, -- JSON数组存储关键词
      target_audience TEXT,
      content_value TEXT DEFAULT 'medium', -- 'high' | 'medium' | 'low'
      confidence REAL DEFAULT 0,
      processing_time INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (search_id) REFERENCES search_history (id) ON DELETE CASCADE,
      UNIQUE(search_id, article_id)
    );
  `);

  // AI情感分析表
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_sentiment_analysis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      search_id INTEGER NOT NULL,
      overall_sentiment TEXT NOT NULL,
      emotional_tone TEXT, -- JSON数组存储情感调性
      engagement_level TEXT DEFAULT 'medium',
      dominant_emotion TEXT,
      sentiment_score REAL DEFAULT 0,
      confidence REAL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (search_id) REFERENCES search_history (id) ON DELETE CASCADE
    );
  `);

  // AI机会识别表
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_opportunities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      search_id INTEGER NOT NULL,
      gap_description TEXT NOT NULL,
      potential TEXT,
      competition_level TEXT DEFAULT 'medium', -- 'low' | 'medium' | 'high'
      suggested_action TEXT,
      estimated_difficulty TEXT DEFAULT 'medium', -- 'easy' | 'medium' | 'hard'
      market_size TEXT,
      confidence REAL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (search_id) REFERENCES search_history (id) ON DELETE CASCADE
    );
  `);

  // AI分析任务状态表
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_analysis_tasks (
      id TEXT PRIMARY KEY,
      search_id INTEGER NOT NULL,
      keyword TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'processing' | 'completed' | 'failed' | 'cached'
      progress INTEGER DEFAULT 0,
      start_time INTEGER,
      end_time INTEGER,
      error_message TEXT,
      result_id INTEGER, -- 关联到ai_analysis_results表
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (search_id) REFERENCES search_history (id) ON DELETE CASCADE,
      FOREIGN KEY (result_id) REFERENCES ai_analysis_results(id) ON DELETE SET NULL
    );
  `);

  // AI分析缓存表
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_analysis_cache (
      search_id TEXT PRIMARY KEY,
      keyword TEXT NOT NULL,
      result_data TEXT NOT NULL, -- JSON格式存储完整的AI分析结果
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      expires_at INTEGER NOT NULL,
      hit_count INTEGER DEFAULT 1,
      last_accessed INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );
  `);

  // 生成内容表
  db.exec(`
    CREATE TABLE IF NOT EXISTS generated_content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      search_id INTEGER,
      insight_source TEXT NOT NULL DEFAULT 'ai_insight', -- 'ai_insight' | 'custom'
      selected_topic TEXT NOT NULL,
      generated_title TEXT,
      generated_content TEXT NOT NULL,
      selected_images TEXT, -- JSON数组存储选中的图片
      image_style TEXT DEFAULT 'tech', -- 'tech' | 'business' | 'education' | 'nature' | 'creative' | 'lifestyle'
      generation_params TEXT, -- JSON对象存储生成参数
      word_count INTEGER DEFAULT 0,
      generation_time INTEGER DEFAULT 0, -- 生成耗时（毫秒）
      ai_model TEXT DEFAULT 'deepseek-chat',
      tokens_used INTEGER DEFAULT 0,
      status TEXT DEFAULT 'draft', -- 'draft' | 'published' | 'archived'
      quality_score REAL DEFAULT 0, -- 内容质量评分 0-1
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (search_id) REFERENCES search_history (id) ON DELETE SET NULL
    );
  `);

  // 创建索引以提高查询性能
  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_search_history_keyword ON search_history(keyword);`);
  } catch (e) {
    console.log('Table search_history does not exist or missing keyword column, skipping index creation');
  }

  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_search_history_search_time ON search_history(search_time DESC);`);
  } catch (e) {
    console.log('Table search_history does not exist or missing search_time column, skipping index creation');
  }

  // 只有当表存在时才创建索引
  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_articles_search_id ON articles(search_id);`);
  } catch (e) {
    console.log('Table articles does not exist, skipping index creation');
  }

  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_articles_title ON articles(title);`);
  } catch (e) {
    console.log('Table articles does not exist, skipping index creation');
  }

  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_word_clouds_search_id ON word_clouds(search_id);`);
  } catch (e) {
    console.log('Table word_clouds does not exist, skipping index creation');
  }

  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_insights_search_id ON insights(search_id);`);
  } catch (e) {
    console.log('Table insights does not exist, skipping index creation');
  }

  // AI分析相关索引
  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_ai_analysis_results_search_id ON ai_analysis_results(search_id);`);
  } catch (e) {
    console.log('Table ai_analysis_results does not exist, skipping index creation');
  }

  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_ai_analysis_results_created_at ON ai_analysis_results(created_at DESC);`);
  } catch (e) {
    console.log('Table ai_analysis_results does not exist, skipping index creation');
  }

  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_topic_insights_search_id ON topic_insights(search_id);`);
  } catch (e) {
    console.log('Table topic_insights does not exist, skipping index creation');
  }

  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_topic_insights_confidence ON topic_insights(confidence DESC);`);
  } catch (e) {
    console.log('Table topic_insights does not exist, skipping index creation');
  }

  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_article_ai_summaries_search_id ON article_ai_summaries(search_id);`);
  } catch (e) {
    console.log('Table article_ai_summaries does not exist, skipping index creation');
  }

  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_article_ai_summaries_article_id ON article_ai_summaries(article_id);`);
  } catch (e) {
    console.log('Table article_ai_summaries does not exist, skipping index creation');
  }

  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_ai_sentiment_analysis_search_id ON ai_sentiment_analysis(search_id);`);
  } catch (e) {
    console.log('Table ai_sentiment_analysis does not exist, skipping index creation');
  }

  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_ai_opportunities_search_id ON ai_opportunities(search_id);`);
  } catch (e) {
    console.log('Table ai_opportunities does not exist, skipping index creation');
  }

  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_ai_analysis_tasks_status ON ai_analysis_tasks(status);`);
  } catch (e) {
    console.log('Table ai_analysis_tasks does not exist, skipping index creation');
  }

  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_ai_analysis_tasks_search_id ON ai_analysis_tasks(search_id);`);
  } catch (e) {
    console.log('Table ai_analysis_tasks does not exist, skipping index creation');
  }

  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_ai_analysis_cache_expires_at ON ai_analysis_cache(expires_at);`);
  } catch (e) {
    console.log('Table ai_analysis_cache does not exist, skipping index creation');
  }

  // 生成内容相关索引
  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_generated_content_topic_id ON generated_content(topic_id);`);
  } catch (e) {
    console.log('Table generated_content does not exist, skipping index creation');
  }

  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_generated_content_status ON generated_content(status);`);
  } catch (e) {
    console.log('Table generated_content does not exist, skipping index creation');
  }

  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_generated_content_created_at ON generated_content(created_at DESC);`);
  } catch (e) {
    console.log('Table generated_content does not exist, skipping index creation');
  }

  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_generated_content_insights_reference ON generated_content(insights_reference);`);
  } catch (e) {
    console.log('Table generated_content does not have insights_reference column, skipping index creation');
  }

  console.log('Database initialized successfully');

  // 运行数据库迁移
  runMigrations(db);
}

// 数据库清理：只保留最近30条搜索记录
export function cleanupOldRecords() {
  const cleanupQuery = `
    DELETE FROM search_history
    WHERE id NOT IN (
      SELECT id FROM search_history
      ORDER BY search_time DESC
      LIMIT 30
    );
  `;

  const result = db.prepare(cleanupQuery).run();
  console.log(`Cleaned up ${result.changes} old search records`);
  return result.changes;
}

// 清理过期的AI分析缓存
export function cleanupExpiredCache() {
  const cleanupQuery = `
    DELETE FROM ai_analysis_cache
    WHERE expires_at < strftime('%s', 'now');
  `;

  const result = db.prepare(cleanupQuery).run();
  console.log(`Cleaned up ${result.changes} expired cache records`);
  return result.changes;
}

// 清理失败的分析任务（保留最近7天）
export function cleanupFailedTasks() {
  const sevenDaysAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);

  const cleanupQuery = `
    DELETE FROM ai_analysis_tasks
    WHERE status = 'failed'
    AND created_at < ${sevenDaysAgo};
  `;

  const result = db.prepare(cleanupQuery).run();
  console.log(`Cleaned up ${result.changes} failed task records`);
  return result.changes;
}

// 获取数据库统计信息
export function getDatabaseStats() {
  const searchCount = db.prepare('SELECT COUNT(*) as count FROM search_history').get() as { count: number };
  const articleCount = db.prepare('SELECT COUNT(*) as count FROM articles').get() as { count: number };
  const aiAnalysisCount = db.prepare('SELECT COUNT(*) as count FROM ai_analysis_results').get() as { count: number };
  const topicInsightsCount = db.prepare('SELECT COUNT(*) as count FROM topic_insights').get() as { count: number };
  const cachedCount = db.prepare('SELECT COUNT(*) as count FROM ai_analysis_cache').get() as { count: number };
  const activeTasksCount = db.prepare("SELECT COUNT(*) as count FROM ai_analysis_tasks WHERE status IN ('pending', 'processing')").get() as { count: number };

  return {
    searchRecords: searchCount.count,
    totalArticles: articleCount.count,
    aiAnalyses: aiAnalysisCount.count,
    topicInsights: topicInsightsCount.count,
    cachedResults: cachedCount.count,
    activeTasks: activeTasksCount.count
  };
}

// 获取数据库实例
export function getDatabase() {
  return db;
}

export default db;