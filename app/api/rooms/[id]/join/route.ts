
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Room } from '@/types';

async function getRoom(roomId: string): Promise<Room | null> {
  const result = await pool.query('SELECT state FROM rooms WHERE id = $1', [roomId]);
  if (result.rows.length === 0) return null;
  return result.rows[0].state as Room;
}

async function saveRoom(room: Room) {
  await pool.query(
    'INSERT INTO rooms (id, state, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (id) DO UPDATE SET state = $2, updated_at = CURRENT_TIMESTAMP',
    [room.id, JSON.stringify(room)]
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params;
  try {
    const { player } = await request.json();
    let room = await getRoom(roomId);
    
    if (!room) {
      const moviesResult = await pool.query('SELECT * FROM movies ORDER BY RANDOM() LIMIT 10');
      room = {
        id: roomId,
        hostId: player.id,
        players: [],
        status: 'waiting',
        currentMovieIndex: 0,
        movies: moviesResult.rows.map(row => ({
          id: row.id,
          title: row.title,
          imageUrl: row.image_url,
          year: row.year,
          genre: row.genre
        })),
        timer: 10
      };
    }

    if (!room.players.find(p => p.id === player.id)) {
      room.players.push({ ...player, score: 0, isReady: false, results: [] });
    }
    
    await saveRoom(room);
    return NextResponse.json(room);
  } catch (err) {
    console.error('Error joining room:', err);
    return NextResponse.json({ error: 'Failed to join room' }, { status: 500 });
  }
}
