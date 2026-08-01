import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const adminClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

export type BotKind = "payments" | "signups" | "inactive";

export async function sendTelegram(kind: BotKind, text: string) {
  const admin = adminClient();
  const tokenKey = `telegram_${kind}_token`;
  const chatKey = `telegram_${kind}_chat_id`;
  const { data } = await admin
    .from("notification_settings")
    .select("key, value")
    .in("key", [tokenKey, chatKey]);

  const token = data?.find((r) => r.key === tokenKey)?.value?.trim();
  const chatId = data?.find((r) => r.key === chatKey)?.value?.trim();

  if (!token || !chatId) {
    console.warn(`Telegram (${kind}) no configurado`);
    return { sent: false, reason: "not_configured" };
  }

  const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
  if (!resp.ok) {
    const body = await resp.text();
    console.error(`Telegram (${kind}) error`, resp.status, body);
    return { sent: false, reason: body };
  }
  return { sent: true };
}

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
