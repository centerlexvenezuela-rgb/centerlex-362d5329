import { corsHeaders, json, sendTelegram, type BotKind } from "../_shared/telegram.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const kind = String(body.kind ?? "") as BotKind;
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
    return json({ error: (e as Error).message ?? "Error" }, 500);
  }
});
