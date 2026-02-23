import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { rows } = await sql`SELECT id, title, image_url, year, genre FROM movies`;
    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching movies for debug:', error);
    return NextResponse.json({ error: 'Failed to fetch movies for debug' }, { status: 500 });
  }
}
