// FieldNumber.jsx
import React, { useEffect, useState } from 'react';
import { IoEllipsisHorizontalOutline, IoEllipsisVerticalOutline } from 'react-icons/io5';
import '../field-date/FieldDate.scss';

const formatNumber = (val) => {
  const num = val.replace(/[^\d]/g, '');
  return num;
};

const formatDecimal = (val) => {
  const num = val.replace(/[^\d.]/g, '');
  const parts = num.split('.');
  if (parts.length > 2) return parts[0] + '.' + parts[1]; // only allow one dot
  return num;
};

const FieldNumber = ({
  label = '',
  icon = 'ellipsis-horizontal-outline',
  isDecimal = false,
  required = false,
  disabled = false,
  value = null,
  onChange = () => {},
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [inputMode, setInputMode] = useState('numeric');

  useEffect(() => {
    setInputMode(isDecimal ? 'decimal' : 'numeric');
  }, [isDecimal]);

  useEffect(() => {
    if (value === null || value === '') {
      setDisplayValue('');
    } else {
      const formatted = isDecimal ? formatDecimal(value.toString()) : formatNumber(value.toString());
      setDisplayValue(formatted);
    }
  }, [value, isDecimal]);

  const handleInput = (e) => {
    const rawVal = e.target.value;
    const formatted = isDecimal ? formatDecimal(rawVal) : formatNumber(rawVal);
    setDisplayValue(formatted);

    const parsed = isDecimal ? parseFloat(formatted) : parseInt(formatted, 10);
    onChange(isNaN(parsed) ? null : parsed);
  };

  const IconComponent = isDecimal ? IoEllipsisVerticalOutline : IoEllipsisHorizontalOutline;

  return (
    <div className={`field ${disabled ? 'disabled' : ''}`}>
      {label && (
        <label className="label">
          {label}
          {required && <span className="required">* </span>}:
        </label>
      )}
      <div className="group">
        {/* <IconComponent className="icon" /> */}
        <input
          type="text"
          inputMode={inputMode}
          value={displayValue}
          onChange={handleInput}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default FieldNumber;
