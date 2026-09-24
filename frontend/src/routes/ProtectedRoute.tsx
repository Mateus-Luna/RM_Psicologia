import { Navigate, Outlet } from 'react-router-dom';

export function ProtectedRoute() {
  const session = sessionStorage.getItem('renato_psic_session');


  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}