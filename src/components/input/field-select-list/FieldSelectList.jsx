import React, { useState, useEffect } from 'react';
import { IoCaretDownSharp, IoClose, IoSearch, IoChevronForward } from 'react-icons/io5';
import SelectDialog from './SelectDialog'; 
import './FieldSelectList.scss';

const unicode2assci = (str = '') => {
  return str.normalize("NFD").replace(/\p{Diacritic}/gu, '').toLowerCase();
};

const FieldSelectList = ({
  label = '',
  icon = '',
  list = [],
  propValue = 'Id',
  propName = 'Name',
  required = false,
  multiple = false,
  loading = false,
  disabled = false,
  value,
  onChange = () => {},
}) => {
  const [internalList, setInternalList] = useState([]);
  const [display, setDisplay] = useState('');
  const [filterList, setFilterList] = useState([]);
  const [showClear, setShowClear] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const clonedList = list.map((item) => ({
      _value: item[propValue],
      _name: item[propName],
      _text: unicode2assci(item[propName])
    }));
    setInternalList(clonedList);
  }, [list, propName, propValue]);

  useEffect(() => {
    updateDisplay(value);
  }, [value, internalList]);

  const updateDisplay = (val) => {
    if (multiple && Array.isArray(val)) {
      const names = internalList
        .filter((item) => val.includes(item._value))
        .map((item) => item._name);
      setDisplay(names.join(', '));
      setShowClear(val.length > 0);
    } else {
      const match = internalList.find((item) => item._value === val);
      setDisplay(match ? match._name : '');
      setShowClear(val > -1);
    }
  };

  const handleSelect = (item) => {
    if (disabled) return;
    let newValue = value;
    if (multiple) {
      newValue = Array.isArray(value) ? [...value] : [];
      const index = newValue.indexOf(item._value);
      if (index > -1) {
        newValue.splice(index, 1);
      } else {
        newValue.push(item._value);
      }
    } else {
      newValue = item._value;
      setIsOpen(false);
    }
    onChange(newValue);
  };

  const handleReset = () => {
    if (disabled) return;
    onChange(multiple ? [] : -1);
  };

  const handleSearch = (e) => {
    const text = unicode2assci(e.target.value);
    setFilterList(
      text.length === 0
        ? internalList
        : internalList.filter((item) => item._text.includes(text))
    );
  };

  const handleOpen = () => {
    if (disabled) return;
    setFilterList(internalList);
    setIsOpen(true);
  };

  return (
    <div className={`field-select-list ${disabled ? 'disabled' : ''}`}>
      <div className="field-wrapper">
        {icon && <span className="field-icon">{icon}</span>}
        <input
          value={display}
          readOnly
          onFocus={handleOpen}
          placeholder={label}
        />
        {loading ? (
          <span className="loader" />
        ) : showClear && !disabled ? (
          <IoClose className="icon" onClick={handleReset} />
        ) : (
          <IoCaretDownSharp className="icon" />
        )}
      </div>

      <SelectDialog open={isOpen} title={label} onClose={() => setIsOpen(false)}>
        <div className="modal-search">
          <IoSearch className="icon" />
          <input onInput={handleSearch} placeholder="Tìm kiếm" />
        </div>

        <ul className="modal-list">
          {filterList.map((item) => {
            const selected = multiple
              ? Array.isArray(value) && value.includes(item._value)
              : value === item._value;

            return (
              <li
                key={item._value}
                className={selected ? 'selected' : ''}
                onClick={() => handleSelect(item)}
              >
                {multiple ? (
                  <>
                    <input
                      type="checkbox"
                      readOnly
                      checked={selected}
                    />
                    <span>{item._name}</span>
                  </>
                ) : (
                  <>
                    <span>{item._name}</span>
                    <IoChevronForward className="icon" />
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </SelectDialog>
    </div>
  );
};

export default FieldSelectList;
