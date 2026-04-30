import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Scale } from "lucide-react";

interface Props {
  children: React.ReactNode;
  requireRole?: "admin" | "lawyer";
  redirectTo?: string;
}

export const ProtectedRoute = ({ children, requireRole = "lawyer", redirectTo }: Props) => {
  const { session, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Scale className="h-10 w-10 text-accent animate-pulse" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to={redirectTo ?? (requireRole === "admin" ? "/admin/login" : "/auth")} replace />;
  }

  if (role && role !== requireRole) {
    // logged in but wrong role
    return <Navigate to={requireRole === "admin" ? "/admin/login" : "/auth"} replace />;
  }

  return <>{children}</>;
};
