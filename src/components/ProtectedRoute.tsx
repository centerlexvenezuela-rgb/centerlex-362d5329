import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Scale } from "lucide-react";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Scale className="h-10 w-10 text-accent animate-pulse" />
      </div>
    );
  }
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};
