// api/checkout.js
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  // Разрешаем только POST
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, errors: ["METHOD_NOT_ALLOWED"] });
  }

  // Читаем тело
  const {
    name = "",
    phone = "",
    email = "",
    comment = "",
    cart = [],
    total = 0,
  } = req.body || {};

  // Валидация минимальная
  const errors = [];
  if (!name.trim()) errors.push("NO_NAME");
  if (!phone.trim()) errors.push("NO_PHONE");
  if (!Array.isArray(cart) || cart.length === 0) errors.push("EMPTY_CART");

  if (errors.length) {
    return res.status(400).json({ ok: false, errors });
  }

  // Проверяем переменные окружения
  const required = [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "FROM_EMAIL",
    "TO_EMAIL",
  ];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    return res
      .status(500)
      .json({ ok: false, errors: ["MISSING_ENV", ...missing] });
  }

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_PORT || "465") === "465", // для 465 — true
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const cartLines =
    cart
      .map(
        (p, i) =>
          `${i + 1}. ${p.title || p.name || "Товар"} — ${p.qty || 1} шт${
            p.price ? ` × ${p.price}` : ""
          }`
      )
      .join("\n") || "(пусто)";

  const subject = `🛒 Новая заявка с витрины`;
  const text = [
    `Имя: ${name}`,
    `Телефон: ${phone}`,
    `Email: ${email || "-"}`,
    `Комментарий: ${comment || "-"}`,
    ``,
    `Состав корзины:`,
    cartLines,
    ``,
    `Итого: ${total}`,
    ``,
    `Время: ${new Date().toLocaleString("ru-RU", { timeZone: "UTC" })} UTC`,
  ].join("\n");

  // Пробуем отправить e-mail
  let emailOk = false;
  try {
    await transport.sendMail({
      from: process.env.FROM_EMAIL,
      to: process.env.TO_EMAIL,
      subject,
      text,
    });
    emailOk = true;
  } catch (e) {
    // не валим запрос, просто отметим ошибку
  }

  // Пробуем отправить в Telegram (если заданы токен и чат)
  let telegramOk = false;
  try {
    const tkn = process.env.TELEGRAM_BOT_TOKEN;
    const chat = process.env.TELEGRAM_CHAT_ID;
    if (tkn && chat) {
      const url = `https://api.telegram.org/bot${tkn}/sendMessage`;
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chat, text }),
      });
      telegramOk = true;
    }
  } catch (e) {
    // глушим
  }

  // Ответ клиенту
  return res.status(200).json({
    ok: true,
    channels: { email: emailOk, telegram: telegramOk },
    errors: emailOk || telegramOk ? [] : ["NO_RESPONSE"],
  });
}
