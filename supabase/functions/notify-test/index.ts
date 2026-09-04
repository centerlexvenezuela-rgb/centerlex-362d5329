import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import { corsHeaders, json, sendTelegram, type BotKind } from "../_shared/telegram.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "No autorizado" }, 401);
    }

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Sesión inválida" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) return json({ error: "Acceso solo administrador" }, 403);

    const body = await req.json().catch(() => ({}));
    const kind = String(body?.kind ?? "") as BotKind;
    if (!["payments", "signups", "inactive"].includes(kind)) {
      return json({ error: "Bot inválido" }, 400);
    }

    const result = await sendTelegram(
      kind,
      `✅ <b>Prueba de notificaciones</b>\nBot: <code>${kind}</code>\nFecha: ${new Date().toLocaleString("es-VE")}`,
    );

    if (!result.sent) {
      const reason = result.reason === "not_configured"
        ? "Falta el token o el Chat ID de este bot."
        : String(result.reason);
      return json({ ok: false, error: reason }, 200);
    }
    return json({ ok: true });
  } catch (e) {
    console.error("notify-test error", e);
    return json({ error: "Error procesando la solicitud" }, 500);
  }
});
