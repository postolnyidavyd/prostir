import { prisma } from '../db/client.js';
import type { RoomFilter } from '../schemas/room.js';

export type PublicRoom = {
  id: string;
  name: string;
  imageUrl: string;
  capacity: number;
  floor: number;
};

export function listRooms(filter: RoomFilter): Promise<PublicRoom[]> {
  return prisma.room.findMany({
    where: {
      ...(filter.floor !== undefined && { floor: filter.floor }),
      ...(filter.minCapacity !== undefined && { capacity: { gte: filter.minCapacity } }),
    },
    orderBy: [{ floor: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, imageUrl: true, capacity: true, floor: true },
  });
}
