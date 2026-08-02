import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const ForgotPasswordDialog = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/restablecer`,
    });
    setSending(false);
    if (error) return toast.error(error.message);
    toast.success("Le enviamos un enlace de cambio de contraseña a su correo electrónico.");
    setOpen(false);
    setEmail("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className="text-xs text-accent underline hover:opacity-80">
          ¿Olvidó su contraseña?
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Cambiar contraseña</DialogTitle>
          <DialogDescription>
            Escriba el correo registrado en la aplicación y le enviaremos un enlace para crear una
            nueva contraseña.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fp-email">Email registrado</Label>
            <Input
              id="fp-email" type="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="abogado@correo.com"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={sending} className="w-full bg-primary hover:bg-primary-glow">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar enlace"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
