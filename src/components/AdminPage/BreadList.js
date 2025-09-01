import React from "react";
import BreadTable from "../BreadTable";
import OrdersTable from "../OrdersTable";

export default function BreadList({
  breads,
  t,
  onEditBread,
  onToggleShow,
  editingOrder,
  startEditingOrder,
  saveOrderEdit,
  cancelOrderEdit,
  handleOrderInputChange,
  deleteOrder,
  toggleSupplied,
  togglePaid,
}) {
  return (
    <div>
      {breads.map((bread) => (
        <div key={bread.id} className="bread-section" style={{ marginBottom: 24, position: 'relative' }}>
          <BreadTable
            bread={bread}
            t={t}
            onEdit={onEditBread}
            onToggleShow={onToggleShow}
          />
          <OrdersTable
            bread={bread}
            t={t}
            editingOrder={editingOrder}
            startEditingOrder={startEditingOrder}
            saveOrderEdit={saveOrderEdit}
            cancelOrderEdit={cancelOrderEdit}
            handleOrderInputChange={handleOrderInputChange}
            deleteOrder={deleteOrder}
            toggleSupplied={toggleSupplied}
            togglePaid={togglePaid}
          />
        </div>
      ))}
    </div>
  );
}
