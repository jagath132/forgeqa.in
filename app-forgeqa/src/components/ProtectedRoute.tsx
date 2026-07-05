import { Navigate, Outlet } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";

export function ProtectedRoute() {
  const user = useAppStore((s) => s.user);
  if (!user) return <Navigate to="/auth" replace />;
  return <Outlet />;
}
