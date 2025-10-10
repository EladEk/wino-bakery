import React, { useMemo, useState } from "react";
import { calculateOrderTotal } from "../../utils/pricing";

export default function CustomerOrderTotals({ breads, kibbutzim, t }) {
  const [searchTerm, setSearchTerm] = useState("");
  // Calculate customer order totals (including per-order surcharges)
  const customerOrderTotals = useMemo(() => {
    const customerTotals = {};
    
    breads.forEach(bread => {
      if (bread.claimedBy) {
        bread.claimedBy.forEach(order => {
          const customerKey = `${order.userId}_${order.name}`;
          
          if (!customerTotals[customerKey]) {
            customerTotals[customerKey] = {
              userId: order.userId,
              name: order.name,
              phone: order.phone,
              kibbutzId: order.kibbutzId,
              kibbutzName: order.kibbutzName,
              orders: [],
              subtotal: 0,
              perOrderSurcharge: 0,
              total: 0
            };
          }
          
          // Calculate order total for this bread (including per-order surcharge)
          const orderTotal = calculateOrderTotal(bread.price, order);
          customerTotals[customerKey].orders.push({
            breadName: bread.name,
            quantity: order.quantity,
            price: bread.price,
            orderTotal: orderTotal
          });
          customerTotals[customerKey].subtotal += orderTotal;
        });
      }
    });
    
    // Calculate per-order surcharges for each customer
    Object.values(customerTotals).forEach(customer => {
      if (customer.kibbutzId && kibbutzim) {
        const kibbutz = kibbutzim.find(k => k.id === customer.kibbutzId);
        if (kibbutz && kibbutz.surchargeType === 'fixedPerOrder' && kibbutz.surchargeValue > 0) {
          customer.perOrderSurcharge = kibbutz.surchargeValue;
        }
      }
      customer.total = customer.subtotal + customer.perOrderSurcharge;
    });
    
    return Object.values(customerTotals).sort((a, b) => b.total - a.total);
  }, [breads, kibbutzim]);
  
  // Filter customers based on search term
  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) {
      return customerOrderTotals;
    }
    
    const search = searchTerm.toLowerCase();
    return customerOrderTotals.filter(customer => 
      customer.name.toLowerCase().includes(search) ||
      customer.phone.toLowerCase().includes(search) ||
      (customer.kibbutzName && customer.kibbutzName.toLowerCase().includes(search))
    );
  }, [customerOrderTotals, searchTerm]);
  
  const grandTotal = filteredCustomers.reduce((sum, customer) => sum + customer.total, 0);
  
  if (customerOrderTotals.length === 0) {
    return null;
  }
  
  return (
    <div className="customer-order-totals">
      <h3 className="section-title">{t("customerOrderTotals") || "Customer Order Totals"}</h3>
      
      {/* Search Input */}
      <div className="search-container">
        <input
          type="text"
          placeholder={t("searchByCustomerName") || "Search by customer name, phone, or kibbutz..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="clear-search-btn"
            title={t("clearSearch") || "Clear search"}
          >
            ×
          </button>
        )}
      </div>
      
      <div className="table-responsive">
        <table className="customer-totals-table">
          <thead>
            <tr>
              <th>{t("customer")}</th>
              <th>{t("phone")}</th>
              <th>{t("kibbutz")}</th>
              <th className="num-col">{t("subtotal")}</th>
              <th className="num-col">{t("perOrderSurcharge") || "Per-Order Surcharge"}</th>
              <th className="num-col">{t("total")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((customer, index) => (
              <tr key={`${customer.userId}_${index}`}>
                <td>{customer.name}</td>
                <td>{customer.phone}</td>
                <td>{customer.kibbutzName || "-"}</td>
                <td className="num-col">₪{customer.subtotal.toFixed(2)}</td>
                <td className="num-col">
                  {customer.perOrderSurcharge > 0 ? `₪${customer.perOrderSurcharge.toFixed(2)}` : "-"}
                </td>
                <td className="num-col total-col">₪{customer.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="grand-total-row">
              <td colSpan="3" className="grand-total-label">
                <strong>{t("grandTotal") || "Grand Total"}</strong>
              </td>
              <td className="num-col">
                <strong>₪{filteredCustomers.reduce((sum, c) => sum + c.subtotal, 0).toFixed(2)}</strong>
              </td>
              <td className="num-col">
                <strong>₪{filteredCustomers.reduce((sum, c) => sum + c.perOrderSurcharge, 0).toFixed(2)}</strong>
              </td>
              <td className="num-col total-col">
                <strong>₪{grandTotal.toFixed(2)}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
