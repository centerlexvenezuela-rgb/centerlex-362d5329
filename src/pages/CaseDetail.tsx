import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Plus, FileText, Trash2, Edit, Copy, FileDown, Save, Loader2, Cloud,
  Upload, Image as ImageIcon, File as FileIcon, Eye, Download,
  Users, Gavel, ChevronDown, ChevronUp,
} from "lucide-react";
import { RichTextEditor } from "@/components/RichTextEditor";
import { exportToDocx, copyHtmlAsText } from "@/lib/exportDocs";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface CaseDetail {
  id: string; case_number: string; title: string; matter: string | null; status: string; description: string | null; created_at: string;
  clients: { full_name: string; cedula: string; phone: string | null; email: string | null };
}

interface MeetingMeta {
  location?: string;
  parties?: string;
  facts?: string;
  law?: string;
  actions?: string;
}
interface SentenceMeta {
  decision?: string;
}
type DocKind = "writing" | "file" | "meeting" | "sentence";

interface Doc {
  id: string; title: string; content: string | null; drive_file_id: string | null;
  kind: DocKind; mime_type: string | null; file_name: string | null; size_bytes: number | null;
  created_at: string; updated_at: string;
  event_date: string | null;
  metadata: MeetingMeta & SentenceMeta & Record<string, any>;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const ALLOWED_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg", "image/jpg", "image/png",
];
const MAX_BYTES = 15 * 1024 * 1024;

const formatBytes = (n: number | null) => {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

const kindLabel: Record<DocKind, string> = {
  writing: "Escrito", file: "Documento", meeting: "Acta de reunión", sentence: "Sentencia",
};

const iconForDoc = (d: Doc) => {
  if (d.kind === "meeting") return <Users className="h-5 w-5 text-accent shrink-0" />;
  if (d.kind === "sentence") return <Gavel className="h-5 w-5 text-accent shrink-0" />;
  if (d.kind === "writing") return <FileText className="h-5 w-5 text-accent shrink-0" />;
  if (d.mime_type?.startsWith("image/")) return <ImageIcon className="h-5 w-5 text-accent shrink-0" />;
  return <FileIcon className="h-5 w-5 text-accent shrink-0" />;
};

const CaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [caseRow, setCaseRow] = useState<CaseDetail | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [filter, setFilter] = useState<"all" | DocKind>("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Writing editor
  const [editorOpen, setEditorOpen] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docContent, setDocContent] = useState("");
  const [editingDoc, setEditingDoc] = useState<Doc | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [saving, setSaving] = useState(false);

  // Meeting dialog
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Doc | null>(null);
  const [mTitle, setMTitle] = useState("");
  const [mDate, setMDate] = useState("");
  const [mLocation, setMLocation] = useState("");
  const [mParties, setMParties] = useState("");
  const [mFacts, setMFacts] = useState("");
  const [mLaw, setMLaw] = useState("");
  const [mActions, setMActions] = useState("");
  const [savingMeeting, setSavingMeeting] = useState(false);

  // Sentence dialog
  const [sentenceOpen, setSentenceOpen] = useState(false);
  const [sTitle, setSTitle] = useState("");
  const [sDate, setSDate] = useState("");
  const [sDecision, setSDecision] = useState("");
  const [sFile, setSFile] = useState<File | null>(null);
  const [savingSentence, setSavingSentence] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [driveConnected, setDriveConnected] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!id) return;
    const { data: c } = await supabase.from("cases").select("*, clients(full_name, cedula, phone, email)").eq("id", id).maybeSingle();
    setCaseRow(c as any);
    const { data: d } = await supabase.from("documents").select("*").eq("case_id", id);
    const list = ((d as any[]) || []).map((r) => ({ ...r, metadata: r.metadata || {} })) as Doc[];
    list.sort((a, b) => {
      const ta = new Date(a.event_date || a.created_at).getTime();
      const tb = new Date(b.event_date || b.created_at).getTime();
      return tb - ta;
    });
    setDocs(list);
  };
  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    supabase.functions.invoke("google-drive", { body: { action: "status" } })
      .then(({ data }) => setDriveConnected(!!data?.connected));
  }, []);

  const ensureDrive = () => {
    if (driveConnected === false) {
      toast.error("Conecta tu Google Drive desde Mi cuenta → Google Drive personal");
      return false;
    }
    return true;
  };

  // ---------- Writings ----------
  const openNewDoc = () => {
    if (!ensureDrive()) return;
    setEditingDoc(null); setDocTitle(""); setDocContent("<p></p>"); setEditorOpen(true);
  };

  const openEditDoc = async (d: Doc) => {
    if (!ensureDrive()) return;
    setEditingDoc(d); setDocTitle(d.title);
    if (d.drive_file_id) {
      setLoadingDoc(true); setDocContent(""); setEditorOpen(true);
      const { data, error } = await supabase.functions.invoke("google-drive", {
        body: { action: "download", fileId: d.drive_file_id },
      });
      setLoadingDoc(false);
      if (error) return toast.error("No se pudo cargar desde Drive");
      setDocContent(data?.content || "<p></p>");
    } else {
      setDocContent(d.content || "<p></p>"); setEditorOpen(true);
    }
  };

  const saveDoc = async () => {
    if (!docTitle.trim()) return toast.error("Título del escrito obligatorio");
    if (!id) return;
    if (!ensureDrive()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSaving(true);
    try {
      const { data: up, error: upErr } = await supabase.functions.invoke("google-drive", {
        body: { action: "upload", title: docTitle, content: docContent, fileId: editingDoc?.drive_file_id ?? undefined },
      });
      if (upErr || !up?.fileId) throw new Error(upErr?.message || "Error subiendo a Drive");
      const { error } = editingDoc
        ? await supabase.from("documents").update({ title: docTitle, drive_file_id: up.fileId, content: null }).eq("id", editingDoc.id)
        : await supabase.from("documents").insert({
            title: docTitle, drive_file_id: up.fileId, content: null, case_id: id, user_id: user.id, kind: "writing",
          });
      if (error) throw error;
      toast.success(editingDoc ? "Escrito actualizado en Drive" : "Escrito guardado en Drive");
      setEditorOpen(false); load();
    } catch (e: any) {
      toast.error(e.message || "Error guardando");
    } finally { setSaving(false); }
  };

  // ---------- Files ----------
  const onPickFile = () => { if (!ensureDrive()) return; fileInputRef.current?.click(); };

  const uploadToDrive = async (file: File): Promise<{ fileId: string }> => {
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = ""; const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as any);
    }
    const base64 = btoa(binary);
    const { data: up, error: upErr } = await supabase.functions.invoke("google-drive", {
      body: { action: "upload-file", fileName: file.name, mimeType: file.type || "application/octet-stream", base64 },
    });
    if (upErr || !up?.fileId) throw new Error(upErr?.message || "Error subiendo a Drive");
    return { fileId: up.fileId };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file || !id) return;
    const mime = file.type || "application/octet-stream";
    const isAllowed = ALLOWED_MIME.includes(mime) || /\.(pdf|docx?|jpg|jpeg|png)$/i.test(file.name);
    if (!isAllowed) return toast.error("Formato no permitido. Usa PDF, DOC, DOCX, JPG o PNG.");
    if (file.size > MAX_BYTES) return toast.error("Archivo demasiado grande (máximo 15 MB).");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUploading(true);
    try {
      const { fileId } = await uploadToDrive(file);
      const { error } = await supabase.from("documents").insert({
        title: file.name, file_name: file.name, mime_type: mime, size_bytes: file.size,
        kind: "file", drive_file_id: fileId, content: null, case_id: id, user_id: user.id,
      });
      if (error) throw error;
      toast.success("Archivo subido a Drive"); load();
    } catch (err: any) {
      toast.error(err.message || "Error subiendo archivo");
    } finally { setUploading(false); }
  };

  // ---------- Meetings ----------
  const openNewMeeting = () => {
    setEditingMeeting(null); setMTitle(""); setMDate(new Date().toISOString().slice(0, 16));
    setMLocation(""); setMParties(""); setMFacts(""); setMLaw(""); setMActions("");
    setMeetingOpen(true);
  };
  const openEditMeeting = (d: Doc) => {
    setEditingMeeting(d); setMTitle(d.title);
    setMDate(d.event_date ? d.event_date.slice(0, 16) : new Date().toISOString().slice(0, 16));
    setMLocation(d.metadata?.location || ""); setMParties(d.metadata?.parties || "");
    setMFacts(d.metadata?.facts || ""); setMLaw(d.metadata?.law || ""); setMActions(d.metadata?.actions || "");
    setMeetingOpen(true);
  };
  const saveMeeting = async () => {
    if (!mTitle.trim()) return toast.error("Título obligatorio");
    if (!mDate) return toast.error("Fecha obligatoria");
    if (!id) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSavingMeeting(true);
    try {
      const payload = {
        title: mTitle, event_date: new Date(mDate).toISOString(),
        metadata: { location: mLocation, parties: mParties, facts: mFacts, law: mLaw, actions: mActions },
      };
      const { error } = editingMeeting
        ? await supabase.from("documents").update(payload).eq("id", editingMeeting.id)
        : await supabase.from("documents").insert({ ...payload, kind: "meeting", case_id: id, user_id: user.id });
      if (error) throw error;
      toast.success(editingMeeting ? "Acta actualizada" : "Acta guardada");
      setMeetingOpen(false); load();
    } catch (e: any) { toast.error(e.message || "Error"); }
    finally { setSavingMeeting(false); }
  };

  // ---------- Sentences ----------
  const openNewSentence = () => {
    if (!ensureDrive()) return;
    setSTitle(""); setSDate(new Date().toISOString().slice(0, 10)); setSDecision(""); setSFile(null);
    setSentenceOpen(true);
  };
  const saveSentence = async () => {
    if (!sTitle.trim()) return toast.error("Título obligatorio");
    if (!sDate) return toast.error("Fecha de la sentencia obligatoria");
    if (!sFile) return toast.error("Adjunta el PDF de la sentencia");
    if (sFile.type !== "application/pdf" && !/\.pdf$/i.test(sFile.name)) return toast.error("Debe ser un archivo PDF");
    if (sFile.size > MAX_BYTES) return toast.error("PDF demasiado grande (máximo 15 MB).");
    if (!id) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSavingSentence(true);
    try {
      const { fileId } = await uploadToDrive(sFile);
      const { error } = await supabase.from("documents").insert({
        title: sTitle, kind: "sentence", drive_file_id: fileId,
        file_name: sFile.name, mime_type: "application/pdf", size_bytes: sFile.size,
        event_date: new Date(sDate).toISOString(),
        metadata: { decision: sDecision },
        case_id: id, user_id: user.id,
      });
      if (error) throw error;
      toast.success("Sentencia guardada en Drive"); setSentenceOpen(false); load();
    } catch (e: any) { toast.error(e.message || "Error"); }
    finally { setSavingSentence(false); }
  };

  // ---------- Common ----------
  const removeDoc = async (doc: Doc) => {
    const label = kindLabel[doc.kind].toLowerCase();
    if (!confirm(`¿Eliminar ${label}?${doc.drive_file_id ? " También se borrará de Google Drive." : ""}`)) return;
    if (doc.drive_file_id) {
      await supabase.functions.invoke("google-drive", { body: { action: "delete", fileId: doc.drive_file_id } });
    }
    const { error } = await supabase.from("documents").delete().eq("id", doc.id);
    if (error) return toast.error(error.message);
    toast.success("Eliminado"); load();
  };

  const fetchDocContent = async (d: Doc): Promise<string> => {
    if (d.drive_file_id) {
      const { data } = await supabase.functions.invoke("google-drive", { body: { action: "download", fileId: d.drive_file_id } });
      return data?.content || "";
    }
    return d.content || "";
  };
  const copyDoc = async (d: Doc) => { await copyHtmlAsText(await fetchDocContent(d)); toast.success("Texto copiado"); };
  const exportDoc = async (d: Doc) => { exportToDocx(d.title, await fetchDocContent(d)); };

  const openFile = async (d: Doc, download = false) => {
    if (!d.drive_file_id) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return toast.error("Sesión expirada");
      const res = await fetch(`${SUPABASE_URL}/functions/v1/google-drive/file?fileId=${d.drive_file_id}`,
        { headers: { Authorization: `Bearer ${session.access_token}`, apikey: SUPABASE_ANON } });
      if (!res.ok) throw new Error("No se pudo descargar el archivo");
      const blob = await res.blob(); const url = URL.createObjectURL(blob);
      if (download) {
        const a = document.createElement("a");
        a.href = url; a.download = d.file_name || d.title;
        document.body.appendChild(a); a.click(); a.remove();
      } else { window.open(url, "_blank"); }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e: any) { toast.error(e.message || "Error abriendo archivo"); }
  };

  const filtered = useMemo(
    () => filter === "all" ? docs : docs.filter((d) => d.kind === filter),
    [docs, filter],
  );

  const counts = useMemo(() => ({
    all: docs.length,
    writing: docs.filter((d) => d.kind === "writing").length,
    file: docs.filter((d) => d.kind === "file").length,
    meeting: docs.filter((d) => d.kind === "meeting").length,
    sentence: docs.filter((d) => d.kind === "sentence").length,
  }), [docs]);

  if (!caseRow) return <div className="text-center text-muted-foreground py-12">Cargando expediente...</div>;

  const statusLabel = caseRow.status === "open" ? "Activo" : caseRow.status === "closed" ? "Cerrado" : "Archivado";

  return (
    <div className="space-y-6">
      <Link to="/expedientes" className="inline-flex items-center text-sm text-muted-foreground hover:text-accent gap-1">
        <ArrowLeft className="h-4 w-4" /> Volver a expedientes
      </Link>

      <div className="border-b border-border pb-6">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
          <div>
            <div className="text-xs font-mono text-muted-foreground mb-1">{caseRow.case_number}</div>
            <h1 className="font-serif text-4xl">{caseRow.title}</h1>
          </div>
          <Badge variant="outline" className="bg-accent/20 text-accent-foreground border-accent/30">{statusLabel}</Badge>
        </div>
        {caseRow.matter && <p className="text-muted-foreground mt-1">{caseRow.matter}</p>}
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Datos del expediente</TabsTrigger>
          <TabsTrigger value="expediente">Historial cronológico ({docs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4 pt-4">
          <Card className="p-6 shadow-card">
            <h3 className="font-serif text-2xl mb-4">Cliente</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><div className="text-xs text-muted-foreground">Nombre</div><div className="font-medium">{caseRow.clients.full_name}</div></div>
              <div><div className="text-xs text-muted-foreground">Cédula</div><div className="font-mono">{caseRow.clients.cedula}</div></div>
              {caseRow.clients.phone && <div><div className="text-xs text-muted-foreground">Teléfono</div><div>{caseRow.clients.phone}</div></div>}
              {caseRow.clients.email && <div><div className="text-xs text-muted-foreground">Email</div><div>{caseRow.clients.email}</div></div>}
            </div>
          </Card>
          {caseRow.description && (
            <Card className="p-6 shadow-card">
              <h3 className="font-serif text-2xl mb-2">Descripción</h3>
              <p className="text-foreground/80 whitespace-pre-wrap">{caseRow.description}</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="expediente" className="space-y-4 pt-4">
          {driveConnected === false && (
            <Card className="p-4 border-l-4 border-l-destructive bg-destructive/5 text-sm">
              Conecta tu Google Drive en <Link to="/cuenta" className="underline font-medium">Mi cuenta</Link> para poder crear escritos, subir archivos o sentencias.
            </Card>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <input ref={fileInputRef} type="file" hidden
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
              onChange={handleFileUpload} />
            <Button variant="outline" onClick={onPickFile} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}Subir archivo
            </Button>
            <Button variant="outline" onClick={openNewMeeting}><Users className="h-4 w-4 mr-2" />Nueva acta</Button>
            <Button variant="outline" onClick={openNewSentence}><Gavel className="h-4 w-4 mr-2" />Nueva sentencia</Button>
            <Button onClick={openNewDoc} className="bg-primary hover:bg-primary-glow"><Plus className="h-4 w-4 mr-2" />Nuevo escrito</Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["all", "writing", "file", "meeting", "sentence"] as const).map((k) => (
              <Button key={k} size="sm" variant={filter === k ? "default" : "outline"} onClick={() => setFilter(k)}>
                {k === "all" ? "Todos" : kindLabel[k]} ({counts[k]})
              </Button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <Card className="p-10 text-center text-muted-foreground">Sin registros en esta vista.</Card>
          ) : (
            <ol className="relative border-l-2 border-border ml-3 space-y-4">
              {filtered.map((d) => {
                const when = d.event_date || d.created_at;
                const isOpen = !!expanded[d.id];
                return (
                  <li key={d.id} className="ml-6">
                    <span className="absolute -left-[9px] mt-3 h-4 w-4 rounded-full bg-accent border-2 border-background" />
                    <Card className="p-4 shadow-card">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex gap-3 min-w-0 flex-1">
                          {iconForDoc(d)}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-medium truncate">{d.title}</h4>
                              <Badge variant="outline" className="text-xs">{kindLabel[d.kind]}</Badge>
                              {d.drive_file_id && <Cloud className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-label="En Drive" />}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(when), "dd MMM yyyy, HH:mm", { locale: es })}
                              {d.size_bytes ? ` · ${formatBytes(d.size_bytes)}` : ""}
                            </p>
                            {d.kind === "meeting" && (
                              <div className="mt-2 text-sm text-foreground/80 space-y-1">
                                {d.metadata?.location && <div><span className="text-muted-foreground">Lugar:</span> {d.metadata.location}</div>}
                                {d.metadata?.parties && <div><span className="text-muted-foreground">Partes:</span> {d.metadata.parties}</div>}
                                {isOpen && (
                                  <div className="mt-2 space-y-2">
                                    {d.metadata?.facts && <div><div className="text-xs uppercase text-muted-foreground">Hechos</div><p className="whitespace-pre-wrap">{d.metadata.facts}</p></div>}
                                    {d.metadata?.law && <div><div className="text-xs uppercase text-muted-foreground">Derecho</div><p className="whitespace-pre-wrap">{d.metadata.law}</p></div>}
                                    {d.metadata?.actions && <div><div className="text-xs uppercase text-muted-foreground">Acciones a seguir</div><p className="whitespace-pre-wrap">{d.metadata.actions}</p></div>}
                                  </div>
                                )}
                              </div>
                            )}
                            {d.kind === "sentence" && d.metadata?.decision && (
                              <div className="mt-2 text-sm">
                                <span className="text-muted-foreground">Decisión:</span>{" "}
                                <span className="whitespace-pre-wrap">{isOpen ? d.metadata.decision : d.metadata.decision.slice(0, 160) + (d.metadata.decision.length > 160 ? "…" : "")}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {(d.kind === "meeting" || (d.kind === "sentence" && d.metadata?.decision && d.metadata.decision.length > 160)) && (
                            <Button size="sm" variant="ghost" onClick={() => setExpanded((s) => ({ ...s, [d.id]: !isOpen }))}>
                              {isOpen ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                              {isOpen ? "Contraer" : "Ver más"}
                            </Button>
                          )}
                          {d.kind === "writing" && (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => openEditDoc(d)}><Edit className="h-4 w-4 mr-1" />Editar</Button>
                              <Button size="sm" variant="ghost" onClick={() => copyDoc(d)}><Copy className="h-4 w-4 mr-1" />Copiar</Button>
                              <Button size="sm" variant="ghost" onClick={() => exportDoc(d)}><FileDown className="h-4 w-4 mr-1" />Word</Button>
                            </>
                          )}
                          {d.kind === "meeting" && (
                            <Button size="sm" variant="ghost" onClick={() => openEditMeeting(d)}><Edit className="h-4 w-4 mr-1" />Editar</Button>
                          )}
                          {(d.kind === "file" || d.kind === "sentence") && (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => openFile(d, false)}><Eye className="h-4 w-4 mr-1" />Ver</Button>
                              <Button size="sm" variant="ghost" onClick={() => openFile(d, true)}><Download className="h-4 w-4 mr-1" />Descargar</Button>
                            </>
                          )}
                          <Button size="icon" variant="ghost" onClick={() => removeDoc(d)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ol>
          )}
        </TabsContent>
      </Tabs>

      {/* Writing editor */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif text-2xl">{editingDoc ? "Editar escrito" : "Nuevo escrito"}</DialogTitle></DialogHeader>
          {loadingDoc ? (
            <div className="py-10 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />Cargando desde Drive…</div>
          ) : (
            <div className="space-y-3">
              <div><Label>Título *</Label><Input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="Ej. Demanda de cumplimiento de contrato" /></div>
              <div><Label>Contenido</Label><RichTextEditor value={docContent} onChange={setDocContent} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancelar</Button>
            <Button onClick={saveDoc} disabled={saving || loadingDoc} className="bg-primary hover:bg-primary-glow">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Guardar en Drive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Meeting dialog */}
      <Dialog open={meetingOpen} onOpenChange={setMeetingOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif text-2xl">{editingMeeting ? "Editar acta de reunión" : "Nueva acta de reunión"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título *</Label><Input value={mTitle} onChange={(e) => setMTitle(e.target.value)} placeholder="Ej. Reunión con el cliente y contraparte" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>Fecha y hora *</Label><Input type="datetime-local" value={mDate} onChange={(e) => setMDate(e.target.value)} /></div>
              <div><Label>Lugar</Label><Input value={mLocation} onChange={(e) => setMLocation(e.target.value)} placeholder="Ej. Oficina, Caracas" /></div>
            </div>
            <div><Label>Partes involucradas</Label><Input value={mParties} onChange={(e) => setMParties(e.target.value)} placeholder="Ej. Cliente, contraparte, abogado" /></div>
            <div><Label>Argumentos de hecho</Label><Textarea rows={4} value={mFacts} onChange={(e) => setMFacts(e.target.value)} /></div>
            <div><Label>Argumentos de derecho</Label><Textarea rows={4} value={mLaw} onChange={(e) => setMLaw(e.target.value)} /></div>
            <div><Label>Acciones a seguir</Label><Textarea rows={4} value={mActions} onChange={(e) => setMActions(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMeetingOpen(false)}>Cancelar</Button>
            <Button onClick={saveMeeting} disabled={savingMeeting} className="bg-primary hover:bg-primary-glow">
              {savingMeeting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Guardar acta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sentence dialog */}
      <Dialog open={sentenceOpen} onOpenChange={setSentenceOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif text-2xl">Nueva sentencia</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título *</Label><Input value={sTitle} onChange={(e) => setSTitle(e.target.value)} placeholder="Ej. Sentencia definitiva - Tribunal 1° Instancia" /></div>
            <div><Label>Fecha de la sentencia *</Label><Input type="date" value={sDate} onChange={(e) => setSDate(e.target.value)} /></div>
            <div><Label>Decisión</Label><Textarea rows={5} value={sDecision} onChange={(e) => setSDecision(e.target.value)} placeholder="Resumen del dispositivo del fallo" /></div>
            <div>
              <Label>PDF de la sentencia *</Label>
              <Input type="file" accept=".pdf,application/pdf" onChange={(e) => setSFile(e.target.files?.[0] ?? null)} />
              {sFile && <p className="text-xs text-muted-foreground mt-1">{sFile.name} · {formatBytes(sFile.size)}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSentenceOpen(false)}>Cancelar</Button>
            <Button onClick={saveSentence} disabled={savingSentence} className="bg-primary hover:bg-primary-glow">
              {savingSentence ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Guardar en Drive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CaseDetail;
