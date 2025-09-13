export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ ok: false, error: "Method not allowed" });

  try {
    const { items = [], total = 0, customer = {} } = req.body || {};
    const pretty = (n) => Number(n || 0).toFixed(2);

    const lines = items
      .map(
        (it, i) =>
          `${i + 1}) ${it.title} — ${pretty(it.price)}\n` +
          `   Высота: ${it.heightMM} мм | Слой: ${it.currentLayer}/${it.layers} | Шаг: ${it.layerHeight} мм`
      )
      .join("\n");

    const text =
      `🧾 Новая заявка с витрины 3D\n\n` +
      `👤 Клиент: ${customer.name || "-"}\n` +
      `📞 Телефон: ${customer.phone || "-"}\n` +
      `✉️ Email: ${customer.email || "-"}\n` +
      (customer.comment ? `💬 Комментарий: ${customer.comment}\n` : "") +
      `\nТовары:\n${lines || "—"}\n\n` +
      `Итого: ${pretty(total)}`;

    // --- Telegram ---
    const BOT = process.env.TG_BOT_TOKEN;
    const CHAT = process.env.TG_CHAT_ID;
    if (BOT && CHAT) {
      await fetch(`https://api.telegram.org/bot${BOT}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: CHAT, text }),
      });
    }

    // --- Email через SMTP (Nodemailer) ---
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, TO_EMAIL, FROM_EMAIL } =
      process.env;
    if (SMTP_HOST && SMTP_USER && SMTP_PASS && TO_EMAIL) {
      const nodemailer = (await import("nodemailer")).default;
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT || 587),
        secure: Number(SMTP_PORT || 587) === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      });
      await transporter.sendMail({
        from: FROM_EMAIL || SMTP_USER,
        to: TO_EMAIL,
        subject: "Новая заявка с витрины 3D",
        text,
        html: text.replace(/\n/g, "<br>"),
      });
    }

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
}
