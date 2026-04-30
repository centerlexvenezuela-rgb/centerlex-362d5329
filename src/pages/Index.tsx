import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { session, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={session ? "/" : "/auth"} replace />;
};
export default Index;
