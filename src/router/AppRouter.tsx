import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "../pages/Login";
import GamePortalPage from "../pages/Main";
import { AuthGate } from "../auth/AuthGate";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <AuthGate>
            <GamePortalPage />
          </AuthGate>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}


