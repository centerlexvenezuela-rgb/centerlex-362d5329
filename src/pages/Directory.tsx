import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Scale, MapPin, Mail, Phone, Search, Loader2, ArrowLeft, Locate } from "lucide-react";
import { VENEZUELA_STATES, nearestState } from "@/lib/venezuela";
import { useBranding } from "@/hooks/useBranding";
import { toast } from "sonner";

interface Lawyer {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  whatsapp: string | null;
  bar_association: string | null;
  city: string | null;
  state: string | null;
  photo_url: string | null;
  email: string | null;
}

const Directory = () => {
  const { branding } = useBranding();
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    document.title = "Directorio de Abogados en Venezuela | " + branding.app_title;
    const meta = document.querySelector('meta[name="description"]');
    const desc =
      "Encuentra abogados verificados en Venezuela por estado. Contacto directo por WhatsApp y correo. Asesoría jurídica cerca de ti.";
    if (meta) meta.setAttribute("content", desc);
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = desc;
      document.head.appendChild(m);
    }
  }, [branding.app_title]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("lawyers_directory" as any)
        .select("*");
      setLoading(false);
      if (error) {
        toast.error("No se pudo cargar el directorio");
        return;
      }
      setLawyers(((data as unknown) as Lawyer[]) ?? []);
    })();
  }, []);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      toast.error("Tu navegador no soporta geolocalización");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const s = nearestState(pos.coords.latitude, pos.coords.longitude);
        setStateFilter(s);
        setLocating(false);
        toast.success(`Mostrando abogados cerca de ${s}`);
      },
      () => {
        setLocating(false);
        toast.error("No se pudo obtener tu ubicación");
      },
      { timeout: 8000 },
    );
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = lawyers.filter((l) => {
      const fullName = `${l.first_name ?? ""} ${l.last_name ?? ""}`.toLowerCase();
      const matchSearch =
        !q ||
        fullName.includes(q) ||
        (l.bar_association ?? "").toLowerCase().includes(q) ||
        (l.city ?? "").toLowerCase().includes(q);
      const matchState = stateFilter === "all" || l.state === stateFilter;
      return matchSearch && matchState;
    });
    // Si hay estado seleccionado, ya están filtrados; si no, orden alfabético.
    list.sort((a, b) => (a.first_name ?? "").localeCompare(b.first_name ?? ""));
    return list;
  }, [lawyers, search, stateFilter]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <div className={`h-10 w-10 rounded flex items-center justify-center overflow-hidden flex-shrink-0 ${branding.logo_url ? "" : "bg-gradient-gold shadow-gold"}`}>
              {branding.logo_url ? (
                <img src={branding.logo_url} alt={branding.app_title} className="h-full w-full object-contain" />
              ) : (
                <Scale className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="font-serif text-base sm:text-lg leading-tight truncate">{branding.app_title}</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Directorio profesional</p>
            </div>
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link to="/"><ArrowLeft className="h-4 w-4 mr-1.5" /> Inicio</Link>
          </Button>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 text-center">
        <h2 className="font-serif text-3xl sm:text-5xl leading-tight mb-4">
          Directorio de Abogados en Venezuela
        </h2>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
          Encuentra profesionales del derecho verificados en tu estado.
          Contáctalos directamente por WhatsApp o correo electrónico.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-6">
        <Card className="p-4 sm:p-5 shadow-elegant">
          <div className="grid gap-3 md:grid-cols-[1fr,220px,auto]">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar por nombre, ciudad o colegio…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {VENEZUELA_STATES.map((s) => (
                  <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleLocate} disabled={locating}>
              {locating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Locate className="h-4 w-4 mr-2" />}
              Cerca de mí
            </Button>
          </div>
        </Card>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">
            No se encontraron abogados con esos criterios.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((l) => {
              const fullName =
                [l.first_name, l.last_name].filter(Boolean).join(" ").trim() || "Abogado";
              const initials = fullName
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
              const wa = l.whatsapp?.replace(/\D/g, "");
              return (
                <Card key={l.user_id} className="p-5 hover:shadow-elegant transition-shadow flex flex-col">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="h-16 w-16">
                      {l.photo_url ? <AvatarImage src={l.photo_url} alt={fullName} /> : null}
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-serif text-lg leading-tight truncate">{fullName}</h3>
                      {l.bar_association && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {l.bar_association}
                        </p>
                      )}
                    </div>
                  </div>
                  {(l.city || l.state) && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">
                        {[l.city, l.state].filter(Boolean).join(", ")}
                      </span>
                    </div>
                  )}
                  <div className="mt-auto flex flex-col gap-2">
                    {wa && (
                      <Button asChild className="bg-[#25D366] hover:bg-[#1ebe5d] text-white">
                        <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">
                          <Phone className="h-4 w-4 mr-2" /> WhatsApp
                        </a>
                      </Button>
                    )}
                    {l.email && (
                      <Button asChild variant="outline">
                        <a href={`mailto:${l.email}`}>
                          <Mail className="h-4 w-4 mr-2" /> Correo
                        </a>
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <footer className="border-t bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {branding.app_title} · Directorio profesional
        </div>
      </footer>
    </div>
  );
};

export default Directory;
