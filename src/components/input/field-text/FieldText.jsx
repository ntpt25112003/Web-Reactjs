import React from 'react';
// import './FieldText.scss';
// import { IoTextOutline } from 'react-icons/io5';

const FieldText = ({ value, onChange, label, icon = 'text-outline', required = false, disabled = false }) => {
  return (
    <div className={`field ${disabled ? 'disabled' : ''}`}>      
      {label && <label className="label">{label}{required && <span className="required">*</span>}</label>}
      <div className="group">
        {/* <IoTextOutline className="icon" /> */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required={required}
        />
      </div>
    </div>
  );
};

export default FieldText;
