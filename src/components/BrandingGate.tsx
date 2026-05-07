import { Loader2 } from "lucide-react";
import { useBranding } from "@/hooks/useBranding";
import { ReactNode } from "react";

export const BrandingGate = ({ children }: { children: ReactNode }) => {
  const { loading } = useBranding();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
      </div>
    );
  }
  return <>{children}</>;
};
