// /api/checkout.js  — читает и SMTP_*, и MAIL_*; Телега = успех, почта опциональна
const nodemailer = require("nodemailer");

// берём значение из двух возможных имён переменных
const env = (k1, k2, def = undefined) =>
  process.env[k1] ?? process.env[k2] ?? def;

async function sendTG(text) {
  const token = env("TELEGRAM_BOT_TOKEN");
  const chatId = env("TELEGRAM_CHAT_ID");
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
  const host = env("MAIL_HOST", "SMTP_HOST");
  const user = env("MAIL_USER", "SMTP_USER");
  const pass = env("MAIL_PASS", "SMTP_PASS");
  const to = env("MAIL_TO", "TO_EMAIL", user);
  const port = Number(env("MAIL_PORT", "SMTP_PORT", 465));
  const secure = String(env("MAIL_SECURE", "SMTP_SECURE", "true")) === "true";

  if (!host || !user || !pass || !to)
    return { ok: false, err: "MAIL_NOT_CONFIGURED" };

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: env("FROM_EMAIL", undefined, `"Витрина3D" <${user}>`),
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
    return res.status(200).json({ ok: true, note: "checkout готов" });
  }

  try {
    const { name, phone, email, comment, items, total } = req.body || {};

    const lines =
      Array.isArray(items) && items.length
        ? items
            .map((it, i) => {
              const title = it.title || it.name || "Товар";
              const qty = it.qty || it.quantity || 1;
              const price = it.price ?? 0;
              return `${i + 1}. ${title} — ${price} руб. × ${qty}`;
            })
            .join("\n")
        : "Товары не переданы.";

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
      lines,
    ].join("\n");

    // 1) Telegram (обязательный канал)
    const tg = await sendTG(text);

    // 2) Email (необязательный)
    const mail = await sendMail({ subject: "Новый заказ — Витрина3D", text });

    const ok = tg.ok || mail.ok; // успех, если ушло хотя бы в Телеграм
    return res.status(ok ? 200 : 500).json({
      ok,
      channels: { telegram: tg.ok, email: mail.ok },
      errors: { telegram: tg.err, email: mail.err },
    });
  } catch (e) {
    return res.status(500).json({ ok: false, message: String(e) });
  }
};
