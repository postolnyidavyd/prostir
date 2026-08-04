import apiSlice from './apiSlice';

export type Room = {
  id: string;
  name: string;
  imageUrl: string;
  capacity: number;
  floor: number;
  // присутнє лише коли в запиті задано вікно from/to
  available?: boolean;
};

export type RoomsQuery = {
  from?: string;
  to?: string;
  floors?: number[];
  minCapacity?: number;
  onlyFree?: boolean;
};


export type RoomFilterOptions = {
  floors: number[];
  maxCapacity: number;
};

const roomsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRooms: builder.query<Room[], RoomsQuery>({
      query: ({ floors, ...rest }) => ({
        url: '/rooms',
        params: { ...rest, ...(floors && floors.length > 0 && { floors: floors.join(',') }) },
      }),
      transformResponse: (response: { rooms: Room[] }) => response.rooms,
      providesTags: ['Rooms'],
    }),

    getRoomFilterOptions: builder.query<RoomFilterOptions, void>({
      query: () => '/rooms/filters',
      providesTags: ['RoomFilters'],
    }),
  }),
});

export const { useGetRoomsQuery, useGetRoomFilterOptionsQuery } = roomsApi;
export default roomsApi;
