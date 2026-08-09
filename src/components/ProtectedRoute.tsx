import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { isAccountBlocked, useProfile } from "@/hooks/useProfile";
import { Scale } from "lucide-react";

interface Props {
  children: React.ReactNode;
  requireRole?: "admin" | "lawyer";
  redirectTo?: string;
}

export const ProtectedRoute = ({ children, requireRole = "lawyer", redirectTo }: Props) => {
  const { session, role, loading, roleLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  const waiting =
    loading ||
    (session && roleLoading) ||
    (session && requireRole === "lawyer" && profileLoading);

  if (waiting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Scale className="h-10 w-10 text-accent animate-pulse" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to={redirectTo ?? (requireRole === "admin" ? "/admin/login" : "/auth")} replace />;
  }

  // Solo redirigimos cuando el rol ya está resuelto y no coincide
  if (role && role !== requireRole) {
    return <Navigate to={requireRole === "admin" ? "/admin/login" : "/auth"} replace />;
  }

  if (requireRole === "lawyer" && isAccountBlocked(profile)) {
    return <Navigate to="/cuenta-inactiva" replace />;
  }

  return <>{children}</>;
};
