import React from "react";
import "./styles.css";

export default function AdminDeliverySettings({
  t,
  saleDate, setSaleDate,
  startHour, setStartHour,
  endHour, setEndHour,
  address, setAddress,
  bitNumber, setBitNumber,
  onSave,
}) {
  return (
    <section className="delivery-settings">
      <h3>{t("deliverySettings") || "Delivery Settings"}</h3>
      <label>
        {t("saleDate")}:&nbsp;
        <input type="date" value={saleDate} onChange={(e)=>setSaleDate(e.target.value)} />
      </label>
      <label>
        {t("startHour") || "Start Hour"}:&nbsp;
        <input type="time" value={startHour} onChange={(e)=>setStartHour(e.target.value)} />
      </label>
      <label>
        {t("endHour") || "End Hour"}:&nbsp;
        <input type="time" value={endHour} onChange={(e)=>setEndHour(e.target.value)} />
      </label>
      <label>
        {t("pickupAddress")}:&nbsp;
        <input type="text" value={address} onChange={(e)=>setAddress(e.target.value)} />
      </label>
      <label>
        {t("transferNumberLabel")}:&nbsp;
        <input type="text" value={bitNumber} onChange={(e)=>setBitNumber(e.target.value)} />
      </label>
      <div>
        <button className="save-btn" onClick={onSave}>{t("save") || "Save"}</button>
      </div>
    </section>
  );
}
