// api/checkout.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, errors: ["METHOD_NOT_ALLOWED"] });
  }

  const {
    name = "",
    phone = "",
    email = "",
    comment = "",
    cart = [],
    total = 0,
  } = req.body || {};

  const errors = [];
  if (!name.trim()) errors.push("NO_NAME");
  if (!phone.trim()) errors.push("NO_PHONE");
  if (!Array.isArray(cart) || cart.length === 0) errors.push("EMPTY_CART");
  if (errors.length) return res.status(400).json({ ok: false, errors });

  const tkn = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!tkn || !chat) {
    return res
      .status(500)
      .json({ ok: false, errors: ["MISSING_TELEGRAM_ENV"] });
  }

  const cartLines =
    cart
      .map(
        (p, i) =>
          `${i + 1}. ${p.title || p.name || "Товар"} — ${p.qty || 1} шт${
            p.price ? ` × ${p.price}` : ""
          }`
      )
      .join("\n") || "(пусто)";

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
    `Время: ${new Date().toISOString().replace("T", " ").slice(0, 19)} UTC`,
  ].join("\n");

  try {
    await fetch(`https://api.telegram.org/bot${tkn}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text }),
    });

    return res.status(200).json({
      ok: true,
      channels: { telegram: true },
      errors: [],
    });
  } catch (e) {
    return res.status(200).json({
      ok: true,
      channels: { telegram: false },
      errors: ["TELEGRAM_SEND_FAILED", String(e?.message || e)],
    });
  }
}
