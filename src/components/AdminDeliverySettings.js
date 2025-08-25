import React from "react";

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
    <div className="delivery-settings">
      <div className="delivery-fields">
        <label>
          {t("saleDate")}:{" "}
          <input
            type="date"
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
            className="date-input"
          />
        </label>
        <br />
        <label>
          {t("between")}:{" "}
          <select
            value={startHour}
            onChange={(e) => setStartHour(e.target.value)}
            className="hour-select"
          >
            <option value="">{t("startHour")}</option>
            {HOUR_OPTIONS.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
          {" - "}
          <select
            value={endHour}
            onChange={(e) => setEndHour(e.target.value)}
            className="hour-select"
          >
            <option value="">{t("endHour")}</option>
            {HOUR_OPTIONS.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="address-field">
        <label>
          {t("address")}:{" "}
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="address-input"
            placeholder={t("pickupAddressInput")}
          />
        </label>
      </div>

      <div className="bit-field">
        <label>
          {t("phone")}:{" "}
          <input
            type="text"
            value={bitNumber}
            onChange={(e) => setBitNumber(e.target.value)}
            className="address-input"
            placeholder={t("bitNumberPlaceholder")}
          />
        </label>
      </div>

      <button
        onClick={onSave}
        disabled={!saleDate || !startHour || !endHour}
        className="save-btn"
      >
        {t("Save")}
      </button>
    </div>
  );
}
