import React from "react";

export default function OrdersTable({ bread, t, editingOrder, startEditingOrder, saveOrderEdit, cancelOrderEdit, handleOrderInputChange, deleteOrder, toggleSupplied, togglePaid }) {
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
              <th>{t("Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {(bread.claimedBy || []).map((claim, i) => {
              const key = `${bread.id}_${i}`;
              const isEditing = editingOrder[key];

              return (
                <tr key={i}>
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
                  <td>{((claim.quantity || 0) * bread.price).toFixed(2)}</td>
                  <td>
                    {claim.timestamp?.seconds
                      ? new Date(claim.timestamp.seconds * 1000).toLocaleString()
                      : ""}
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
    </div>
  );
}
