import { Navigate, Outlet } from 'react-router-dom';

export function ProtectedRoute() {
  const user = sessionStorage.getItem('renato_psic_user');

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}