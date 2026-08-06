import { Navigate, Outlet } from 'react-router-dom';

import { selectIsAuthenticated } from '../store/authSlice';
import { useAppSelector } from '../store/hooks';

function RequireAuth() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/welcome" replace />;
}

export default RequireAuth;
