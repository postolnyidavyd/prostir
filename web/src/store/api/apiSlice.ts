import { createApi, fetchBaseQuery, type BaseQueryFn } from '@reduxjs/toolkit/query/react';
import type { FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';

import { logout, selectAccessToken, setAccessToken } from '../authSlice';
import type { RootState } from '../store';


const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = selectAccessToken(getState() as RootState);
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

type RefreshResponse = { accessToken: string };


const AUTH_PATHS = ['/auth/login', '/auth/register'];

// один спільний проміс refresh, ідемпотентність
let refreshPromise: Promise<{ data?: unknown }> | null = null;

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  const url = typeof args === 'string' ? args : args.url;
  if (result.error?.status !== 401 || AUTH_PATHS.some((path) => url.includes(path))) {
    return result;
  }

  // 401 - токен протух, пробуємо ротацію
  refreshPromise ??= Promise.resolve(
    rawBaseQuery({ url: '/auth/refresh', method: 'POST' }, api, extraOptions),
  ).finally(() => {
    refreshPromise = null;
  });

  const refresh = await refreshPromise;
  const data = refresh.data as RefreshResponse | undefined;

  if (data?.accessToken) {
    api.dispatch(setAccessToken(data.accessToken));
    result = await rawBaseQuery(args, api, extraOptions);
  } else {
    api.dispatch(logout());
  }

  return result;
};

const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Rooms', 'RoomFilters', 'RoomBookings', 'MyBookings'],
  endpoints: () => ({}),
});

export default apiSlice;
