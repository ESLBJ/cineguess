
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM users');
    return NextResponse.json(result.rows.map(row => ({
      id: row.id,
      username: row.username,
      email: row.email,
      password: row.password,
      bestScore: row.best_score,
      gamesPlayed: row.games_played,
      wins: row.wins,
      isAdmin: row.is_admin
    })));
  } catch (err) {
    console.error('Error fetching users:', err);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { id, username, email, password, isAdmin } = await request.json();
    const result = await pool.query(
      'INSERT INTO users (id, username, email, password, is_admin) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, username, email, password, isAdmin]
    );
    const row = result.rows[0];
    return NextResponse.json({
      id: row.id,
      username: row.username,
      email: row.email,
      password: row.password,
      bestScore: row.best_score,
      gamesPlayed: row.games_played,
      wins: row.wins,
      isAdmin: row.is_admin
    });
  } catch (err) {
    console.error('Error registering user:', err);
    return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
  }
}
