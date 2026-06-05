import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Plus, FileText, Trash2, Edit, Copy, FileDown, Save, Loader2, Cloud,
  Upload, Image as ImageIcon, File as FileIcon, Eye, Download,
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
interface Doc {
  id: string; title: string; content: string | null; drive_file_id: string | null;
  kind: "writing" | "file"; mime_type: string | null; file_name: string | null; size_bytes: number | null;
  created_at: string; updated_at: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const ALLOWED_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/jpg",
  "image/png",
];
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

const formatBytes = (n: number | null) => {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

const iconForDoc = (d: Doc) => {
  if (d.kind === "writing") return <FileText className="h-5 w-5 text-accent shrink-0" />;
  if (d.mime_type?.startsWith("image/")) return <ImageIcon className="h-5 w-5 text-accent shrink-0" />;
  return <FileIcon className="h-5 w-5 text-accent shrink-0" />;
};

const CaseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [caseRow, setCaseRow] = useState<CaseDetail | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docContent, setDocContent] = useState("");
  const [editingDoc, setEditingDoc] = useState<Doc | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [driveConnected, setDriveConnected] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!id) return;
    const { data: c } = await supabase.from("cases").select("*, clients(full_name, cedula, phone, email)").eq("id", id).maybeSingle();
    setCaseRow(c as any);
    const { data: d } = await supabase.from("documents").select("*").eq("case_id", id).order("created_at", { ascending: false });
    setDocs((d as Doc[]) || []);
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
        body: {
          action: "upload",
          title: docTitle,
          content: docContent,
          fileId: editingDoc?.drive_file_id ?? undefined,
        },
      });
      if (upErr || !up?.fileId) throw new Error(upErr?.message || "Error subiendo a Drive");

      const { error } = editingDoc
        ? await supabase.from("documents").update({ title: docTitle, drive_file_id: up.fileId, content: null }).eq("id", editingDoc.id)
        : await supabase.from("documents").insert({
            title: docTitle, drive_file_id: up.fileId, content: null, case_id: id, user_id: user.id, kind: "writing",
          });
      if (error) throw error;
      toast.success(editingDoc ? "Escrito actualizado en Drive" : "Escrito guardado en Drive");
      setEditorOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message || "Error guardando");
    } finally {
      setSaving(false);
    }
  };

  const onPickFile = () => {
    if (!ensureDrive()) return;
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !id) return;

    const mime = file.type || "application/octet-stream";
    const isAllowed = ALLOWED_MIME.includes(mime) || /\.(pdf|docx?|jpg|jpeg|png)$/i.test(file.name);
    if (!isAllowed) return toast.error("Formato no permitido. Usa PDF, DOC, DOCX, JPG o PNG.");
    if (file.size > MAX_BYTES) return toast.error("Archivo demasiado grande (máximo 15 MB).");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUploading(true);
    try {
      // Convert to base64
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let binary = "";
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as any);
      }
      const base64 = btoa(binary);

      const { data: up, error: upErr } = await supabase.functions.invoke("google-drive", {
        body: { action: "upload-file", fileName: file.name, mimeType: mime, base64 },
      });
      if (upErr || !up?.fileId) throw new Error(upErr?.message || "Error subiendo a Drive");

      const { error } = await supabase.from("documents").insert({
        title: file.name,
        file_name: file.name,
        mime_type: mime,
        size_bytes: file.size,
        kind: "file",
        drive_file_id: up.fileId,
        content: null,
        case_id: id,
        user_id: user.id,
      });
      if (error) throw error;
      toast.success("Archivo subido a Drive");
      load();
    } catch (err: any) {
      toast.error(err.message || "Error subiendo archivo");
    } finally {
      setUploading(false);
    }
  };

  const removeDoc = async (doc: Doc) => {
    const label = doc.kind === "file" ? "este archivo" : "este escrito";
    if (!confirm(`¿Eliminar ${label}? También se borrará de Google Drive.`)) return;
    if (doc.drive_file_id) {
      await supabase.functions.invoke("google-drive", { body: { action: "delete", fileId: doc.drive_file_id } });
    }
    const { error } = await supabase.from("documents").delete().eq("id", doc.id);
    if (error) return toast.error(error.message);
    toast.success("Eliminado");
    load();
  };

  const fetchDocContent = async (d: Doc): Promise<string> => {
    if (d.drive_file_id) {
      const { data } = await supabase.functions.invoke("google-drive", {
        body: { action: "download", fileId: d.drive_file_id },
      });
      return data?.content || "";
    }
    return d.content || "";
  };

  const copyDoc = async (d: Doc) => {
    const html = await fetchDocContent(d);
    await copyHtmlAsText(html);
    toast.success("Texto copiado al portapapeles");
  };

  const exportDoc = async (d: Doc) => {
    const html = await fetchDocContent(d);
    exportToDocx(d.title, html);
  };

  const openFile = async (d: Doc, download = false) => {
    if (!d.drive_file_id) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return toast.error("Sesión expirada");
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/google-drive/file?fileId=${d.drive_file_id}`,
        { headers: { Authorization: `Bearer ${session.access_token}`, apikey: SUPABASE_ANON } },
      );
      if (!res.ok) throw new Error("No se pudo descargar el archivo");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (download) {
        const a = document.createElement("a");
        a.href = url; a.download = d.file_name || d.title;
        document.body.appendChild(a); a.click(); a.remove();
      } else {
        window.open(url, "_blank");
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e: any) {
      toast.error(e.message || "Error abriendo archivo");
    }
  };

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
          <TabsTrigger value="expediente">Expediente cronológico ({docs.length})</TabsTrigger>
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
              Conecta tu Google Drive en <Link to="/cuenta" className="underline font-medium">Mi cuenta</Link> para poder crear escritos o subir archivos.
            </Card>
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
              onChange={handleFileUpload}
            />
            <Button variant="outline" onClick={onPickFile} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Subir archivo
            </Button>
            <Button onClick={openNewDoc} className="bg-primary hover:bg-primary-glow"><Plus className="h-4 w-4 mr-2" />Nuevo escrito</Button>
          </div>

          {docs.length === 0 ? (
            <Card className="p-10 text-center text-muted-foreground">Aún no hay piezas en este expediente.</Card>
          ) : (
            <ol className="relative border-l-2 border-border ml-3 space-y-4">
              {docs.map((d) => (
                <li key={d.id} className="ml-6">
                  <span className="absolute -left-[9px] mt-3 h-4 w-4 rounded-full bg-accent border-2 border-background" />
                  <Card className="p-4 shadow-card">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex gap-3 min-w-0 flex-1">
                        {iconForDoc(d)}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium truncate">{d.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {d.kind === "writing" ? "Escrito" : d.mime_type?.startsWith("image/") ? "Imagen" : "Documento"}
                            </Badge>
                            {d.drive_file_id && <Cloud className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-label="En Drive" />}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(d.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                            {d.size_bytes ? ` · ${formatBytes(d.size_bytes)}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {d.kind === "writing" ? (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => openEditDoc(d)}><Edit className="h-4 w-4 mr-1" />Editar</Button>
                            <Button size="sm" variant="ghost" onClick={() => copyDoc(d)}><Copy className="h-4 w-4 mr-1" />Copiar</Button>
                            <Button size="sm" variant="ghost" onClick={() => exportDoc(d)}><FileDown className="h-4 w-4 mr-1" />Word</Button>
                          </>
                        ) : (
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
              ))}
            </ol>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif text-2xl">{editingDoc ? "Editar escrito" : "Nuevo escrito"}</DialogTitle></DialogHeader>
          {loadingDoc ? (
            <div className="py-10 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />Cargando desde Drive…</div>
          ) : (
            <div className="space-y-3">
              <div>
                <Label>Título *</Label>
                <Input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="Ej. Demanda de cumplimiento de contrato" />
              </div>
              <div>
                <Label>Contenido</Label>
                <RichTextEditor value={docContent} onChange={setDocContent} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancelar</Button>
            <Button onClick={saveDoc} disabled={saving || loadingDoc} className="bg-primary hover:bg-primary-glow">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Guardar en Drive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CaseDetail;
