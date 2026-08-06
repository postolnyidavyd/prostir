import { prisma } from '../db/client.js';
import type { RoomFilter } from '../schemas/room.js';

export type PublicRoom = {
  id: string;
  name: string;
  imageUrl: string;
  capacity: number;
  floor: number;
  // присутнє лише коли в запиті задано вікно from/to
  available?: boolean;
};

export type RoomFilterOptions = {
  floors: number[];
  maxCapacity: number;
};

// дані для панелі фільтрів: які поверхи бувають і найбільша місткість
export async function getRoomFilterOptions(): Promise<RoomFilterOptions> {
  const rooms = await prisma.room.findMany({ select: { floor: true, capacity: true } });
  const floors = [...new Set(rooms.map((room) => room.floor))].sort((a, b) => a - b);
  const capacities = rooms.map((room) => room.capacity);

  return {
    floors,
    maxCapacity: capacities.length > 0 ? Math.max(...capacities) : 0,
  };
}

export async function listRooms(filter: RoomFilter): Promise<PublicRoom[]> {
  const rooms = await prisma.room.findMany({
    where: {
      ...(filter.floors && filter.floors.length > 0 && { floor: { in: filter.floors } }),
      ...(filter.minCapacity !== undefined && { capacity: { gte: filter.minCapacity } }),
    },
    orderBy: [{ floor: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, imageUrl: true, capacity: true, floor: true },
  });


  if (filter.from === undefined || filter.to === undefined) {
    return rooms;
  }

  const busy = await prisma.booking.findMany({
    where: {
      roomId: { in: rooms.map((room) => room.id) },
      canceledAt: null,
      startsAt: { lt: filter.to },
      endsAt: { gt: filter.from },
    },
    select: { roomId: true },
    distinct: ['roomId'],
  });

  const busyIds = new Set(busy.map((booking) => booking.roomId));
  const withAvailability = rooms.map((room) => ({ ...room, available: !busyIds.has(room.id) }));

  return filter.onlyFree ? withAvailability.filter((room) => room.available) : withAvailability;
}
