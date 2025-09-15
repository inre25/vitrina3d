// /api/checkout.js
// Vercel Serverless Function (CommonJS)
const nodemailer = require("nodemailer");

async function sendTelegram({ token, chatId, text }) {
  if (!token || !chatId) return { ok: false, error: "TELEGRAM_NOT_CONFIGURED" };
  try {
    const resp = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      }
    );
    const data = await resp.json();
    return { ok: !!data.ok, error: data.ok ? null : JSON.stringify(data) };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

async function sendEmail({
  host,
  port,
  secure,
  user,
  pass,
  to,
  subject,
  text,
}) {
  if (!host || !user || !pass || !to) {
    return { ok: false, error: "MAIL_NOT_CONFIGURED" };
  }
  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(port || 465),
      secure: String(secure ?? "true") === "true",
      auth: { user, pass },
    });
    await transporter.sendMail({
      from: `"Витрина3D" <${user}>`,
      to,
      subject,
      text,
    });
    return { ok: true, error: null };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, message: "Method not allowed" });
    return;
  }

  try {
    const { name, phone, email, comment, items, total } = req.body || {};

    const lines = Array.isArray(items)
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

    // 1) Telegram
    const tgRes = await sendTelegram({
      token: process.env.TELEGRAM_BOT_TOKEN,
      chatId: process.env.TELEGRAM_CHAT_ID,
      text,
    });

    // 2) Email (необязательно)
    const mailRes = await sendEmail({
      host: process.env.MAIL_HOST, // например: "smtp.mail.ru"
      port: process.env.MAIL_PORT, // "465"
      secure: process.env.MAIL_SECURE, // "true" | "false"
      user: process.env.MAIL_USER, // полный логин почты
      pass: process.env.MAIL_PASS, // пароль приложения/SMTP
      to: process.env.MAIL_TO || process.env.MAIL_USER,
      subject: "Новый заказ — Витрина3D",
      text,
    });

    const ok = tgRes.ok || mailRes.ok;
    const status = ok ? 200 : 500;

    res.status(status).json({
      ok,
      channels: { telegram: tgRes.ok, email: mailRes.ok },
      errors: { telegram: tgRes.error, email: mailRes.error },
    });
  } catch (e) {
    res.status(500).json({ ok: false, message: String(e) });
  }
};
