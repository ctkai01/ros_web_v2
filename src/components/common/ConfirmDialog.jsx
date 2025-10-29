// components/ConfirmDialog.js
import React from "react";
import "./ConfirmDialog.css"; // style tuỳ chỉnh

const ConfirmDialog = ({ visible, title, message, onCancel, onConfirm, confirmButtonText = "OK", isDelete = false }) => {
  if (!visible) return null;

  return (
    <div className="overlay">
      <div className="dialog">
        <div className="dialog-header">
          <h3>{title}</h3>
        </div>
        <div className="dialog-content">
          <p>{message}</p>
        </div>
        <div className="actions">
          <button onClick={onCancel} className="cancel">Cancel</button>
          <button onClick={onConfirm} className={isDelete ? "confirm delete" : "confirm"}>{confirmButtonText}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;