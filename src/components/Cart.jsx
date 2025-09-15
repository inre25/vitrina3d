import { useState } from "react";
import { useCart } from "../store/cart";

export default function Cart({ open, onClose }) {
  const { items, total, removeItem, clear } = useCart();
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function handleCheckout() {
    if (!items.length || busy) return;
    try {
      setBusy(true);

      const res = await fetch("/api/send-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          total,
          meta: {
            url: typeof window !== "undefined" ? window.location.href : "",
            time: new Date().toISOString(),
          },
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      alert("Заказ отправлен в Telegram ✅");
      clear();
      onClose?.();
    } catch (e) {
      console.error("checkout error:", e);
      alert("Не удалось оформить заказ: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-slate-900 text-white rounded-2xl p-4 w-[520px] max-w-[95vw] shadow-xl">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Корзина</h2>
          <button
            onClick={onClose}
            className="px-2 py-1 rounded bg-white/10 hover:bg-white/20"
          >
            ✕
          </button>
        </div>

        <ul className="space-y-2 max-h-[40vh] overflow-auto pr-2">
          {items.length === 0 && <li className="opacity-70">Пусто</li>}
          {items.map((it) => (
            <li key={it.id} className="flex justify-between items-center gap-3">
              <div className="min-w-0">
                <div className="truncate">{it.title ?? it.id}</div>
                <div className="text-xs opacity-70">
                  {it.qty} × {Number(it.price ?? 0)} ₽
                </div>
              </div>
              <button
                onClick={() => removeItem(it.id)}
                className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20"
              >
                –
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex justify-between items-center">
          <div className="font-medium">
            Итого: {Number(total || 0).toFixed(2)} ₽
          </div>
          <div className="flex gap-2">
            <button
              onClick={clear}
              disabled={!items.length || busy}
              className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50"
            >
              Очистить
            </button>
            <button
              onClick={handleCheckout}
              disabled={!items.length || busy}
              className="px-3 py-1 rounded bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50"
            >
              {busy ? "Отправка..." : "Оформить"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
