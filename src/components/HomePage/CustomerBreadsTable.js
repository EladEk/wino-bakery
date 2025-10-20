import React from "react";
import OrderQuantityControl from "./OrderQuantityControl";
import { calculateDisplayPrice } from "../../utils/pricing";
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
          <col className="total-col" />
        </colgroup>
        <thead>
          <tr>
            <th>{t("bread")}</th>
            <th>{t("description")}</th>
            <th className="num-col">{t("available")}</th>
            <th className="num-col">{t("price")}</th>
            <th>{t("quantity")}</th>
            <th className="num-col">{t("total") || "Total"}</th>
          </tr>
        </thead>
        <tbody>
          {breads
            .map(b => {
              const savedQty = Number(userClaims[b.id]?.quantity || 0);
              const value = Number(orderQuantities[b.id] || 0);
              const step = b.isFocaccia ? 0.5 : 1;
              
              let baseAvailableQuantity;
              let isClubMember = false;
              
              if (userData?.kibbutzId) {
                const userKibbutz = kibbutzim?.find(k => k.id === userData.kibbutzId);
                isClubMember = userKibbutz?.isClub || false;
                
                if (isClubMember) {
                  // Clubs use general inventory system
                  baseAvailableQuantity = breadsService.getAvailableQuantityForGeneral(b, kibbutzim);
                } else {
                  // Regular kibbutzim use allocated quantity system
                  baseAvailableQuantity = breadsService.getAvailableQuantityForKibbutz(b, userData.kibbutzId, kibbutzim);
                }
              } else {
                baseAvailableQuantity = breadsService.getAvailableQuantityForGeneral(b, kibbutzim);
              }
              
              // Calculate available quantity accounting for local state changes
              // Since we now update the breads state immediately, the baseAvailableQuantity
              // should already reflect the current state. We just need to account for
              // the difference between saved and current quantities.
              
              // Calculate temporary available quantity: base + (savedQty - current order)
              // This means if user reduces their order, that quantity temporarily becomes available
              const tempAvailableQuantity = baseAvailableQuantity + (savedQty - value);
              
              
              
              
              
              
              
              // If bread is out of stock, user can only reduce their order (max = savedQty)
              // If bread is available, user can order up to tempAvailableQuantity + their current order
              const max = tempAvailableQuantity > 0 ? tempAvailableQuantity + value : savedQty;
              
              return { ...b, availableQuantity: tempAvailableQuantity, savedQty, value, step, max, isClubMember };
            })
            .filter(b => {
              // Show bread if it has available quantity OR if user has ordered some
              const userHasOrdered = Number(orderQuantities[b.id] || 0) > 0;
              return b.availableQuantity > 0 || userHasOrdered;
            })
            .map(b => {
              const { availableQuantity, value, step, max, savedQty } = b;
              
              // Get isClubMember from the original bread object
              const isClubMember = b.isClubMember;

            // Check if customer is part of a kibbutz
            const isKibbutzMember = userData?.kibbutzId;
            let displayPrice = b.price?.toFixed(2) || "";
            let originalPrice = null;
            
            if (isKibbutzMember && kibbutzim) {
              const userKibbutz = kibbutzim.find(k => k.id === userData.kibbutzId);
              if (userKibbutz) {
                // Create order object with kibbutz pricing information
                const orderWithPricing = {
                  kibbutzId: userData.kibbutzId,
                  kibbutzName: userData.kibbutzName,
                  discountPercentage: userKibbutz.discountPercentage || 0,
                  surchargeType: userKibbutz.surchargeType || 'none',
                  surchargeValue: userKibbutz.surchargeValue || 0
                };
                
                // Calculate display price using the new pricing utility
                const pricing = calculateDisplayPrice(b.price, orderWithPricing);
                displayPrice = pricing.displayPrice.toFixed(2);
                originalPrice = pricing.hasDiscount ? pricing.originalPrice.toFixed(2) : null;
              }
            }

            return (
              <tr key={b.id}>
                <td className="bread-name-cell">{b.name}</td>
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
                <td className="num-col">
                  {(() => {
                    // For ordered breads, use saved quantity from userClaims; for available breads, use current input
                    const quantityToUse = savedQty > 0 ? savedQty : value;
                    
                    // Calculate total price for this bread (quantity × price per bread, no per-order surcharges)
                    if (isKibbutzMember && kibbutzim) {
                      const userKibbutz = kibbutzim.find(k => k.id === userData.kibbutzId);
                      if (userKibbutz) {
                        const orderWithPricing = {
                          kibbutzId: userData.kibbutzId,
                          kibbutzName: userData.kibbutzName,
                          discountPercentage: userKibbutz.discountPercentage || 0,
                          surchargeType: userKibbutz.surchargeType || 'none',
                          surchargeValue: userKibbutz.surchargeValue || 0
                        };
                        
                        // Use calculateDisplayPrice to get price per bread (no per-order surcharges)
                        const pricing = calculateDisplayPrice(b.price, orderWithPricing);
                        return (pricing.displayPrice * quantityToUse).toFixed(2);
                      }
                    }
                    // For non-kibbutz members, use simple multiplication since displayPrice already includes per-bread pricing
                    return (Number(displayPrice) * quantityToUse).toFixed(2);
                  })()} ₪
                </td>
              </tr>
            );
          })}
          {breads.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: "center", opacity: 0.8 }}>
                {t("notAvailable")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
