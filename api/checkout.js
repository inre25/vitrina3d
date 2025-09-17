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

  // валидация
  const errors = [];
  if (!name.trim()) errors.push("NO_NAME");
  if (!phone.trim()) errors.push("NO_PHONE");
  if (!Array.isArray(cart) || cart.length === 0) errors.push("EMPTY_CART");
  if (errors.length) return res.status(400).json({ ok: false, errors });

  // только Telegram
  const tkn = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!tkn || !chat) {
    return res
      .status(500)
      .json({ ok: false, errors: ["MISSING_TELEGRAM_ENV"] });
  }

  // формируем текст корзины
  const cartLines =
    cart
      .map((p, i) => {
        const qty = p.qty || 1;
        const price = p.price != null ? `${p.price} руб.` : "";
        const line1 = `${i + 1}. ${p.title || p.name || "Товар"} — ${qty} шт${
          price ? ` × ${price}` : ""
        }`;

        // ИМЕНА БЕРЕМ ТОЛЬКО ИЗ ЗАКАЗА (никаких словарей на сервере)
        const opts = [];
        // новый формат A/B
        if (p.colorA || p.colorAName)
          opts.push(`цвет A: ${p.colorAName || p.colorA}`);
        if (p.colorB || p.colorBName)
          opts.push(`цвет B: ${p.colorBName || p.colorB}`);
        // старый одиночный цвет
        if (!p.colorA && !p.colorB && (p.color || p.colorName)) {
          opts.push(`цвет: ${p.colorName || p.color}`);
        }
        if (p.scale) opts.push(`масштаб: ${Number(p.scale).toFixed(1)}×`);

        const print = [];
        if (p.layerHeight) print.push(`слой: ${p.layerHeight} мм`);
        if (p.layers) print.push(`слоёв: ${p.layers}`);
        if (p.currentLayer != null) {
          const h = p.heightMM != null ? ` (${p.heightMM} мм)` : "";
          print.push(`текущий слой: ${p.currentLayer}${h}`);
        }

        const line2 = opts.length ? `   Опции: ${opts.join(", ")}` : "";
        const line3 = print.length ? `   Печать: ${print.join(", ")}` : "";
        return [line1, line2, line3].filter(Boolean).join("\n");
      })
      .join("\n") || "(пусто)";

  const text = [
    `🛒 Новая заявка`,
    `Имя: ${name}`,
    `Телефон: ${phone}`,
    `Email: ${email || "-"}`,
    `Комментарий: ${comment || "-"}`,
    ``,
    `Состав корзины:`,
    cartLines,
    ``,
    `Итого: ${total} руб.`,
    `Время: ${new Date().toISOString().replace("T", " ").slice(0, 19)} UTC`,
  ].join("\n");

  try {
    await fetch(`https://api.telegram.org/bot${tkn}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text }),
    });

    return res
      .status(200)
      .json({ ok: true, channels: { telegram: true }, errors: [] });
  } catch (e) {
    return res.status(200).json({
      ok: true,
      channels: { telegram: false },
      errors: ["TELEGRAM_SEND_FAILED", String(e?.message || e)],
    });
  }
}
