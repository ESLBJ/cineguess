
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    await pool.query('SELECT 1');
    return NextResponse.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    console.error('Health check failed:', err);
    return NextResponse.json({ status: 'error', database: 'disconnected', error: String(err) }, { status: 500 });
  }
}
