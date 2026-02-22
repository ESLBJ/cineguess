
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { score, isWin } = await request.json();
    const result = await pool.query(
      `UPDATE users 
       SET best_score = GREATEST(best_score, $1),
           games_played = games_played + 1,
           wins = wins + ${isWin ? 1 : 0}
       WHERE id = $2
       RETURNING *`,
      [score, id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
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
    console.error('Error updating score:', err);
    return NextResponse.json({ error: 'Failed to update score' }, { status: 500 });
  }
}
