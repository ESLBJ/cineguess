
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM movies');
    return NextResponse.json(result.rows.map(row => ({
      id: row.id,
      title: row.title,
      imageUrl: row.image_url,
      year: row.year,
      genre: row.genre
    })));
  } catch (err) {
    console.error('Error fetching movies:', err);
    return NextResponse.json({ error: 'Failed to fetch movies' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { id, title, imageUrl, year, genre } = await request.json();
    const result = await pool.query(
      'INSERT INTO movies (id, title, image_url, year, genre) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, title, imageUrl, year, genre]
    );
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error('Error adding movie:', err);
    return NextResponse.json({ error: 'Failed to add movie' }, { status: 500 });
  }
}
