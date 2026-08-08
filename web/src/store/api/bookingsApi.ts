import apiSlice from './apiSlice';

export type RoomBooking = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  user: { id: string; displayName: string };
};

export type BookingScope = 'upcoming' | 'past';

export type MyBooking = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  room: { id: string; name: string };
};

export type CurrentBooking = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  room: { id: string; name: string; floor: number; capacity: number };
};

export type EndReminder = {
  bookingId: string;
  title: string;
  roomName: string;
  endsAt: string;
  minutes: number;
};

type MyBookingsPage = { bookings: MyBooking[]; nextCursor: string | null; total: number };

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

    // хайлайт наступне бронювання - триває або найближче в майб
    getCurrentBooking: builder.query<CurrentBooking | null, void>({
      query: () => '/bookings/my/current',
      transformResponse: (response: { booking: CurrentBooking | null }) => response.booking,
      providesTags: ['MyBookings'],
    }),

    // нагадування звільнити кімнату
    getEndReminder: builder.query<EndReminder | null, void>({
      query: () => '/bookings/my/end-reminder',
      transformResponse: (response: { reminder: EndReminder | null }) => response.reminder,
      providesTags: ['MyBookings'],
    }),

    getMyBookings: builder.infiniteQuery<MyBookingsPage, BookingScope, string | undefined>({
      infiniteQueryOptions: {
        initialPageParam: undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      },
      query: ({ queryArg: scope, pageParam }) => ({
        url: '/bookings/my',
        params: { scope, ...(pageParam ? { cursor: pageParam } : {}) },
      }),
      providesTags: ['MyBookings'],
    }),
  }),
});

export const {
  useGetRoomBookingsQuery,
  useCreateBookingMutation,
  useCancelBookingMutation,
  useGetCurrentBookingQuery,
  useGetEndReminderQuery,
  useGetMyBookingsInfiniteQuery,
} = bookingsApi;
export default bookingsApi;
