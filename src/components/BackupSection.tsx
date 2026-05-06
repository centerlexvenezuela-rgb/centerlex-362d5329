import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Database, Loader2, FolderArchive } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const BackupSection = () => {
  const [loading, setLoading] = useState<"global" | "per_lawyer" | null>(null);

  const download = async (mode: "global" | "per_lawyer") => {
    setLoading(mode);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Sesión no válida");

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-backup`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ mode }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Error al generar el respaldo");
      }

      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition") ?? "";
      const m = cd.match(/filename="?([^"]+)"?/);
      const filename = m?.[1] ?? `respaldo_${mode}_${Date.now()}.zip`;

      const a = document.createElement("a");
      const objUrl = URL.createObjectURL(blob);
      a.href = objUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);

      toast.success("Respaldo descargado");
    } catch (e: any) {
      toast.error(e.message ?? "Error");
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className="p-6 shadow-elegant">
      <div className="flex items-center gap-2 mb-4">
        <Database className="h-5 w-5 text-accent" />
        <h2 className="font-serif text-xl">Respaldo de la base de datos</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Descargue una copia completa de los datos en formato CSV (clientes, expedientes,
        documentos y citas). Se recomienda hacer respaldos periódicos y guardarlos en un
        lugar seguro.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="border rounded-lg p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-4 w-4 text-accent" />
            <h3 className="font-medium">Respaldo global</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4 flex-1">
            Un único ZIP con archivos CSV consolidados de todos los abogados. Cada fila
            indica el abogado dueño (email y nombre).
          </p>
          <Button
            onClick={() => download("global")}
            disabled={loading !== null}
            className="bg-primary hover:bg-primary-glow"
          >
            {loading === "global" ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Descargar respaldo global
          </Button>
        </div>

        <div className="border rounded-lg p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <FolderArchive className="h-4 w-4 text-accent" />
            <h3 className="font-medium">Respaldo por abogado</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-4 flex-1">
            Un ZIP organizado en carpetas, una por cada abogado, con sus propios CSV.
            Útil para entregar datos individuales o auditar por cuenta.
          </p>
          <Button
            onClick={() => download("per_lawyer")}
            disabled={loading !== null}
            variant="outline"
          >
            {loading === "per_lawyer" ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Descargar respaldo por abogado
          </Button>
        </div>
      </div>
    </Card>
  );
};
