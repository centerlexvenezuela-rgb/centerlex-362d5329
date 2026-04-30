import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, IdCard, FolderOpen, FileText, ArrowRight, User } from "lucide-react";
import { toast } from "sonner";

interface Result {
  client: { id: string; full_name: string; cedula: string; phone: string | null; email: string | null };
  cases: { id: string; case_number: string; title: string; matter: string | null; status: string;
    documents: { id: string; title: string; updated_at: string }[] }[];
}

const SearchPage = () => {
  const [cedula, setCedula] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[] | null>(null);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cedula.trim()) return;
    setLoading(true);
    const { data: clients } = await supabase.from("clients").select("*").ilike("cedula", `%${cedula.trim()}%`);
    if (!clients || clients.length === 0) { setResults([]); setLoading(false); return; }
    const ids = clients.map(c => c.id);
    const { data: cases } = await supabase.from("cases").select("*, documents(id, title, updated_at)").in("client_id", ids);
    const grouped: Result[] = clients.map(c => ({
      client: c,
      cases: (cases || []).filter((cs: any) => cs.client_id === c.id).map((cs: any) => ({
        ...cs,
        documents: (cs.documents || []).sort((a: any, b: any) => b.updated_at.localeCompare(a.updated_at)),
      })),
    }));
    setResults(grouped);
    setLoading(false);
  };

  const statusLabel = (s: string) => s === "open" ? "Activo" : s === "closed" ? "Cerrado" : "Archivado";

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-6">
        <h1 className="font-serif text-4xl mb-1">Búsqueda por cédula</h1>
        <p className="text-muted-foreground">Localice expedientes y escritos por número de cédula del cliente</p>
      </div>

      <Card className="p-6 shadow-card">
        <form onSubmit={search} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ingrese el número de cédula..."
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              className="pl-9 text-base h-11"
            />
          </div>
          <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary-glow h-11 px-6">
            <Search className="h-4 w-4 mr-2" />{loading ? "Buscando..." : "Buscar"}
          </Button>
        </form>
      </Card>

      {results === null ? (
        <Card className="p-12 text-center text-muted-foreground">Realice una búsqueda para ver resultados.</Card>
      ) : results.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">No se encontraron clientes con esa cédula.</Card>
      ) : (
        <div className="space-y-6">
          {results.map(({ client, cases }) => (
            <Card key={client.id} className="p-6 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-border">
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-full bg-accent-soft flex items-center justify-center"><User className="h-5 w-5 text-accent-foreground" /></div>
                  <div>
                    <h3 className="font-serif text-2xl">{client.full_name}</h3>
                    <div className="text-sm text-muted-foreground font-mono flex items-center gap-1"><IdCard className="h-3 w-3" />{client.cedula}</div>
                    {client.phone && <div className="text-xs text-muted-foreground">📞 {client.phone}</div>}
                  </div>
                </div>
                <Badge variant="outline">{cases.length} expediente(s)</Badge>
              </div>

              {cases.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">Este cliente no tiene expedientes registrados.</p>
              ) : (
                <div className="space-y-4 pt-4">
                  {cases.map(cs => (
                    <div key={cs.id} className="border-l-4 border-l-accent pl-4 py-2">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="text-xs font-mono text-muted-foreground">{cs.case_number}</div>
                          <Link to={`/expedientes/${cs.id}`} className="font-serif text-xl hover:text-accent transition inline-flex items-center gap-1">
                            <FolderOpen className="h-4 w-4" />{cs.title}
                            <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                          </Link>
                          {cs.matter && <div className="text-xs text-muted-foreground">{cs.matter}</div>}
                        </div>
                        <Badge variant="outline" className="bg-accent/10">{statusLabel(cs.status)}</Badge>
                      </div>
                      {cs.documents.length > 0 && (
                        <div className="mt-3">
                          <div className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Escritos</div>
                          <div className="space-y-1">
                            {cs.documents.map(d => (
                              <Link
                                key={d.id}
                                to={`/expedientes/${cs.id}#doc-${d.id}`}
                                className="flex items-center gap-2 text-sm py-1.5 px-2 rounded hover:bg-accent/10 transition"
                              >
                                <FileText className="h-3.5 w-3.5 text-accent" />
                                <span className="flex-1 truncate">{d.title}</span>
                                <span className="text-xs text-accent">Revisar / editar / copiar →</span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
