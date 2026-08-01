import { adminClient, corsHeaders, json, sendTelegram } from "../_shared/telegram.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const message = String(body.message ?? "").trim();

    if (!name || !message) {
      return json({ error: "Nombre y mensaje son obligatorios" }, 400);
    }

    const admin = adminClient();
    await admin.from("contact_messages").insert({
      first_name: name,
      last_name: "",
      email: email || null,
      message: `[CUENTA INACTIVA] ${phone ? `Tel: ${phone}. ` : ""}${message}`,
    });

    const text =
      `⛔️ <b>Contacto de cuenta inactiva</b>\n` +
      `Nombre: ${name}\n` +
      `Email: ${email || "—"}\n` +
      `Teléfono: ${phone || "—"}\n` +
      `Mensaje: ${message}`;
    const notified = await sendTelegram("inactive", text);

    return json({ ok: true, notified });
  } catch (e) {
    console.error("inactive-contact error", e);
    return json({ error: (e as Error).message ?? "Error" }, 500);
  }
});
