// src/components/CheckoutForm.jsx
import { useState, useMemo } from "react";
import { useCart } from "../store/cart"; // ваш хук корзины

export default function CheckoutForm() {
  const { items, clearCart } = useCart();

  const totals = useMemo(() => {
    const count = items.reduce((n, it) => n + (it.qty || 1), 0);
    const sum = items.reduce((s, it) => s + (it.price || 0) * (it.qty || 1), 0);
    return { count, sum };
  }, [items]);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    comment: "",
  });
  const [status, setStatus] = useState({ sending: false, ok: null, msg: "" });

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      setStatus({ sending: false, ok: false, msg: "Укажите имя и телефон" });
      return;
    }
    setStatus({ sending: true, ok: null, msg: "Отправляем..." });

    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: form,
          items,
          totals,
          meta: {
            site: window?.location?.origin || "PWA",
            ts: new Date().toISOString(),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Send failed");

      setStatus({
        sending: false,
        ok: true,
        msg: "Заявка отправлена! Мы свяжемся с вами.",
      });
      clearCart();
      setForm({ name: "", phone: "", email: "", comment: "" });
    } catch (err) {
      setStatus({
        sending: false,
        ok: false,
        msg: "Не удалось отправить. Попробуйте ещё раз.",
      });
      console.error(err);
    }
  }

  return (
    <div className="max-w-xl w-full mx-auto p-4 rounded-2xl shadow border border-gray-100">
      <h3 className="text-xl font-semibold mb-3">Оформление заказа</h3>

      <div className="text-sm mb-4">
        <div>
          Товаров: <b>{totals.count}</b>
        </div>
        <div>
          Итого: <b>{totals.sum} руб.</b>
        </div>
      </div>

      <form onSubmit={submit} className="grid gap-3">
        <input
          name="name"
          placeholder="Ваше имя *"
          value={form.name}
          onChange={onChange}
          className="border rounded-xl p-3"
          required
        />
        <input
          name="phone"
          placeholder="Телефон *"
          value={form.phone}
          onChange={onChange}
          className="border rounded-xl p-3"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="E-mail (по желанию)"
          value={form.email}
          onChange={onChange}
          className="border rounded-xl p-3"
        />
        <textarea
          name="comment"
          placeholder="Комментарий к заказу"
          value={form.comment}
          onChange={onChange}
          className="border rounded-xl p-3 min-h-[96px]"
        />

        <button
          type="submit"
          disabled={status.sending}
          className="rounded-2xl p-3 font-semibold shadow bg-black text-white disabled:opacity-60"
        >
          {status.sending ? "Отправляем…" : "Отправить заявку"}
        </button>

        {status.msg && (
          <div
            className={`text-sm ${
              status.ok === false ? "text-red-600" : "text-green-600"
            }`}
          >
            {status.msg}
          </div>
        )}
      </form>
    </div>
  );
}
