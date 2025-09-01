import React from "react";
import { useTranslation } from "react-i18next";
import ThanksImg from "../img/Thanks.png";
import "./PopupWidget.css";

export default function PopupWidget({ type = "success", message = "" }) {
  const { t } = useTranslation();

  let content;
  if (type === "success") {
    content = (
      <div className="popup-thanks-content">
        <div className="popup-thanks-headline">{t("thanksHeadline")}</div>
        <img src={ThanksImg} alt={t("thanksHeadline")} className="popup-thanks-image" />
      </div>
    );
  } else if (type === "update") {
    content = (
      <div className="popup-update-content">
        <div className="popup-update-headline">{t("orderUpdated", "Order updated!")}</div>
      </div>
    );
  } else if (type === "cancel") {
    content = (
      <div className="popup-cancel-content">
        <div className="popup-cancel-headline">{t("orderCanceled", "Order canceled.")}</div>
      </div>
    );
  } else {
    content = <div>{message}</div>;
  }

  return (
    <div className="popup-backdrop" tabIndex={-1} aria-modal="true" role="dialog">
      <div className={`popup-widget popup-${type}`}>
        {content}
      </div>
    </div>
  );
}
