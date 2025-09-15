import { X } from "lucide-react";
import { useCart } from "../store/cart";

export default function Cart({ open, setOpen }) {
  const { items, removeItem, clearCart } = useCart();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60">
      <div className="mt-20 w-full max-w-md rounded-xl bg-slate-900 shadow-2xl p-6 relative">
        {/* кнопка закрытия */}
        <button
          onClick={() => setOpen(false)}
          className="absolute right-4 top-4 text-slate-400 hover:text-white"
        >
          <X size={20} />
        </button>

        <h2 className="text-lg font-semibold mb-4">Корзина</h2>

        {items.length === 0 ? (
          <p className="text-slate-400">Пусто…</p>
        ) : (
          <>
            <ul className="space-y-2 mb-4">
              {items.map((it, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between bg-slate-800 rounded-lg p-2"
                >
                  <span>
                    {it.title} — {it.price} р
                  </span>
                  <button
                    onClick={() => removeItem(i)}
                    className="text-red-400 hover:text-red-600"
                  >
                    Удалить
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex justify-between mb-4">
              <button
                onClick={clearCart}
                className="rounded bg-slate-700 hover:bg-slate-600 px-3 py-2 text-sm"
              >
                Очистить
              </button>
              <button
                onClick={() => {
                  setOpen(false); // закрываем корзину
                  const el = document.getElementById("checkout");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="rounded bg-emerald-500 hover:bg-emerald-600 px-3 py-2 text-sm font-semibold"
              >
                Оформить
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
