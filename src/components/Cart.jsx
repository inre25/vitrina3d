import { useState } from "react";
import { useCart } from "../store/cart";

export default function Cart({ open, onClose }) {
  const { items, removeItem, clear, total } = useCart();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    comment: "",
  });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    setErr("");
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, total, customer: form }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Ошибка отправки");
      setDone(true);
      clear();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex">
      <div className="ml-auto h-full w-full max-w-md bg-slate-900 text-white p-5 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Корзина</h2>
          <button className="text-slate-300 hover:text-white" onClick={onClose}>
            ✕
          </button>
        </div>

        {items.length === 0 && !done && (
          <p className="opacity-80">Пока пусто.</p>
        )}
        {done && (
          <p className="text-green-400 mb-3">
            Заявка отправлена! Мы свяжемся с вами.
          </p>
        )}
        {err && <p className="text-red-400 mb-3">Ошибка: {err}</p>}

        {items.length > 0 && (
          <ul className="space-y-2 mb-4">
            {items.map((it, i) => (
              <li key={i} className="rounded-lg bg-slate-800 p-3">
                <div className="flex justify-between">
                  <div>
                    <div className="font-semibold">{it.title}</div>
                    <div className="text-sm opacity-80">
                      Высота: {it.heightMM} мм · Текущий слой: {it.currentLayer}
                      /{it.layers} · Шаг слоя: {it.layerHeight} мм
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{it.price.toFixed(2)}</div>
                    <button
                      className="text-xs opacity-80 hover:opacity-100"
                      onClick={() => removeItem(i)}
                    >
                      убрать
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-slate-700 pt-3 mb-4 flex justify-between">
          <div>Итого</div>
          <div className="font-bold">{total.toFixed(2)}</div>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            required
            placeholder="Ваше имя"
            className="w-full rounded-lg bg-slate-800 p-3"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            required
            placeholder="Телефон"
            className="w-full rounded-lg bg-slate-800 p-3"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <input
            placeholder="Email"
            className="w-full rounded-lg bg-slate-800 p-3"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <textarea
            placeholder="Комментарий"
            className="w-full rounded-lg bg-slate-800 p-3"
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
          />
          <button
            disabled={sending || items.length === 0}
            className="w-full rounded-lg bg-indigo-500 hover:bg-indigo-600 p-3 font-semibold disabled:opacity-50"
          >
            {sending ? "Отправляем..." : "Отправить заявку"}
          </button>
        </form>
      </div>
    </div>
  );
}
