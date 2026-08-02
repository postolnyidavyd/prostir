import { createBrowserRouter, Navigate } from 'react-router-dom';

import HomePlaceholder from '../pages/HomePlaceholder';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
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
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
      {
        element: <RequireAuth />,
        children: [{ path: '/', element: <HomePlaceholder /> }],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

export default router;
