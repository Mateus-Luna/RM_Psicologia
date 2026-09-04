import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';

import { Login } from '../pages/Login/Login';
import { Setup } from '../pages/Setup/Setup';
import { Dashboard } from '../pages/Dashboard/Dashboard';
import { Startup } from '../pages/Startup/Startup';
import { ProtectedRoute } from './ProtectedRoute';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Startup />} />

        <Route path="/setup" element={<Setup />} />

        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}