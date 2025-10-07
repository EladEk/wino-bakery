import React from "react";

export default function OrderQuantityControl({ value, step = 1, max = Infinity, onChange, ...props }) {
  const safeVal = Number(value || 0);
  const incDisabled = safeVal >= max;
  const decDisabled = safeVal <= 0;

  const inc = () => !incDisabled && onChange(Math.min(max, +(safeVal + step).toFixed(2)));
  const dec = () => !decDisabled && onChange(Math.max(0, +(safeVal - step).toFixed(2)));

  return (
    <div className="order-quantity-row" {...props}>
      <button className="qty-btn" onClick={inc} disabled={incDisabled}>+</button>
      <input
        type="number"
        min={0}
        step={step}
        max={max}
        value={safeVal}
        readOnly
        className="order-input"
      />
      <button className="qty-btn" onClick={dec} disabled={decDisabled}>–</button>
    </div>
  );
}
