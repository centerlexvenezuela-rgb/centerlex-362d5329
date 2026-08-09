import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Power, Sparkles, Calculator, Banknote, Receipt, UserSquare2 } from "lucide-react";

export interface LawyerRow {
  id: string;
  email: string;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  banned: boolean;
  ai_enabled: boolean;
  fees_enabled: boolean;
  prestaciones_enabled: boolean;
  islr_enabled: boolean;
  directory_enabled: boolean;
}

interface Props<T extends LawyerRow> {
  lawyers: T[];
  togglingId: string | null;
  onToggleActive: (id: string, v: boolean) => void;
  onToggleAI: (id: string, v: boolean) => void;
  onToggleFees: (id: string, v: boolean) => void;
  onTogglePrestaciones: (id: string, v: boolean) => void;
  onToggleIslr: (id: string, v: boolean) => void;
  onToggleDirectory: (id: string, v: boolean) => void;
  onEdit: (l: T) => void;
  onDelete: (id: string, email: string) => void;
}

export function LawyerMobileList<T extends LawyerRow>({
  lawyers, togglingId, onToggleActive, onToggleAI, onToggleFees,
  onTogglePrestaciones, onToggleIslr, onToggleDirectory, onEdit, onDelete,
}: Props<T>) {
  return (
    <div className="space-y-4 md:hidden">
      {lawyers.map((l) => {
        const fullName = [l.first_name, l.last_name].filter(Boolean).join(" ").trim();
        const rows: {
          key: string;
          icon: typeof Power;
          label: string;
          checked: boolean;
          on: string;
          off: string;
          danger?: boolean;
          toggle: (v: boolean) => void;
        }[] = [
          { key: "acc", icon: Power, label: "Cuenta", checked: !l.banned, on: "Habilitada", off: "Inhabilitada", danger: true, toggle: (v) => onToggleActive(l.id, v) },
          { key: "ai", icon: Sparkles, label: "Asistente IA", checked: l.ai_enabled, on: "Activa", off: "Inactiva", toggle: (v) => onToggleAI(l.id, v) },
          { key: "fees", icon: Calculator, label: "Honorarios mínimos", checked: l.fees_enabled, on: "Activa", off: "Inactiva", toggle: (v) => onToggleFees(l.id, v) },
          { key: "pres", icon: Banknote, label: "Prestaciones sociales", checked: l.prestaciones_enabled, on: "Activa", off: "Inactiva", toggle: (v) => onTogglePrestaciones(l.id, v) },
          { key: "islr", icon: Receipt, label: "Cálculo de ISLR", checked: l.islr_enabled, on: "Activa", off: "Inactiva", toggle: (v) => onToggleIslr(l.id, v) },
          { key: "dir", icon: UserSquare2, label: "Directorio público", checked: l.directory_enabled, on: "Visible", off: "Oculto", toggle: (v) => onToggleDirectory(l.id, v) },
        ];

        return (
          <div key={l.id} className="rounded-lg border p-4">
            <div className="mb-3">
              <div className="font-medium break-words">
                {fullName || <span className="text-muted-foreground italic">Sin nombre</span>}
              </div>
              <div className="text-xs text-muted-foreground break-all">{l.email}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Registro: {new Date(l.created_at).toLocaleDateString("es-ES")}
              </div>
            </div>

            <div className="divide-y">
              {rows.map((r) => (
                <div key={r.key} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex items-start gap-2 min-w-0">
                    <r.icon className="h-4 w-4 mt-0.5 shrink-0 text-accent" />
                    <div className="min-w-0">
                      <div className="text-sm leading-snug break-words">{r.label}</div>
                      <div
                        className={`text-xs ${
                          !r.checked && r.danger ? "text-destructive font-medium" : "text-muted-foreground"
                        }`}
                      >
                        {r.checked ? r.on : r.off}
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={r.checked}
                    disabled={togglingId === l.id}
                    onCheckedChange={r.toggle}
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-3">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(l)}>
                <Pencil className="h-4 w-4 mr-1" /> Editar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar esta cuenta?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Se eliminará permanentemente la cuenta de <strong>{l.email}</strong> y todos sus
                      datos asociados. Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(l.id, l.email)}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        );
      })}
    </div>
  );
}
