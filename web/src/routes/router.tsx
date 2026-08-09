import { createBrowserRouter, Navigate } from 'react-router-dom';

import AppLayout from '../components/AppLayout';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import MyBookingsPage from '../pages/MyBookingsPage';
import ProfilePage from '../pages/ProfilePage';
import RegisterPage from '../pages/RegisterPage';
import RoomsPage from '../pages/RoomsPage';
import VerifyEmailPage from '../pages/VerifyEmailPage';
import AuthGate from './AuthGate';
import PublicOnly from './PublicOnly';
import RequireAuth from './RequireAuth';

const router = createBrowserRouter([
  {
    element: <AuthGate />,
    children: [
      {
        element: <PublicOnly />,
        children: [
          { path: '/welcome', element: <LandingPage /> },
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
      { path: '/verify-email', element: <VerifyEmailPage /> },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { index: true, element: <RoomsPage /> },
              { path: '/my-bookings', element: <MyBookingsPage /> },
              { path: '/profile', element: <ProfilePage /> },
            ],
          },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

export default router;
