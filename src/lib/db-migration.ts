import { Database } from 'better-sqlite3';
import path from 'path';

// 数据库迁移脚本
export function runMigrations(db: Database) {
  console.log('Running database migrations...');

  try {
    // 检查ai_analysis_results表是否有id列
    const tableInfo = db.prepare(`
      PRAGMA table_info(ai_analysis_results)
    `).all() as any[];

    const hasIdColumn = tableInfo.some(col => col.name === 'id');

    if (!hasIdColumn) {
      console.log('Adding id column to ai_analysis_results table...');

      // 1. 备份数据
      const backupData = db.prepare(`
        SELECT * FROM ai_analysis_results
      `).all();

      // 2. 删除旧表
      db.prepare(`DROP TABLE IF EXISTS ai_analysis_results`).run();

      // 3. 重新创建表
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

      // 4. 恢复数据
      if (backupData.length > 0) {
        const insert = db.prepare(`
          INSERT INTO ai_analysis_results (
            search_id, analysis_type, result_data, confidence_score,
            processing_time, ai_model, articles_analyzed, tokens_used,
            version, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        backupData.forEach((row: any) => {
          insert.run(
            row.search_id,
            row.analysis_type || 'enhanced',
            row.result_data || '{}',
            row.confidence_score || 0,
            row.processing_time || 0,
            row.ai_model || 'gpt-4',
            row.articles_analyzed || 0,
            row.tokens_used || 0,
            row.version || '2.0',
            row.created_at || Math.floor(Date.now() / 1000),
            row.updated_at || Math.floor(Date.now() / 1000)
          );
        });
      }

      console.log('ai_analysis_results table migration completed');
    }

    // 重新创建索引
    db.exec(`
      DROP INDEX IF EXISTS idx_ai_analysis_results_search_id;
      DROP INDEX IF EXISTS idx_ai_analysis_results_created_at;

      CREATE INDEX IF NOT EXISTS idx_ai_analysis_results_search_id ON ai_analysis_results(search_id);
      CREATE INDEX IF NOT EXISTS idx_ai_analysis_results_created_at ON ai_analysis_results(created_at DESC);
    `);

    console.log('Database migrations completed successfully');

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// 手动执行迁移的函数
export function manuallyRunMigrations() {
  const Database = require('better-sqlite3');
  const dbPath = path.join(process.cwd(), 'data', 'search_history.db');

  try {
    const db = new Database(dbPath);
    runMigrations(db);
    db.close();
    console.log('Manual migration completed successfully');
  } catch (error) {
    console.error('Manual migration failed:', error);
  }
}