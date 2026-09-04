import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export const InstallAppButton = ({
  label = "Descargar App",
  url = "",
}: { label?: string; url?: string }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const text = label?.trim() || "Descargar App";
  const href = url?.trim()
    ? (/^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`)
    : "";


  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;
    setInstalled(standalone);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const handleClick = async () => {
    if (!deferredPrompt) {
      setHelpOpen(true);
      return;
    }
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <>
      <Button onClick={handleClick} variant="outline" size="sm">
        <Download className="h-4 w-4 mr-1.5" /> Descargar App
      </Button>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Instalar CenterLex en su dispositivo</DialogTitle>
            <DialogDescription>
              Su navegador no mostró el aviso automático de instalación. Puede instalarla manualmente:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground">Android (Chrome)</p>
              <p>Menú ⋮ → «Añadir a pantalla de inicio» / «Instalar aplicación».</p>
            </div>
            <div>
              <p className="font-medium text-foreground">iPhone / iPad (Safari)</p>
              <p>Botón Compartir → «Añadir a pantalla de inicio».</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Computadora (Chrome / Edge)</p>
              <p>Icono de instalación en la barra de direcciones, o Menú → «Instalar CenterLex».</p>
            </div>
            <p className="text-xs">
              Nota: la instalación solo está disponible en el sitio publicado (https://centerlex.lovable.app),
              no dentro del editor de vista previa.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
