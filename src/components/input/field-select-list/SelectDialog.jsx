import React from 'react';
import { IoClose } from 'react-icons/io5';
import './SelectDialog.scss';

const SelectDialog = ({ open, title, onClose, children }) => {
  if (!open) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <div className="dialog-header">
          <span className="dialog-title">{title}</span>
          <button className="dialog-close" onClick={onClose}>
            <IoClose />
          </button>
        </div>
        <div className="dialog-body">{children}</div>
      </div>
    </div>
  );
};

export default SelectDialog;
