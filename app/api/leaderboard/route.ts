
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT username, best_score as "bestScore", games_played as "gamesPlayed", wins
      FROM users
      ORDER BY best_score DESC
      LIMIT 10
    `);
    const leaderboard = result.rows.map(row => ({
      username: row.username,
      bestScore: row.bestScore,
      gamesPlayed: row.gamesPlayed,
      winPercentage: row.gamesPlayed > 0 ? (row.wins / row.gamesPlayed) * 100 : 0
    }));
    return NextResponse.json(leaderboard);
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
