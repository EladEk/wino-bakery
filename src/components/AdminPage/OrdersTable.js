import React, { useState, useEffect } from "react";
// import { calculateOrderTotal } from "../../utils/pricing";
import { usersService } from "../../services/users";

export default function OrdersTable({ bread, t, kibbutzim, editingOrder, startEditingOrder, saveOrderEdit, cancelOrderEdit, handleOrderInputChange, deleteOrder, toggleSupplied, togglePaid }) {
  const [users, setUsers] = useState({});
  
  
  // Load user data for all orders
  useEffect(() => {
    const loadUsers = async () => {
      if (!bread.claimedBy || bread.claimedBy.length === 0) return;
      
      const userPromises = bread.claimedBy.map(async (order) => {
        if (order.userId && !users[order.userId]) {
          try {
            const userData = await usersService.getById(order.userId);
            return { userId: order.userId, userData };
          } catch (error) {
            console.error('Error loading user data for', order.userId, error);
            return { userId: order.userId, userData: null };
          }
        }
        return null;
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
  }, [bread.claimedBy, users]);
  
  // Check each order for kibbutz information
  
  // Function to get kibbutz data for a user
  const getKibbutzForUser = (order) => {
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
  };

  // Function to calculate order total for individual bread orders (no per-order surcharges)
  const calculateOrderTotalWithKibbutz = (basePrice, order) => {
    
    // Calculate price per bread (no per-order surcharges)
    let pricePerBread = basePrice;
    
    // If order has complete pricing information, use it
    if (order.discountPercentage !== undefined || order.surchargeType !== undefined) {
      // Apply discounts and per-bread surcharges only
      if (order.discountPercentage && order.discountPercentage > 0) {
        pricePerBread = pricePerBread * (1 - order.discountPercentage / 100);
      }
      if (order.surchargeType === 'percentage' && order.surchargeValue > 0) {
        pricePerBread = pricePerBread * (1 + order.surchargeValue / 100);
      } else if (order.surchargeType === 'fixedPerBread' && order.surchargeValue > 0) {
        pricePerBread = pricePerBread + order.surchargeValue;
      }
      // Note: fixedPerOrder surcharges are not applied to individual bread orders
    } else {
      // Try to get kibbutz data for this user
      const kibbutz = getKibbutzForUser(order);
      if (kibbutz) {
        // Apply discounts and per-bread surcharges only
        if (kibbutz.discountPercentage && kibbutz.discountPercentage > 0) {
          pricePerBread = pricePerBread * (1 - kibbutz.discountPercentage / 100);
        }
        if (kibbutz.surchargeType === 'percentage' && kibbutz.surchargeValue > 0) {
          pricePerBread = pricePerBread * (1 + kibbutz.surchargeValue / 100);
        } else if (kibbutz.surchargeType === 'fixedPerBread' && kibbutz.surchargeValue > 0) {
          pricePerBread = pricePerBread + kibbutz.surchargeValue;
        }
        // Note: fixedPerOrder surcharges are not applied to individual bread orders
      }
    }
    
    const total = pricePerBread * (order.quantity || 0);
    return total;
  };

  // Calculate total income for this bread (including per-order surcharges)
  const calculateTotalIncome = () => {
    if (!bread.claimedBy || bread.claimedBy.length === 0) return 0;
    
    // Group orders by user to apply per-order surcharges correctly
    const ordersByUser = {};
    bread.claimedBy.forEach(claim => {
      if (!ordersByUser[claim.userId]) {
        ordersByUser[claim.userId] = [];
      }
      ordersByUser[claim.userId].push(claim);
    });
    
    let totalIncome = 0;
    Object.values(ordersByUser).forEach(userOrders => {
      // Calculate subtotal for this user's orders (no per-order surcharges)
      const subtotal = userOrders.reduce((sum, claim) => {
        return sum + calculateOrderTotalWithKibbutz(bread.price, claim);
      }, 0);
      
      // Add per-order surcharge if applicable
      if (userOrders.length > 0) {
        const firstOrder = userOrders[0];
        const kibbutz = getKibbutzForUser(firstOrder);
        if (kibbutz && kibbutz.surchargeType === 'fixedPerOrder' && kibbutz.surchargeValue > 0) {
          totalIncome += subtotal + kibbutz.surchargeValue;
        } else {
          totalIncome += subtotal;
        }
      }
    });
    
    return totalIncome;
  };

  const totalIncome = calculateTotalIncome();

  return (
    <div>
      <h3 className="orders-heading">{t("ordersList")}</h3>
      <div className="table-responsive">
        <table className="ordered-table">
          <thead>
            <tr>
              <th>{t("name")}</th>
              <th>{t("phone")}</th>
              <th>{t("quantity")}</th>
              <th>{t("supplied")}</th>
              <th>{t("paid")}</th>
              <th>{t("cost")}</th>
              <th>{t("orderedAt")}</th>
              <th>{t("kibbutz")}</th>
              <th>{t("Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {(bread.claimedBy || []).map((claim, i) => {
              const key = `${bread.id}_${i}`;
              const isEditing = editingOrder[key];

              const isKibbutzMember = claim.kibbutzId;
              const rowStyle = isKibbutzMember ? { backgroundColor: '#e3f2fd', color: '#1976d2' } : {};
              

              return (
                <tr key={i} style={rowStyle}>
                  <td>
                    <span style={{ paddingLeft: 6, display: "inline-block", width: 120 }}>
                      {claim.name}
                    </span>
                  </td>
                  <td>
                    <span style={{ paddingLeft: 6, display: "inline-block", width: 120 }}>
                      {claim.phone}
                    </span>
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="number"
                        value={isEditing.quantity}
                        min={1}
                        className="bread-input"
                        onChange={e =>
                          handleOrderInputChange(bread.id, i, "quantity", e.target.value)
                        }
                      />
                    ) : (
                      claim.quantity
                    )}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={!!claim.supplied}
                      onChange={() => toggleSupplied(bread.id, i)}
                    />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={!!claim.paid}
                      onChange={() => togglePaid(bread.id, i)}
                    />
                  </td>
                  <td>
                    {(() => {
                      const kibbutz = getKibbutzForUser(claim);
                      const regularTotal = bread.price * claim.quantity;
                      const discountedTotal = calculateOrderTotalWithKibbutz(bread.price, claim);
                      
                      if (kibbutz && kibbutz.discountPercentage > 0) {
                        return (
                          <span>
                            <span style={{ textDecoration: 'line-through', color: '#999', marginRight: '8px' }}>
                              ₪{regularTotal.toFixed(2)}
                            </span>
                            <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                              ₪{discountedTotal.toFixed(2)}
                            </span>
                          </span>
                        );
                      } else {
                        return `₪${discountedTotal.toFixed(2)}`;
                      }
                    })()}
                  </td>
                  <td>
                    {claim.timestamp?.seconds
                      ? new Date(claim.timestamp.seconds * 1000).toLocaleString()
                      : ""}
                  </td>
                  <td>
                    <span style={{ paddingLeft: 6, display: "inline-block", width: 120 }}>
                      {claim.kibbutzId ? (claim.kibbutzName || t("unknownKibbutz")) : t("notAssignedToKibbutz")}
                    </span>
                  </td>
                  <td>
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => saveOrderEdit(bread.id, i, claim)}
                          className="edit-bread-btn"
                        >
                          {t("Save")}
                        </button>
                        <button onClick={cancelOrderEdit} className="edit-bread-btn">
                          {t("Cancel")}
                        </button>
                        <button
                          onClick={() => deleteOrder(bread.id, i)}
                          className="edit-bread-btn"
                          style={{ color: "red" }}
                        >
                          {t("Delete")}
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEditingOrder(bread.id, i, claim)} className="edit-bread-btn">
                          {t("Edit")}
                        </button>
                        <button
                          onClick={() => deleteOrder(bread.id, i)}
                          className="edit-bread-btn"
                          style={{ color: "red" }}
                        >
                          {t("Delete")}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Total Income Display */}
      <div style={{ 
        marginTop: '16px', 
        padding: '12px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px',
        border: '1px solid #ddd'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          fontWeight: 'bold',
          fontSize: '16px'
        }}>
          <span>{t("totalIncome") || "Total Income"}:</span>
          <span style={{ 
            color: '#2e7d32', 
            fontSize: '18px' 
          }}>
            ₪{totalIncome.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
