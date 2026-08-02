import apiSlice from './apiSlice';
import { logout, setAnonymous, setCredentials, setUser, type User } from '../authSlice';

type AuthResponse = { accessToken: string; user: User };
type LoginRequest = { email: string; password: string };
type RegisterRequest = LoginRequest & { firstName: string; lastName: string };

const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query<User, void>({
      query: () => '/auth/me',
      transformResponse: (response: { user: User }) => response.user,
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setUser(data));
        } catch {
          dispatch(setAnonymous());
        }
      },
    }),

    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(setCredentials(data));
      },
    }),

    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(setCredentials(data));
      },
    }),

    logout: builder.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          // чистимо стан і весь кеш, щоб дані сесії не лишились наступному вході
          dispatch(logout());
          dispatch(apiSlice.util.resetApiState());
        }
      },
    }),
  }),
});

export const { useGetMeQuery, useLoginMutation, useRegisterMutation, useLogoutMutation } = authApi;
export default authApi;
