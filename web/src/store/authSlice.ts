import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

type AuthState = {
  accessToken: string | null;
  user: User | null;

  status: 'pending' | 'authenticated' | 'anonymous';
};

const initialState: AuthState = {
  accessToken: null,
  user: null,
  status: 'pending',
};

const anonymous: AuthState = { accessToken: null, user: null, status: 'anonymous' };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
    },
    setCredentials(state, action: PayloadAction<{ accessToken: string; user: User }>) {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      state.status = 'authenticated';
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.status = 'authenticated';
    },
    setAnonymous() {
      return anonymous;
    },
    logout() {
      return anonymous;
    },
  },
  selectors: {
    selectAuthStatus: (state) => state.status,
    selectAccessToken: (state) => state.accessToken,
    selectCurrentUser: (state) => state.user,
    selectIsAuthenticated: (state) => state.status === 'authenticated',
  },
});

export const { setAccessToken, setCredentials, setUser, setAnonymous, logout } = authSlice.actions;
export const { selectAuthStatus, selectAccessToken, selectCurrentUser, selectIsAuthenticated } =
  authSlice.selectors;

export default authSlice.reducer;
