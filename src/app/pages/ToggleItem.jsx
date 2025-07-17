import React from "react";
import "./ToggleItem.scss";

const ToggleItem = ({ title, desc = '', checked, onChange, disabled = false }) => {
  return (
    <div className={`toggle-item ${disabled ? 'disabled' : ''}`}>
      <div className="left">
        <label>
          {title}
          {desc && (
            <>
              <br />
              <small>{desc}</small>
            </>
          )}
        </label>
      </div>
      <label className="switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
        />
        <span className="slider"></span>
      </label>
    </div>
  );
};

export default ToggleItem;
