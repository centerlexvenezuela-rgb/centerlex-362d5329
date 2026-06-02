import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HardDrive, Link2, Unplug, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Status {
  connected: boolean;
  email: string | null;
  connected_at: string | null;
}

export const GoogleDriveSection = () => {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [migrating, setMigrating] = useState(false);

  const load = async () => {
    const { data, error } = await supabase.functions.invoke("google-drive", {
      body: { action: "status" },
    });
    if (!error) setStatus(data as Status);
  };

  useEffect(() => {
    load();
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === "gdrive-connected") {
        toast.success("Google Drive conectado");
        load();
        // Offer migration right away
        setTimeout(() => migrate(), 500);
      } else if (e.data?.type === "gdrive-error") {
        toast.error("No se pudo conectar Google Drive");
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const connect = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("google-drive", {
      body: { action: "auth-url" },
    });
    setBusy(false);
    if (error || !data?.url) return toast.error("Error obteniendo URL de Google");
    window.open(data.url, "gdrive-oauth", "width=520,height=640");
  };

  const disconnect = async () => {
    if (!confirm("¿Desconectar Google Drive? Los archivos existentes en Drive no se borrarán, pero la app no podrá leerlos ni crear nuevos hasta reconectar.")) return;
    setBusy(true);
    await supabase.functions.invoke("google-drive", { body: { action: "disconnect" } });
    setBusy(false);
    toast.success("Desconectado");
    load();
  };

  const migrate = async () => {
    setMigrating(true);
    const { data, error } = await supabase.functions.invoke("google-drive", {
      body: { action: "migrate" },
    });
    setMigrating(false);
    if (error) return toast.error("Error migrando documentos");
    if ((data?.migrated ?? 0) > 0)
      toast.success(`${data.migrated} escrito(s) migrado(s) a Drive`);
  };

  return (
    <Card className="p-6 shadow-elegant">
      <div className="flex items-center gap-2 mb-2">
        <HardDrive className="h-5 w-5 text-accent" />
        <h2 className="font-serif text-xl">Google Drive personal</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Conecte su Google Drive para guardar sus escritos en una carpeta llamada
        <strong> "Lex Office"</strong> dentro de su propia cuenta. En esta aplicación
        solo se guarda la referencia al archivo, nunca el contenido.
      </p>

      {status?.connected ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="bg-accent/20 text-accent-foreground border-accent/30">Conectado</Badge>
            <span className="text-sm"><strong>{status.email}</strong></span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={migrate} disabled={migrating}>
              {migrating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Migrar escritos existentes
            </Button>
            <Button variant="ghost" size="sm" onClick={disconnect} disabled={busy} className="text-destructive">
              <Unplug className="h-4 w-4 mr-2" />Desconectar
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={connect} disabled={busy} className="bg-primary hover:bg-primary-glow">
          {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Link2 className="h-4 w-4 mr-2" />}
          Conectar Google Drive
        </Button>
      )}
    </Card>
  );
};
