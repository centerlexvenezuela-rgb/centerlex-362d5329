import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Inbox, Loader2, Trash2, Mail, MailOpen, RefreshCw } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface ContactMessage {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  message: string;
  read: boolean;
  created_at: string;
}

export const ContactMessagesSection = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) return toast.error(error.message);
    setMessages((data ?? []) as ContactMessage[]);
  };

  useEffect(() => { load(); }, []);

  const toggleRead = async (m: ContactMessage) => {
    const { error } = await supabase
      .from("contact_messages")
      .update({ read: !m.read })
      .eq("id", m.id);
    if (error) return toast.error(error.message);
    setMessages((prev) => prev.map((x) => x.id === m.id ? { ...x, read: !m.read } : x));
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("contact_messages").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Mensaje eliminado");
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const unread = messages.filter((m) => !m.read).length;

  return (
    <Card className="p-6 shadow-elegant">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Inbox className="h-5 w-5 text-accent" />
          <h2 className="font-serif text-xl">Bandeja de mensajes</h2>
          {unread > 0 && (
            <Badge variant="default" className="bg-accent text-primary">{unread} sin leer</Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      ) : messages.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Aún no hay mensajes recibidos desde la página pública.
        </p>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`border rounded-lg p-4 ${m.read ? "bg-muted/30" : "bg-background border-accent/40"}`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{m.first_name} {m.last_name}</p>
                    {!m.read && <Badge variant="outline" className="text-xs border-accent text-accent">Nuevo</Badge>}
                  </div>
                  {m.email && (
                    <a href={`mailto:${m.email}`} className="text-xs text-accent hover:underline">
                      {m.email}
                    </a>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(m.created_at).toLocaleString("es-ES")}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => toggleRead(m)}
                    title={m.read ? "Marcar como no leído" : "Marcar como leído"}>
                    {m.read ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar este mensaje?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove(m.id)} className="bg-destructive hover:bg-destructive/90">
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              <p className="text-sm whitespace-pre-wrap text-foreground/90">{m.message}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
