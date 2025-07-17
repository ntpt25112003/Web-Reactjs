import React, { useEffect, useState } from 'react';
import { IoCalendarClearOutline, IoClose } from 'react-icons/io5';
import './FieldDate.scss';

const sysdate = () => new Date().toISOString().substring(0, 10);

const FieldDate = ({
  label = '',
  required = false,
  disabled = false,
  value = '',
  onChange = () => {},
}) => {
  const [pickerValue, setPickerValue] = useState('');

  useEffect(() => {
    setPickerValue(value ? value.substring(0, 10) : '');
  }, [value]);

  const handleReset = () => {
    setPickerValue('');
    onChange('');
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setPickerValue(val);
    onChange(val);
  };

  return (
    <div className={`field ${disabled ? 'disabled' : ''}`}>
      {label && (
        <label className="label">
          {label}
          {required && <span className="required">* </span>}:
        </label>
      )}

      <div className="group">
        <input
          type="date"
          value={pickerValue}
          onChange={handleChange}
          disabled={disabled}
        />
        {!disabled && pickerValue && (
          <button className="icon-button" onClick={handleReset} type="button">
            <IoClose size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

export default FieldDate;
