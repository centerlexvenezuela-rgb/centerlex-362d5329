import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ---------- CSV helpers ----------
function csvEscape(v: any): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") {
    try { v = JSON.stringify(v); } catch { v = String(v); }
  }
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
function toCSV(rows: any[], columns?: string[]): string {
  if (!rows || rows.length === 0) {
    return (columns ?? []).join(",") + "\n";
  }
  const cols = columns ?? Object.keys(rows[0]);
  const header = cols.join(",");
  const body = rows.map((r) => cols.map((c) => csvEscape(r[c])).join(",")).join("\n");
  return header + "\n" + body + "\n";
}

// ---------- Minimal ZIP writer (store / no compression) ----------
// Produces a valid .zip using STORE method. Good enough for CSV bundles.
function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = c ^ buf[i];
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}
function dosDateTime(d = new Date()): { date: number; time: number } {
  const time = ((d.getHours() & 0x1f) << 11) | ((d.getMinutes() & 0x3f) << 5) | ((Math.floor(d.getSeconds() / 2)) & 0x1f);
  const date = (((d.getFullYear() - 1980) & 0x7f) << 9) | (((d.getMonth() + 1) & 0xf) << 5) | (d.getDate() & 0x1f);
  return { date, time };
}
function strToBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}
function u16(n: number): Uint8Array {
  const b = new Uint8Array(2);
  new DataView(b.buffer).setUint16(0, n, true);
  return b;
}
function u32(n: number): Uint8Array {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, n >>> 0, true);
  return b;
}
function concat(arrs: Uint8Array[]): Uint8Array {
  const total = arrs.reduce((a, b) => a + b.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const a of arrs) { out.set(a, o); o += a.length; }
  return out;
}
function buildZip(files: { path: string; data: Uint8Array }[]): Uint8Array {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;
  const { date, time } = dosDateTime();

  for (const f of files) {
    const nameBytes = strToBytes(f.path);
    const crc = crc32(f.data);
    const size = f.data.length;

    // Local file header
    const local = concat([
      u32(0x04034b50),
      u16(20),          // version needed
      u16(0x0800),      // general purpose bit flag (UTF-8 names)
      u16(0),           // method = STORE
      u16(time),
      u16(date),
      u32(crc),
      u32(size),
      u32(size),
      u16(nameBytes.length),
      u16(0),           // extra length
      nameBytes,
      f.data,
    ]);
    localParts.push(local);

    // Central directory header
    const central = concat([
      u32(0x02014b50),
      u16(20),          // version made by
      u16(20),          // version needed
      u16(0x0800),      // flags
      u16(0),           // method
      u16(time),
      u16(date),
      u32(crc),
      u32(size),
      u32(size),
      u16(nameBytes.length),
      u16(0),           // extra
      u16(0),           // comment
      u16(0),           // disk number
      u16(0),           // internal attrs
      u32(0),           // external attrs
      u32(offset),      // local header offset
      nameBytes,
    ]);
    centralParts.push(central);
    offset += local.length;
  }

  const centralBytes = concat(centralParts);
  const centralSize = centralBytes.length;
  const centralOffset = offset;

  const eocd = concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(centralSize),
    u32(centralOffset),
    u16(0),
  ]);

  return concat([...localParts, centralBytes, eocd]);
}

// ---------- Sanitize folder name ----------
function safeName(s: string): string {
  return (s || "sin_nombre")
    .normalize("NFKD")
    .replace(/[^\w\s.-]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 80) || "sin_nombre";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Sesión inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Acceso solo administrador" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const mode = (body.mode as string) || "global"; // "global" | "per_lawyer"

    // Pull all data
    const [
      { data: usersList },
      { data: profiles },
      { data: roles },
      { data: clients },
      { data: cases },
      { data: documents },
      { data: appointments },
    ] = await Promise.all([
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      admin.from("profiles").select("user_id, first_name, last_name, ai_enabled, fees_enabled, created_at"),
      admin.from("user_roles").select("user_id, role"),
      admin.from("clients").select("*").order("created_at", { ascending: true }),
      admin.from("cases").select("*").order("created_at", { ascending: true }),
      admin.from("documents").select("*").order("created_at", { ascending: true }),
      admin.from("appointments").select("*").order("appointment_date", { ascending: true }),
    ]);

    // Build lawyer map: user_id -> {email, full_name}
    const lawyerIds = new Set(
      (roles ?? []).filter((r: any) => r.role === "lawyer").map((r: any) => r.user_id),
    );
    const userInfo = new Map<string, { email: string; full_name: string; first_name: string; last_name: string }>();
    for (const u of usersList?.users ?? []) {
      if (!lawyerIds.has(u.id)) continue;
      const p = profiles?.find((x: any) => x.user_id === u.id);
      const fn = p?.first_name ?? "";
      const ln = p?.last_name ?? "";
      userInfo.set(u.id, {
        email: u.email ?? "",
        full_name: [fn, ln].filter(Boolean).join(" ").trim(),
        first_name: fn,
        last_name: ln,
      });
    }

    const enrich = (rows: any[] | null) =>
      (rows ?? []).map((r) => {
        const info = userInfo.get(r.user_id);
        return {
          ...r,
          lawyer_email: info?.email ?? "",
          lawyer_full_name: info?.full_name ?? "",
        };
      });

    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const files: { path: string; data: Uint8Array }[] = [];

    if (mode === "global") {
      const lawyersRows = Array.from(userInfo.entries()).map(([id, info]) => ({
        user_id: id,
        email: info.email,
        first_name: info.first_name,
        last_name: info.last_name,
        full_name: info.full_name,
      }));

      files.push({ path: `respaldo_global_${stamp}/abogados.csv`, data: strToBytes(toCSV(lawyersRows, ["user_id", "email", "first_name", "last_name", "full_name"])) });
      files.push({ path: `respaldo_global_${stamp}/clientes.csv`, data: strToBytes(toCSV(enrich(clients))) });
      files.push({ path: `respaldo_global_${stamp}/expedientes.csv`, data: strToBytes(toCSV(enrich(cases))) });
      files.push({ path: `respaldo_global_${stamp}/documentos.csv`, data: strToBytes(toCSV(enrich(documents))) });
      files.push({ path: `respaldo_global_${stamp}/citas.csv`, data: strToBytes(toCSV(enrich(appointments))) });
      files.push({
        path: `respaldo_global_${stamp}/LEEME.txt`,
        data: strToBytes(
          `Respaldo global generado el ${new Date().toISOString()}\n\n` +
          `- abogados.csv: cuentas de abogados registrados\n` +
          `- clientes.csv: todos los clientes (columna lawyer_email indica el due\u00f1o)\n` +
          `- expedientes.csv: todos los expedientes\n` +
          `- documentos.csv: todos los escritos/documentos\n` +
          `- citas.csv: todas las citas\n`,
        ),
      });
    } else {
      // per_lawyer
      const root = `respaldo_por_abogado_${stamp}`;
      const summary: any[] = [];
      for (const [uid, info] of userInfo.entries()) {
        const folder = `${root}/${safeName(info.full_name || info.email)}_${uid.slice(0, 8)}`;
        const ownClients = (clients ?? []).filter((r: any) => r.user_id === uid);
        const ownCases = (cases ?? []).filter((r: any) => r.user_id === uid);
        const ownDocs = (documents ?? []).filter((r: any) => r.user_id === uid);
        const ownAppts = (appointments ?? []).filter((r: any) => r.user_id === uid);

        files.push({ path: `${folder}/clientes.csv`, data: strToBytes(toCSV(ownClients)) });
        files.push({ path: `${folder}/expedientes.csv`, data: strToBytes(toCSV(ownCases)) });
        files.push({ path: `${folder}/documentos.csv`, data: strToBytes(toCSV(ownDocs)) });
        files.push({ path: `${folder}/citas.csv`, data: strToBytes(toCSV(ownAppts)) });
        files.push({
          path: `${folder}/INFO.txt`,
          data: strToBytes(
            `Abogado: ${info.full_name || "(sin nombre)"}\n` +
            `Email: ${info.email}\n` +
            `User ID: ${uid}\n` +
            `Generado: ${new Date().toISOString()}\n`,
          ),
        });

        summary.push({
          user_id: uid,
          email: info.email,
          full_name: info.full_name,
          clientes: ownClients.length,
          expedientes: ownCases.length,
          documentos: ownDocs.length,
          citas: ownAppts.length,
        });
      }
      files.push({ path: `${root}/_resumen.csv`, data: strToBytes(toCSV(summary, ["user_id", "email", "full_name", "clientes", "expedientes", "documentos", "citas"])) });
    }

    const zip = buildZip(files);
    const filename = mode === "global" ? `respaldo_global_${stamp}.zip` : `respaldo_por_abogado_${stamp}.zip`;

    return new Response(zip, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e: any) {
    console.error("admin-backup error:", e);
    return new Response(JSON.stringify({ error: e.message ?? "Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
