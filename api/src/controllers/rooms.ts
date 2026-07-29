import type { RequestHandler } from 'express';

import type { RoomFilter } from '../schemas/room.js';
import * as roomsService from '../services/rooms.js';

export const list: RequestHandler<unknown, unknown, unknown, RoomFilter> = async (req, res) => {
  res.json({ rooms: await roomsService.listRooms(req.query) });
};
