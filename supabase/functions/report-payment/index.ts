import { adminClient, corsHeaders, json, sendTelegram } from "../_shared/telegram.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const month = String(body.month ?? "").trim();
    const amount = Number(body.amount);
    const reference = String(body.reference ?? "").trim();
    const paidAt = body.paid_at ? new Date(body.paid_at).toISOString() : null;

    if (!month || !reference || !Number.isFinite(amount) || amount <= 0) {
      return json({ error: "Mes, monto y referencia son obligatorios" }, 400);
    }

    const admin = adminClient();

    // Resolve the reporting user when the request carries a session
    let userId: string | null = null;
    let email: string | null = body.reporter_email?.trim() || null;
    let name: string | null = body.reporter_name?.trim() || null;

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (token) {
      const { data } = await admin.auth.getUser(token);
      if (data?.user) {
        userId = data.user.id;
        email = email ?? data.user.email ?? null;
        const { data: prof } = await admin
          .from("profiles")
          .select("first_name, last_name")
          .eq("user_id", data.user.id)
          .maybeSingle();
        if (!name && prof) {
          name = [prof.first_name, prof.last_name].filter(Boolean).join(" ").trim() || null;
        }
      }
    }

    // Avoid duplicated references
    const { data: dup } = await admin
      .from("payments")
      .select("id")
      .eq("reference", reference)
      .maybeSingle();
    if (dup) {
      return json({ error: "Esta referencia ya fue reportada anteriormente" }, 409);
    }

    const { data: inserted, error } = await admin
      .from("payments")
      .insert({
        user_id: userId,
        reporter_name: name,
        reporter_email: email,
        month,
        amount,
        reference,
        paid_at: paidAt,
      })
      .select()
      .single();
    if (error) throw error;

    const text =
      `💵 <b>Nuevo reporte de pago</b>\n` +
      `Abogado: ${name ?? "—"}\n` +
      `Email: ${email ?? "—"}\n` +
      `Mes: ${month}\n` +
      `Monto: ${amount}\n` +
      `Referencia: <code>${reference}</code>\n` +
      `Fecha del pago: ${paidAt ? new Date(paidAt).toLocaleString("es-VE") : "—"}`;
    const notified = await sendTelegram("payments", text);

    return json({ payment: inserted, notified });
  } catch (e) {
    console.error("report-payment error", e);
    return json({ error: (e as Error).message ?? "Error" }, 500);
  }
});
