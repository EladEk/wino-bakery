import React from "react";
import OrderQuantityControl from "./OrderQuantityControl";

export default function CustomerBreadsTable({
  breads,
  t,
  userClaims,
  orderQuantities,
  onChangeQty,
}) {
  return (
    <div className="table-responsive">
      <table className="cream-table home-table">
        <colgroup>
          <col className="name-col" />
          <col className="desc-col" />
          <col className="avail-col" />
          <col className="price-col" />
          <col className="action-col" />
        </colgroup>
        <thead>
          <tr>
            <th>{t("bread")}</th>
            <th>{t("description")}</th>
            <th className="num-col">{t("available")}</th>
            <th className="num-col">{t("price")}</th>
            <th>{t("quantity")}</th>
          </tr>
        </thead>
        <tbody>
          {breads.map(b => {
            const savedQty = Number(userClaims[b.id]?.quantity || 0);
            const value = Number(orderQuantities[b.id] || 0);
            const step = b.isFocaccia ? 0.5 : 1;
            const max = Number(b.availablePieces) + savedQty;

            return (
              <tr key={b.id}>
                <td>{b.name}</td>
                <td>{b.description}</td>
                <td className="num-col">{b.availablePieces}</td>
                <td className="num-col">{b.price?.toFixed(2) || ""}</td>
                <td>
                  <OrderQuantityControl
                    value={value}
                    step={step}
                    max={max}
                    onChange={(next) => onChangeQty(b.id, next)}
                  />
                </td>
              </tr>
            );
          })}
          {breads.length === 0 && (
            <tr>
              <td colSpan={5} style={{ textAlign: "center", opacity: 0.8 }}>
                {t("notAvailable")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
