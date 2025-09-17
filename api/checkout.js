// api/checkout.js
function normHex(h) {
  if (!h || typeof h !== "string") return null;
  let x = h.trim().toLowerCase();
  if (!x.startsWith("#")) x = "#" + x;
  if (x.length === 4) {
    // #abc -> #aabbcc
    x = "#" + x[1] + x[1] + x[2] + x[2] + x[3] + x[3];
  }
  return x;
}

// Базовая палитра русских названий (можешь расширять при желании)
const COLOR_MAP_RU = {
  "#ffffff": "белый",
  "#000000": "чёрный",
  "#ff5252": "красный",
  "#e91e63": "розовый",
  "#ffa726": "оранжевый",
  "#ff9800": "оранжевый",
  "#ffc107": "янтарный",
  "#ffee58": "жёлтый",
  "#66bb6a": "зелёный",
  "#4caf50": "зелёный",
  "#8bc34a": "лаймовый",
  "#cddc39": "салатовый",
  "#00bcd4": "бирюзовый",
  "#42a5f5": "синий",
  "#2196f3": "синий",
  "#ab47bc": "фиолетовый",
  "#9c27b0": "фиолетовый",
  "#795548": "коричневый",
  "#9e9e9e": "серый",
};

function colorLabel(p) {
  // приоритет: явное имя из фронта → словарь по hex → сам hex
  if (p?.colorName) return p.colorName;
  if (p?.colorLabel) return p.colorLabel;
  const hx = normHex(p?.color);
  if (!hx) return null;
  const ru = COLOR_MAP_RU[hx] || COLOR_MAP_RU[hx.toLowerCase()];
  return ru ? `${ru}` : hx;
}

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
      .map((p, i) => {
        const qty = p.qty || 1;
        const price = p.price != null ? `${p.price} руб.` : "";
        const line1 = `${i + 1}. ${p.title || p.name || "Товар"} — ${qty} шт${
          price ? ` × ${price}` : ""
        }`;

        const opts = [];
        const label = colorLabel(p);
        if (label) opts.push(`цвет: ${label}`);
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
