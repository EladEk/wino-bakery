import React from "react";
import OrderQuantityControl from "./OrderQuantityControl";
import { breadsService } from "../../services/breads";

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
      <table className="cream-table home-table" data-testid="bread-table">
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
          {breads
            .map(b => {
              const savedQty = Number(userClaims[b.id]?.quantity || 0);
              const value = Number(orderQuantities[b.id] || 0);
              const step = b.isFocaccia ? 0.5 : 1;
              
              let availableQuantity;
              let isClubMember = false;
              
              if (userData?.kibbutzId) {
                const userKibbutz = kibbutzim?.find(k => k.id === userData.kibbutzId);
                isClubMember = userKibbutz?.isClub || false;
                
                if (!isClubMember) {
                  availableQuantity = breadsService.getAvailableQuantityForKibbutz(b, userData.kibbutzId);
                } else {
                  availableQuantity = breadsService.getAvailableQuantityForGeneral(b, kibbutzim);
                }
              } else {
                availableQuantity = breadsService.getAvailableQuantityForGeneral(b, kibbutzim);
              }
              
              
              
              
              
              
              
              // If bread is out of stock, user can only reduce their order (max = savedQty)
              // If bread is available, user can order up to availableQuantity + their current order
              const max = availableQuantity > 0 ? availableQuantity + savedQty : savedQty;
              
              return { ...b, availableQuantity, savedQty, value, step, max, isClubMember };
            })
            .filter(b => {
              // Show bread if it has available quantity OR if user has ordered some
              const userHasOrdered = Number(orderQuantities[b.id] || 0) > 0;
              return b.availableQuantity > 0 || userHasOrdered;
            })
            .map(b => {
              const { availableQuantity, value, step, max } = b;
              
              // Get isClubMember from the original bread object
              const isClubMember = b.isClubMember;

            const isKibbutzMember = userData?.kibbutzId;
            let displayPrice = b.price?.toFixed(2) || "";
            let originalPrice = null;
            
            if (isKibbutzMember && kibbutzim) {
              const userKibbutz = kibbutzim.find(k => k.id === userData.kibbutzId);
              if (userKibbutz) {
                let finalPrice = b.price;
                
                if (userKibbutz.discountPercentage > 0) {
                  const discount = userKibbutz.discountPercentage / 100;
                  finalPrice = finalPrice * (1 - discount);
                }
                
                if (userKibbutz.surchargeType && userKibbutz.surchargeType !== 'none' && userKibbutz.surchargeValue > 0) {
                  if (userKibbutz.surchargeType === 'percentage') {
                    finalPrice = finalPrice * (1 + userKibbutz.surchargeValue / 100);
                  } else if (userKibbutz.surchargeType === 'fixedPerBread') {
                    finalPrice = finalPrice + userKibbutz.surchargeValue;
                  }
                }
                
                if (userKibbutz.discountPercentage > 0) {
                  originalPrice = b.price?.toFixed(2);
                  displayPrice = finalPrice.toFixed(2);
                } else if ((userKibbutz.surchargeType === 'percentage' || userKibbutz.surchargeType === 'fixedPerBread') && userKibbutz.surchargeValue > 0) {
                  displayPrice = finalPrice.toFixed(2);
                }
              }
            }

            return (
              <tr key={b.id}>
                <td>{b.name}</td>
                <td>{b.description}</td>
                 <td className="num-col">
                   {availableQuantity > 0 ? (
                     <>
                       {availableQuantity}
                       {userData?.kibbutzId && !isClubMember && b.kibbutzQuantities?.[userData.kibbutzId] && (
                         <div className="kibbutz-allocation-info">
                           <small>({t("kibbutzAllocated")}: {b.kibbutzQuantities[userData.kibbutzId]})</small>
                         </div>
                       )}
                     </>
                   ) : (
                     <span style={{ color: '#999', fontStyle: 'italic' }}>
                       {t("outOfStock") || "Out of stock"}
                     </span>
                   )}
                 </td>
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
                    data-testid={`quantity-control-${b.id}`}
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
