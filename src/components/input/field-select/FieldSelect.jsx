import React from 'react';
import Select, { components } from 'react-select';
import './FieldSelect.scss';
import { IoListOutline, IoListCircleOutline } from 'react-icons/io5';

const CustomOption = (props) => {
  const { isSelected, label } = props;
  return (
    <components.Option {...props}>
      <input
        type="checkbox"
        checked={isSelected}
        readOnly
        style={{
          marginRight: 8,
          transform: 'scale(1.2)',
          accentColor: '#b7300d',
        }}
      />
      {label}
    </components.Option>
  );
};

const FieldSelect = ({
  value,
  onChange,
  label,
  icon = 'list-outline',
  list = [],
  propValue = 'Id',
  propName = 'Name',
  multiple = false,
  required = false,
  disabled = false,
}) => {
  const Icon = icon === 'list-circle-outline' ? IoListCircleOutline : IoListOutline;

  const options = list.map((item) => ({
    value: item[propValue],
    label: item[propName],
  }));

  const handleChange = (selected) => {
    if (multiple) {
      const values = selected ? selected.map((opt) => opt.value) : [];
      onChange(values);
    } else {
      onChange(selected ? selected.value : '');
    }
  };

  const getValue = () => {
    if (multiple) {
      return options.filter((opt) => value.includes(opt.value));
    } else {
      return options.find((opt) => opt.value === value) || null;
    }
  };

  return (
    <div className={`field-select ${disabled ? 'disabled' : ''}`}>
      {label && (
        <label className="label">
          <Icon className="icon" />
          {label} {required && <span className="required">*</span>}
        </label>
      )}
      <Select
        isMulti={multiple}
        options={options}
        value={getValue()}
        onChange={handleChange}
        isDisabled={disabled}
        classNamePrefix="react-select"
        placeholder="Chọn..."
        components={multiple ? { Option: CustomOption } : undefined}
      />
    </div>
  );
};

export default FieldSelect;
