import { ChangePasswordSection } from "@/components/ChangePasswordSection";
import { GoogleDriveSection } from "@/components/GoogleDriveSection";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { UserCircle } from "lucide-react";

const Settings = () => {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Mi cuenta</h1>
        <p className="text-muted-foreground text-sm mt-1">Gestione la configuración de su cuenta.</p>
      </div>

      <Card className="p-6 shadow-elegant">
        <div className="flex items-center gap-2 mb-4">
          <UserCircle className="h-5 w-5 text-accent" />
          <h2 className="font-serif text-xl">Información de la cuenta</h2>
        </div>
        <p className="text-sm"><span className="text-muted-foreground">Email: </span><strong>{user?.email}</strong></p>
      </Card>

      <GoogleDriveSection />

      <ChangePasswordSection />
    </div>
  );
};

export default Settings;
