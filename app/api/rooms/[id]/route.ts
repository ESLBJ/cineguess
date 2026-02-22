
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Room } from '@/types';

async function getRoom(roomId: string): Promise<Room | null> {
  const result = await pool.query('SELECT state FROM rooms WHERE id = $1', [roomId]);
  if (result.rows.length === 0) return null;
  let room = result.rows[0].state as Room;
  
  // Progress state if playing
  if (room.status === 'playing' && room.roundStartTime) {
    const now = Date.now();
    const elapsed = Math.floor((now - room.roundStartTime) / 1000);
    const newTimer = Math.max(0, 10 - elapsed);
    
    if (newTimer === 0 && room.timer > 0) {
      // Round ended
      if (room.currentMovieIndex < room.movies.length - 1) {
        room.currentMovieIndex += 1;
        room.timer = 10;
        room.roundStartTime = Date.now();
        room.players.forEach(p => p.lastAnswerCorrect = undefined);
      } else {
        room.status = 'finished';
        room.timer = 0;
      }
      await saveRoom(room);
    } else if (newTimer !== room.timer) {
      room.timer = newTimer;
      await saveRoom(room);
    }
  }
  
  return room;
}

async function saveRoom(room: Room) {
  await pool.query(
    'INSERT INTO rooms (id, state, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (id) DO UPDATE SET state = $2, updated_at = CURRENT_TIMESTAMP',
    [room.id, JSON.stringify(room)]
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const room = await getRoom(id);
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    return NextResponse.json(room);
  } catch (err) {
    console.error('Error fetching room:', err);
    return NextResponse.json({ error: 'Failed to fetch room' }, { status: 500 });
  }
}
