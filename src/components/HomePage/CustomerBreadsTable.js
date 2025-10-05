import React from "react";
import OrderQuantityControl from "./OrderQuantityControl";

export default function CustomerBreadsTable({
  breads,
  t,
  userClaims,
  orderQuantities,
  onChangeQty,
  userData,
  kibbutzim,
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

            const isKibbutzMember = userData?.kibbutzId;
            let displayPrice = b.price?.toFixed(2) || "";
            let originalPrice = null;
            
            if (isKibbutzMember && kibbutzim) {
              const userKibbutz = kibbutzim.find(k => k.id === userData.kibbutzId);
              if (userKibbutz) {
                let finalPrice = b.price;
                
                // Apply discount
                if (userKibbutz.discountPercentage > 0) {
                  const discount = userKibbutz.discountPercentage / 100;
                  finalPrice = finalPrice * (1 - discount);
                }
                
                // Apply surcharge
                if (userKibbutz.surchargeType && userKibbutz.surchargeType !== 'none' && userKibbutz.surchargeValue > 0) {
                  if (userKibbutz.surchargeType === 'percentage') {
                    finalPrice = finalPrice * (1 + userKibbutz.surchargeValue / 100);
                  } else if (userKibbutz.surchargeType === 'fixedPerBread') {
                    finalPrice = finalPrice + userKibbutz.surchargeValue;
                  }
                  // Note: fixedPerOrder is handled in the total calculation, not per bread
                }
                
                // Show original price crossed out only for discounts (not surcharges)
                if (userKibbutz.discountPercentage > 0) {
                  originalPrice = b.price?.toFixed(2);
                  displayPrice = finalPrice.toFixed(2);
                } else if ((userKibbutz.surchargeType === 'percentage' || userKibbutz.surchargeType === 'fixedPerBread') && userKibbutz.surchargeValue > 0) {
                  // For per-bread surcharges, just show the final price without showing the original
                  displayPrice = finalPrice.toFixed(2);
                }
              }
            }

            return (
              <tr key={b.id}>
                <td>{b.name}</td>
                <td>{b.description}</td>
                <td className="num-col">{b.availablePieces}</td>
                <td className="num-col">
                  {isKibbutzMember && originalPrice ? (
                    <div className="price-with-discount">
                      <span className="discounted-price">{displayPrice} ₪</span>
                      <span className="original-price">{originalPrice} ₪</span>
                    </div>
                  ) : (
                    `${displayPrice} ₪`
                  )}
                </td>
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
