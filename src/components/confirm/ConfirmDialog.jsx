import React from "react";
import "./ConfirmDialog.scss"; // nếu có

const ConfirmDialog = ({
  open,
  title,
  message,
  confirmText ,
  cancelText,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div className="dialog-backdrop">
      <div className="dialog-box">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="dialog-actions">
          <button onClick={onCancel}>{cancelText}</button>
          <button className="danger" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
