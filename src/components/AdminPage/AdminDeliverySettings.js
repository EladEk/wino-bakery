import React from "react";
import "./AdminDeliverySettings.css";

const HOUR_OPTIONS = Array.from({ length: 15 }, (_, i) =>
  String(i + 7).padStart(2, "0") + ":00"
);

export default function AdminDeliverySettings({
  t,
  saleDate,
  setSaleDate,
  startHour,
  setStartHour,
  endHour,
  setEndHour,
  address,
  setAddress,
  bitNumber,
  setBitNumber,
  onSave,
}) {
  return (
    <div className="admin-delivery-settings">
      <h3>{t("Delivery Settings")}</h3>
      
      <div className="form-group">
        <label>
          {t("saleDate")}
          <input
            type="date"
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
          />
        </label>
      </div>

      <div className="form-group">
        <label>
          {t("between")}
          <div className="time-inputs">
            <select
              value={startHour}
              onChange={(e) => setStartHour(e.target.value)}
            >
              <option value="">{t("startHour")}</option>
              {HOUR_OPTIONS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <span className="time-separator">-</span>
            <select
              value={endHour}
              onChange={(e) => setEndHour(e.target.value)}
            >
              <option value="">{t("endHour")}</option>
              {HOUR_OPTIONS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
        </label>
      </div>

      <div className="form-group">
        <label>
          {t("address")}
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t("pickupAddressInput")}
          />
        </label>
      </div>

      <div className="form-group">
        <label>
          {t("phone")}
          <input
            type="text"
            value={bitNumber}
            onChange={(e) => setBitNumber(e.target.value)}
            placeholder={t("bitNumberPlaceholder")}
          />
        </label>
      </div>

      <button
        onClick={onSave}
        disabled={!saleDate || !startHour || !endHour}
        className="save-btn"
        data-testid="save-btn"
      >
        {t("Save")}
      </button>
    </div>
  );
}
