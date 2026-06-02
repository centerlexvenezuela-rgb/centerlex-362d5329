// Google Drive integration for Lex Office.
// Each lawyer connects their own Google account; we store ONLY the refresh token
// and the fileId of each document. The HTML content lives in their Drive,
// inside a visible folder called "Lex Office".

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/google-drive/callback`;
const SCOPES = ["https://www.googleapis.com/auth/drive.file", "openid", "email"];
const FOLDER_NAME = "Lex Office";

const admin = () => createClient(SUPABASE_URL, SERVICE_ROLE);

async function authedUser(req: Request): Promise<{ id: string } | null> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: auth } },
  });
  const { data } = await sb.auth.getClaims(auth.replace("Bearer ", ""));
  return data?.claims ? { id: data.claims.sub as string } : null;
}

// ---------- Token helpers ----------
async function exchangeCode(code: string) {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  if (!r.ok) throw new Error(`token exchange failed: ${await r.text()}`);
  return r.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    id_token?: string;
    expires_in: number;
  }>;
}

async function refreshAccess(refresh_token: string): Promise<string> {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token,
      grant_type: "refresh_token",
    }),
  });
  if (!r.ok) throw new Error(`refresh failed: ${await r.text()}`);
  const j = await r.json();
  return j.access_token as string;
}

async function getUserAccessToken(userId: string): Promise<{ token: string; folderId: string }> {
  const sb = admin();
  const { data: p, error } = await sb
    .from("profiles")
    .select("google_refresh_token, google_folder_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!p?.google_refresh_token) throw new Error("Google Drive no está conectado");
  const token = await refreshAccess(p.google_refresh_token);
  let folderId = p.google_folder_id;
  if (!folderId) folderId = await ensureFolder(token, userId);
  return { token, folderId };
}

async function ensureFolder(accessToken: string, userId: string): Promise<string> {
  // search for existing folder
  const q = encodeURIComponent(
    `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
  );
  const list = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const lj = await list.json();
  let id: string | undefined = lj.files?.[0]?.id;
  if (!id) {
    const c = await fetch("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: FOLDER_NAME,
        mimeType: "application/vnd.google-apps.folder",
      }),
    });
    const cj = await c.json();
    id = cj.id;
  }
  await admin().from("profiles").update({ google_folder_id: id }).eq("user_id", userId);
  return id!;
}

// ---------- Drive ops ----------
async function driveUpload(
  accessToken: string,
  folderId: string,
  name: string,
  html: string,
  existingId?: string,
): Promise<string> {
  const boundary = "lexoffice" + crypto.randomUUID();
  const metadata: Record<string, unknown> = { name: `${name}.html`, mimeType: "text/html" };
  if (!existingId) metadata.parents = [folderId];

  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    JSON.stringify(metadata) +
    `\r\n--${boundary}\r\n` +
    `Content-Type: text/html\r\n\r\n` +
    html +
    `\r\n--${boundary}--`;

  const url = existingId
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=multipart`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;
  const method = existingId ? "PATCH" : "POST";

  const r = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  if (!r.ok) throw new Error(`drive upload: ${await r.text()}`);
  const j = await r.json();
  return j.id as string;
}

async function driveDownload(accessToken: string, fileId: string): Promise<string> {
  const r = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!r.ok) throw new Error(`drive download: ${await r.text()}`);
  return await r.text();
}

async function driveDelete(accessToken: string, fileId: string): Promise<void> {
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// ---------- HTTP entry ----------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/google-drive/, "").replace(/^\/functions\/v1\/google-drive/, "");

  try {
    // ---- OAuth callback (browser redirect from Google) ----
    if (path === "/callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state"); // = user JWT
      const errorParam = url.searchParams.get("error");
      const origin = url.searchParams.get("origin_url") || "";

      const closeHtml = (msg: string, ok: boolean) => `<!doctype html><html><body style="font-family:system-ui;padding:40px;text-align:center">
<h2>${ok ? "✅ Google Drive conectado" : "❌ Error"}</h2><p>${msg}</p>
<p><a href="${origin || "/"}">Volver a la aplicación</a></p>
<script>setTimeout(()=>{ if(window.opener){window.opener.postMessage({type:'gdrive-${ok ? "connected" : "error"}'}, '*');window.close();} else { window.location.href='${origin || "/cuenta"}'; } }, 1200);</script>
</body></html>`;

      if (errorParam) return new Response(closeHtml(errorParam, false), { headers: { "Content-Type": "text/html" } });
      if (!code || !state) return new Response(closeHtml("Faltan parámetros", false), { headers: { "Content-Type": "text/html" } });

      // verify state (= user JWT)
      const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data: claims } = await sb.auth.getClaims(state);
      const userId = claims?.claims?.sub as string | undefined;
      if (!userId) return new Response(closeHtml("Sesión inválida", false), { headers: { "Content-Type": "text/html" } });

      const tok = await exchangeCode(code);
      if (!tok.refresh_token) {
        return new Response(
          closeHtml("Google no devolvió refresh_token. Revoca el acceso en https://myaccount.google.com/permissions y reintenta.", false),
          { headers: { "Content-Type": "text/html" } },
        );
      }
      // decode email from id_token (payload only, no signature check needed - just for display)
      let email: string | null = null;
      if (tok.id_token) {
        try {
          const payload = JSON.parse(atob(tok.id_token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
          email = payload.email ?? null;
        } catch (_) { /* ignore */ }
      }

      const folderId = await ensureFolder(tok.access_token, userId);

      await admin().from("profiles").update({
        google_refresh_token: tok.refresh_token,
        google_email: email,
        google_folder_id: folderId,
        google_connected_at: new Date().toISOString(),
      }).eq("user_id", userId);

      return new Response(closeHtml(`Conectado como ${email ?? "tu cuenta de Google"}`, true), {
        headers: { "Content-Type": "text/html" },
      });
    }

    // ---- All other actions require auth ----
    const user = await authedUser(req);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const action = body.action || url.searchParams.get("action");

    if (action === "auth-url") {
      // The Authorization header IS our state (user JWT)
      const state = req.headers.get("Authorization")!.replace("Bearer ", "");
      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: "code",
        scope: SCOPES.join(" "),
        access_type: "offline",
        prompt: "consent",
        state,
      });
      return json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
    }

    if (action === "status") {
      const { data: p } = await admin()
        .from("profiles")
        .select("google_email, google_connected_at, google_folder_id")
        .eq("user_id", user.id)
        .maybeSingle();
      return json({
        connected: !!p?.google_email,
        email: p?.google_email ?? null,
        connected_at: p?.google_connected_at ?? null,
      });
    }

    if (action === "disconnect") {
      await admin().from("profiles").update({
        google_refresh_token: null,
        google_email: null,
        google_folder_id: null,
        google_connected_at: null,
      }).eq("user_id", user.id);
      return json({ ok: true });
    }

    // The next actions need a live access token
    const { token, folderId } = await getUserAccessToken(user.id);

    if (action === "upload") {
      // body: { title, content, fileId? }
      const fileId = await driveUpload(token, folderId, body.title || "Escrito", body.content || "", body.fileId);
      return json({ fileId });
    }
    if (action === "download") {
      const content = await driveDownload(token, body.fileId);
      return json({ content });
    }
    if (action === "delete") {
      await driveDelete(token, body.fileId);
      return json({ ok: true });
    }
    if (action === "migrate") {
      // Move every doc of this user that still has content but no drive_file_id to Drive
      const sb = admin();
      const { data: docs } = await sb.from("documents")
        .select("id, title, content, drive_file_id")
        .eq("user_id", user.id);
      let migrated = 0, errors = 0;
      for (const d of docs || []) {
        if (d.drive_file_id || !d.content) continue;
        try {
          const fid = await driveUpload(token, folderId, d.title, d.content);
          await sb.from("documents").update({ drive_file_id: fid, content: null }).eq("id", d.id);
          migrated++;
        } catch (_) { errors++; }
      }
      return json({ migrated, errors });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
