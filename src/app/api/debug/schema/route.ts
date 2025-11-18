import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET() {
  try {
    const db = getDatabase();

    // Get all table names
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();

    // Get schema for each table
    const schema: Record<string, any> = {};
    tables.forEach((table: any) => {
      const tableName = table.name;
      try {
        const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
        schema[tableName] = columns;
      } catch (e) {
        schema[tableName] = { error: 'Could not get table info' };
      }
    });

    return NextResponse.json({
      success: true,
      tables: tables.map((t: any) => t.name),
      schema
    });
  } catch (error) {
    console.error('Debug schema error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}