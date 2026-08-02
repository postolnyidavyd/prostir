import { Outlet } from 'react-router-dom';

import Spinner from '../components/ui/Spinner';
import { useGetMeQuery } from '../store/api/authApi';
import { selectAuthStatus } from '../store/authSlice';
import { useAppSelector } from '../store/hooks';

// запускає перевірку сесії на старті
function AuthGate() {
  useGetMeQuery();
  const status = useAppSelector(selectAuthStatus);

  if (status === 'pending') {
    return <Spinner fullscreen />;
  }

  return <Outlet />;
}

export default AuthGate;
