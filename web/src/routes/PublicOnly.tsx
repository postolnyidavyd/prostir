import { Navigate, Outlet } from 'react-router-dom';

import { selectIsAuthenticated } from '../store/authSlice';
import { useAppSelector } from '../store/hooks';

// логін/реєстрація недоступні вже автентифікованому — редірект на головну
function PublicOnly() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
}

export default PublicOnly;
