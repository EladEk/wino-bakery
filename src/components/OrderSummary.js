import React, { useMemo } from "react";
import OrderQuantityControl from "./OrderQuantityControl";

export default function OrderSummary({
  show,
  breads,
  t,
  dir = "ltr",
  orderQuantities,
  userClaims,
  editable = false,
  onChangeQty,
}) {
  const lines = useMemo(() => {
    return breads
      .map(b => {
        const qty = Number(orderQuantities[b.id] || 0); // live quantity
        if (qty <= 0) return null;
        const price = Number(b.price || 0);
        const prevClaimQty = Number(userClaims[b.id]?.quantity || 0);
        return {
          id: b.id,
          name: b.name,
          step: b.isFocaccia ? 0.5 : 1,
          max: Number(b.availablePieces) + prevClaimQty,
          quantity: qty,
          price,
          subtotal: price * qty,
        };
      })
      .filter(Boolean);
  }, [breads, orderQuantities, userClaims]);

  if (!show || lines.length === 0) return null;

  const total = lines.reduce((s, l) => s + l.subtotal, 0);

  // detect unsaved changes
  const hasUnsaved = breads.some(b => {
    const saved = Number(userClaims[b.id]?.quantity || 0);
    const input = Number(orderQuantities[b.id] || 0);
    return saved !== input;
  });

  return (
    <div className={`order-summary ${dir === "rtl" ? "rtl" : ""}`}>
      <div className="order-summary-header">
        <h3 className="order-summary-title">{t("yourOrder") || "Your Order"}</h3>
        {hasUnsaved && (
          <span className="order-summary-unsaved">
            {t("unsavedChanges") || "You have unsaved changes — click Update to save"}
          </span>
        )}
      </div>

      <div className="table-responsive">
        <table className="cream-table order-summary-table">
          <colgroup>
            <col className="name-col" />
            <col className="qty-col" />
            <col className="price-col" />
            <col className="subtotal-col" />
          </colgroup>
          <thead>
            <tr>
              <th>{t("bread")}</th>
              <th className="num-col">{t("quantity")}</th>
              <th className="num-col">{t("price")}</th>
              <th className="num-col">{t("subtotal") || "Subtotal"}</th>
            </tr>
          </thead>
          <tbody>
            {lines.map(l => (
              <tr key={l.id}>
                <td>{l.name}</td>
                <td className="num-col">
                  {editable ? (
                    <OrderQuantityControl
                      value={l.quantity}
                      step={l.step}
                      max={l.max}
                      onChange={(next) => onChangeQty && onChangeQty(l.id, next)}
                    />
                  ) : (
                    l.quantity
                  )}
                </td>
                <td className="num-col">{l.price.toFixed(2)}</td>
                <td className="num-col">{l.subtotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="num-col total-label">{t("total") || "Total"}</td>
              <td className="num-col total-value">{total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
