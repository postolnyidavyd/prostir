import apiSlice from './apiSlice';

export type RoomBooking = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  user: { id: string; displayName: string };
};

type RoomBookingsQuery = { roomId: string; from: string; to: string };
type CreateBookingArgs = { roomId: string; title: string; startsAt: string; endsAt: string };
type CancelBookingArgs = { id: string; roomId: string };

const bookingsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRoomBookings: builder.query<RoomBooking[], RoomBookingsQuery>({
      query: ({ roomId, from, to }) => ({ url: `/rooms/${roomId}/bookings`, params: { from, to } }),
      transformResponse: (response: { bookings: RoomBooking[] }) => response.bookings,
      providesTags: (_result, _error, { roomId }) => [{ type: 'RoomBookings', id: roomId }],
    }),

    createBooking: builder.mutation<RoomBooking, CreateBookingArgs>({
      query: (body) => ({ url: '/bookings', method: 'POST', body }),
      transformResponse: (response: { booking: RoomBooking }) => response.booking,
      invalidatesTags: (_result, error, { roomId }) => {
        // успіх - новий слот змінює розклад кімнати, доступність у списку і мої бронювання
        if (!error) return [{ type: 'RoomBookings', id: roomId }, 'Rooms', 'MyBookings'];
        // 409 - слот щойно зайняли, наш розклад цієї кімнати застарів
        if ('status' in error && error.status === 409) {
          return [{ type: 'RoomBookings', id: roomId }, 'Rooms'];
        }
        // інші помилки розкладу не змінюють
        return [];
      },
    }),

    cancelBooking: builder.mutation<void, CancelBookingArgs>({
      query: ({ id }) => ({ url: `/bookings/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, error, { roomId }) =>
        error ? [] : [{ type: 'RoomBookings', id: roomId }, 'Rooms', 'MyBookings'],
    }),
  }),
});

export const { useGetRoomBookingsQuery, useCreateBookingMutation, useCancelBookingMutation } =
  bookingsApi;
export default bookingsApi;
