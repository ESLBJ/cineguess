
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
    const { type, playerId, ...payload } = await request.json();
    const room = await getRoom(roomId);
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

    const player = room.players.find(p => p.id === playerId);
    if (!player && type !== 'EXIT') return NextResponse.json({ error: 'Player not in room' }, { status: 403 });

    switch (type) {
      case 'READY':
        if (player) player.isReady = true;
        if (room.players.every(p => p.isReady) && room.players.length >= 1) {
          room.status = 'playing';
          room.roundStartTime = Date.now();
        }
        break;
      case 'RENAME':
        if (player) player.username = payload.username;
        break;
      case 'SUBMIT_ANSWER':
        if (player && room.status === 'playing') {
          const { isCorrect, movieId } = payload;
          if (isCorrect) player.score += 1;
          player.lastAnswerCorrect = isCorrect;
          if (!player.results.find(r => r.movieId === movieId)) {
            player.results.push({ movieId, isCorrect });
          }
        }
        break;
      case 'EXIT':
        room.players = room.players.filter(p => p.id !== playerId);
        if (room.players.length === 0) {
          await pool.query('DELETE FROM rooms WHERE id = $1', [roomId]);
          return NextResponse.json({ status: 'deleted' });
        } else if (room.hostId === playerId) {
          room.hostId = room.players[0].id;
        }
        break;
    }

    await saveRoom(room);
    return NextResponse.json(room);
  } catch (err) {
    console.error('Error performing action:', err);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
