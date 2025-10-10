import React, { useMemo, useState, useEffect, useCallback } from "react";
import { calculateDisplayPrice } from "../../utils/pricing";
import { usersService } from "../../services/users";

export default function AdminCustomerSearch({ t, breads, kibbutzim, dir = "rtl", toggleSupplied, togglePaid }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState({});

  const normalized = (s) => (s || "").toString().trim().toLowerCase();
  const search = normalized(searchTerm);
  
  // Load user data for all orders
  useEffect(() => {
    const loadUsers = async () => {
      const allOrders = [];
      breads.forEach(bread => {
        if (bread.claimedBy) {
          bread.claimedBy.forEach(order => {
            if (order.userId && !users[order.userId]) {
              allOrders.push(order);
            }
          });
        }
      });
      
      if (allOrders.length === 0) return;
      
      const userPromises = allOrders.map(async (order) => {
        try {
          const userData = await usersService.getById(order.userId);
          return { userId: order.userId, userData };
        } catch (error) {
          console.error('Error loading user data for', order.userId, error);
          return { userId: order.userId, userData: null };
        }
      });
      
      const userResults = await Promise.all(userPromises);
      const newUsers = {};
      userResults.forEach(result => {
        if (result) {
          newUsers[result.userId] = result.userData;
        }
      });
      
      if (Object.keys(newUsers).length > 0) {
        setUsers(prev => ({ ...prev, ...newUsers }));
      }
    };
    
    loadUsers();
  }, [breads, users]);

  // Function to get kibbutz data for a user
  const getKibbutzForUser = useCallback((order) => {
    // First check if order already has kibbutz info
    if (order.kibbutzId && kibbutzim && kibbutzim.length > 0) {
      const kibbutz = kibbutzim.find(k => k.id === order.kibbutzId);
      if (kibbutz) {
        return kibbutz;
      }
    }
    
    // If not, look up user data and get kibbutz from there
    if (order.userId && users[order.userId]) {
      const userData = users[order.userId];
      if (userData && userData.kibbutzId && kibbutzim && kibbutzim.length > 0) {
        const kibbutz = kibbutzim.find(k => k.id === userData.kibbutzId);
        if (kibbutz) {
          return kibbutz;
        }
      }
    }
    
    return null;
  }, [kibbutzim, users]);

  const customerResults = useMemo(() => {
    if (!search) return [];
    const rows = [];
    breads.forEach((b) => {
      (b.claimedBy || []).forEach((c, idx) => {
        const hay = `${c.name || ""} ${c.phone || ""} ${c.userId || ""}`.toLowerCase();
        if (hay.includes(search)) {
          // Calculate display price (per-bread only, no per-order surcharges), handling both old and new order formats
          let finalPrice = Number(b.price || 0);
          let originalPrice = Number(b.price || 0);
          let hasDiscount = false;
          
          // If order has complete pricing information, use it
          if (c.discountPercentage !== undefined || c.surchargeType !== undefined) {
            const pricing = calculateDisplayPrice(finalPrice, c);
            finalPrice = pricing.displayPrice;
            originalPrice = pricing.originalPrice;
            hasDiscount = pricing.hasDiscount;
          }
          // If order has kibbutzId but no pricing info, look up kibbutz data
          else if (c.kibbutzId && kibbutzim && kibbutzim.length > 0) {
            const kibbutz = kibbutzim.find(k => k.id === c.kibbutzId);
            if (kibbutz) {
              const orderWithPricing = {
                ...c,
                discountPercentage: kibbutz.discountPercentage || 0,
                surchargeType: kibbutz.surchargeType || 'none',
                surchargeValue: kibbutz.surchargeValue || 0
              };
              const pricing = calculateDisplayPrice(finalPrice, orderWithPricing);
              finalPrice = pricing.displayPrice;
              originalPrice = pricing.originalPrice;
              hasDiscount = pricing.hasDiscount;
            }
          }
          // For old orders without kibbutzId, try to get kibbutz from user data
          else {
            const kibbutz = getKibbutzForUser(c);
            if (kibbutz) {
              const orderWithPricing = {
                ...c,
                discountPercentage: kibbutz.discountPercentage || 0,
                surchargeType: kibbutz.surchargeType || 'none',
                surchargeValue: kibbutz.surchargeValue || 0
              };
              const pricing = calculateDisplayPrice(finalPrice, orderWithPricing);
              finalPrice = pricing.displayPrice;
              originalPrice = pricing.originalPrice;
              hasDiscount = pricing.hasDiscount;
            }
          }
          
          // Get kibbutz info to determine if we should show discount
          // const kibbutz = getKibbutzForUser(c);
          
          rows.push({
            userId: c.userId || "",
            name: c.name || "",
            phone: c.phone || "",
            breadId: b.id,
            breadName: b.name,
            idx,
            quantity: Number(c.quantity || 0),
            price: finalPrice,
            originalPrice: originalPrice,
            hasDiscount: hasDiscount,
            supplied: !!c.supplied,
            paid: !!c.paid,
            timestamp: c.timestamp || null,
          });
        }
      });
    });
    rows.sort((a, b) => {
      const an = a.name.toLowerCase();
      const bn = b.name.toLowerCase();
      if (an !== bn) return an.localeCompare(bn);
      return a.breadName.toLowerCase().localeCompare(b.breadName.toLowerCase());
    });
    return rows;
  }, [search, breads, kibbutzim, getKibbutzForUser]);

  return (
    <>
      <div className={`customer-search ${dir === "rtl" ? "rtl" : ""}`}>
        <input
          type="text"
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t("searchCustomerPlaceholder")}
        />
        {searchTerm && (
          <button className="clear-btn" onClick={() => setSearchTerm("")}>
            {t("clear")}
          </button>
        )}
      </div>

      {searchTerm && (
        <div className="customer-results">
          <h4 className="results-title">
            {t("customerOrders")}
            {customerResults.length > 0 ? ` · ${customerResults.length}` : ""}
          </h4>

          <div className="table-responsive">
            <table className="ordered-table customer-table">
              <thead>
                <tr>
                  <th>{t("customer")}</th>
                  <th>{t("phone")}</th>
                  <th>{t("bread")}</th>
                  <th className="num-col">{t("quantity")}</th>
                  <th className="num-col">{t("price")}</th>
                  <th className="num-col">{t("subtotal")}</th>
                  <th>{t("supplied")}</th>
                  <th>{t("paid")}</th>
                </tr>
              </thead>
              <tbody>
                {customerResults.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", opacity: 0.7 }}>
                      {t("noResults")}
                    </td>
                  </tr>
                ) : (
                  customerResults.map((r) => (
                    <tr key={`${r.userId}_${r.breadId}_${r.idx}`}>
                      <td>{r.name || "-"}</td>
                      <td>{r.phone || "-"}</td>
                      <td>{r.breadName}</td>
                      <td className="num-col">{r.quantity}</td>
                      <td className="num-col">
                        {r.hasDiscount ? (
                          <span>
                            <span style={{ textDecoration: 'line-through', color: '#999', marginRight: '8px' }}>
                              ₪{r.originalPrice.toFixed(2)}
                            </span>
                            <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                              ₪{r.price.toFixed(2)}
                            </span>
                          </span>
                        ) : (
                          `₪${r.price.toFixed(2)}`
                        )}
                      </td>
                      <td className="num-col">
                        {r.hasDiscount ? (
                          <span>
                            <span style={{ textDecoration: 'line-through', color: '#999', marginRight: '8px' }}>
                              ₪{(r.originalPrice * r.quantity).toFixed(2)}
                            </span>
                            <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                              ₪{(r.price * r.quantity).toFixed(2)}
                            </span>
                          </span>
                        ) : (
                          `₪${(r.price * r.quantity).toFixed(2)}`
                        )}
                      </td>
                      <td className="check-cell">
                        <input
                          type="checkbox"
                          checked={r.supplied}
                          onChange={() => toggleSupplied(r.breadId, r.idx)}
                        />
                      </td>
                      <td className="check-cell">
                        <input
                          type="checkbox"
                          checked={r.paid}
                          onChange={() => togglePaid(r.breadId, r.idx)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
