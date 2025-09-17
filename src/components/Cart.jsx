import { useCart } from "../store/cart";

export default function Cart({ open, setOpen }) {
  const { items, clearCart } = useCart();

  if (!open) return null;

  const totalCount = items.reduce((n, it) => n + (it.qty || 1), 0);
  const totalSum = items.reduce(
    (s, it) => s + (it.price || 0) * (it.qty || 1),
    0
  );

  return (
    // клик по фону закрывает корзину
    <div
      className="fixed inset-0 z-[100] bg-black/60"
      onClick={() => setOpen(false)}
    >
      {/* сам блок корзины — клики внутри НЕ закрывают */}
      <div
        className="absolute left-1/2 top-24 -translate-x-1/2 w-full max-w-md rounded-xl bg-slate-900 shadow-2xl p-6 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* крестик */}
        <button
          type="button"
          aria-label="Закрыть"
          className="absolute right-4 top-3 text-slate-400 hover:text-white text-xl leading-none"
          onClick={() => setOpen(false)}
        >
          ×
        </button>

        <h2 className="text-lg font-semibold mb-4">Корзина</h2>

        {items.length === 0 ? (
          <p className="text-slate-400">Пусто…</p>
        ) : (
          <>
            <ul className="space-y-2 mb-4 max-h-60 overflow-auto pr-1">
              {items.map((it, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between bg-slate-800 rounded-lg p-2"
                >
                  <div className="text-sm">
                    <div className="font-medium">{it.title || "Товар"}</div>
                    <div className="opacity-80">
                      {it.qty || 1} × {it.price || 0} руб.
                    </div>

                    {(it.color || it.scale) && (
                      <div className="mt-1 flex items-center gap-2 text-xs opacity-80">
                        {it.color && (
                          <>
                            <span
                              className="inline-block w-3 h-3 rounded-full ring-1 ring-white/20"
                              style={{ backgroundColor: it.color }}
                              title={it.color}
                            />
                            <span>{it.color}</span>
                          </>
                        )}
                        {it.color && it.scale ? <span>•</span> : null}
                        {it.scale ? (
                          <span>Масштаб: {Number(it.scale).toFixed(1)}×</span>
                        ) : null}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between text-sm mb-4">
              <div>
                Товаров: <b>{totalCount}</b>
              </div>
              <div>
                Итого: <b>{totalSum.toFixed(2)} руб.</b>
              </div>
            </div>

            <div className="flex justify-between gap-2">
              <button
                type="button"
                onClick={() => clearCart()}
                className="rounded bg-slate-700 hover:bg-slate-600 px-3 py-2 text-sm"
              >
                Очистить
              </button>

              {/* НИКАКИХ fetch здесь! Только закрыть и проскроллить к форме */}
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  const el = document.getElementById("checkout");
                  if (el)
                    el.scrollIntoView({ behavior: "smooth", block: "start" });
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
