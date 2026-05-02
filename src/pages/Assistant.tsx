import { useState, useRef, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles, Copy, User, Bot } from "lucide-react";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";

interface Msg { role: "user" | "assistant"; content: string; }

const Assistant = () => {
  const { profile, loading: profileLoading } = useProfile();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  if (!profileLoading && !profile?.ai_enabled) {
    return <Navigate to="/app" replace />;
  }

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: Msg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/legal-assistant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (resp.status === 429) { toast.error("Demasiadas solicitudes. Intente de nuevo en un momento."); setLoading(false); setMessages(newMessages); return; }
      if (resp.status === 402) { toast.error("Créditos de IA agotados. Recargue su plan."); setLoading(false); setMessages(newMessages); return; }
      if (!resp.ok || !resp.body) { toast.error("Error al consultar el asistente"); setLoading(false); return; }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let assistantText = "";
      setMessages([...newMessages, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              assistantText += delta;
              setMessages([...newMessages, { role: "assistant", content: assistantText }]);
            }
          } catch { buf = line + "\n" + buf; break; }
        }
      }
    } catch (e) {
      toast.error("Error de red");
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copiado");
  };


  return (
    <div className="space-y-4 h-[calc(100vh-10rem)] md:h-[calc(100vh-6rem)] flex flex-col">
      <div className="border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded bg-gradient-gold flex items-center justify-center shadow-gold">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-3xl leading-tight">Asistente Jurídico IA</h1>
            <p className="text-sm text-muted-foreground">Redacción de documentos y consultas legales</p>
          </div>
        </div>
      </div>

      <Card className="flex-1 flex flex-col shadow-card overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto">
              <Sparkles className="h-12 w-12 text-accent mb-4" />
              <h2 className="font-serif text-2xl mb-2">¿En qué puedo ayudarle hoy?</h2>
              <p className="text-muted-foreground">Escriba su consulta jurídica para comenzar.</p>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "assistant" && (
                  <div className="h-8 w-8 rounded bg-primary text-primary-foreground flex items-center justify-center shrink-0"><Bot className="h-4 w-4" /></div>
                )}
                <div className={`max-w-[85%] rounded-lg px-4 py-2.5 ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"} group relative`}>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{m.content || (loading && i === messages.length - 1 ? "..." : "")}</div>
                  {m.role === "assistant" && m.content && (
                    <Button size="icon" variant="ghost" onClick={() => copy(m.content)} className="absolute -top-2 -right-2 h-7 w-7 opacity-0 group-hover:opacity-100 bg-card border border-border">
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {m.role === "user" && (
                  <div className="h-8 w-8 rounded bg-accent text-accent-foreground flex items-center justify-center shrink-0"><User className="h-4 w-4" /></div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="border-t border-border p-3 md:p-4 bg-muted/20">
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Escriba su consulta jurídica... (Enter para enviar)"
              rows={2}
              className="resize-none"
              disabled={loading}
            />
            <Button onClick={send} disabled={loading || !input.trim()} className="bg-primary hover:bg-primary-glow h-auto py-3">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Assistant;
