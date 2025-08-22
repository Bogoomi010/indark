import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import LoginPage from "../pages/Login";
import GamePortalPage from "../pages/Main";

function RequireAuth() {
  const { user, initializing } = useAuth();
  if (initializing) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/" element={<GamePortalPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}


