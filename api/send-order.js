// /api/send-order.js  (Vercel serverless; CommonJS)
const nodemailer = require("nodemailer");

async function sendTG(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { ok: false, err: "TELEGRAM_NOT_CONFIGURED" };

  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    const data = await r.json();
    return { ok: !!data.ok, err: data.ok ? null : JSON.stringify(data) };
  } catch (e) {
    return { ok: false, err: String(e) };
  }
}

async function sendMail({ subject, text }) {
  const host = process.env.MAIL_HOST;
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;
  const to = process.env.MAIL_TO || user;

  if (!host || !user || !pass || !to)
    return { ok: false, err: "MAIL_NOT_CONFIGURED" };

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.MAIL_PORT || 465),
      secure: String(process.env.MAIL_SECURE ?? "true") === "true",
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"Витрина3D" <${user}>`,
      to,
      subject,
      text,
    });
    return { ok: true, err: null };
  } catch (e) {
    return { ok: false, err: String(e) };
  }
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, message: "Method not allowed" });
    return;
  }

  try {
    const { name, phone, email, comment, items, total } = req.body || {};

    const lines =
      Array.isArray(items) && items.length
        ? items.map((it, i) => {
            const title = it.title || it.name || "Товар";
            const qty = it.qty || it.quantity || 1;
            const price = it.price ?? 0;
            return `${i + 1}. ${title} — ${price} руб. × ${qty}`;
          })
        : ["Товары не переданы."];

    const text = [
      "Новый заказ с Витрина3D",
      "------------------------",
      `Имя: ${name || "-"}`,
      `Телефон: ${phone || "-"}`,
      `Email: ${email || "-"}`,
      `Комментарий: ${comment || "-"}`,
      `Итого: ${total ?? 0} руб.`,
      "",
      "Состав:",
      ...lines,
    ].join("\n");

    const tg = await sendTG(text);
    const mail = await sendMail({ subject: "Новый заказ — Витрина3D", text });

    // Считаем успех, если хотя бы Телега ушла
    const ok = tg.ok || mail.ok;
    res.status(ok ? 200 : 500).json({
      ok,
      channels: { telegram: tg.ok, email: mail.ok },
      errors: { telegram: tg.err, email: mail.err },
    });
  } catch (e) {
    res.status(500).json({ ok: false, message: String(e) });
  }
};
