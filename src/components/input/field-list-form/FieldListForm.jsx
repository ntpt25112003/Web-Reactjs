// FieldListForm.jsx
import React, { useEffect, useState } from 'react';
import './FieldListForm.scss';
import { IoChevronForward, IoChevronDownOutline, IoAdd, IoRemove } from 'react-icons/io5';

const FieldListForm = ({
  list = [],
  label = '',
  icon = null,
  required = false,
  loading = false,
  disabled = false,
  propValue = 'Id',
  propName = 'Name',
  propParent = '',
  formContent, // a render function: (item, index) => JSX
  onChange = () => {},
  onOpenForm = () => {},
}) => {
  const [items, setItems] = useState([]);
  const [openIndex, setOpenIndex] = useState(-1);
  const [expand, setExpand] = useState(-1);

  useEffect(() => {
    if (!list || list.length === 0) return;

    // Clone and normalize list
    let lst = list.map(item => {
      const newItem = {
        ...item,
        _value: item[propValue],
        _name: item[propName],
        _parent: propParent ? item[propParent] : null,
        _edit: item._edit || false,
      };
      return newItem;
    });

    // Sort tree if needed
    if (propParent) {
      const map = {};
      const roots = [];
      lst.forEach(item => {
        const key = item._value;
        item.childrent = [];
        map[key] = item;
      });
      lst.forEach(item => {
        if (item._parent != null) {
          const parent = map[item._parent];
          if (parent) {
            parent.childrent.push(item);
            parent._hasChild = true;
          }
        } else {
          roots.push(item);
        }
      });
      const flatList = [];
      roots.forEach(parent => {
        flatList.push(parent);
        if (parent.childrent?.length > 0) {
          parent.childrent.forEach(child => flatList.push(child));
        }
      });
      setItems(flatList);
    } else {
      setItems(lst);
    }
  }, [list, propValue, propName, propParent]);

  const toggleExpand = (item) => {
    setOpenIndex(-1);
    setExpand(prev => prev === item._value ? -1 : item._value);
  };

  const toggleOpen = (item, index) => {
    setOpenIndex(prev => prev === index ? -1 : index);
    if (openIndex !== index) onOpenForm(item);
  };

  const editItem = (index, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], ...value, _edit: true };
    setItems(updated);
    onChange(updated);
  };

  const getItemEdited = () => {
    return items.filter(item => item._edit === true)
      .map(({ _edit, _name, _value, ...rest }) => ({ ...rest }));
  };

  return (
    <div className="field-list-form">

      {/* <div className="header">
        {icon && <span className="icon">{icon}</span>}
        <label className="label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      </div> */}

      <div className="list">
        {items.map((item, i) => (
          <div
            key={item._value}
            className={`list-item ${openIndex === i ? 'open' : ''}`}
          >
            <div className="item-header">
              {item._parent == null || item._parent === expand ? (
                <>
                  {item._hasChild ? (
                    <button onClick={() => toggleExpand(item)} className="expand-button">
                      {expand === item._value ? <IoRemove /> : <IoAdd />}
                    </button>
                  ) : (
                    <span className="expand-placeholder" />
                  )}

                  <div
                    className={`label ${item._parent != null ? 'child' : ''}`}
                    onClick={() => toggleOpen(item, i)}
                  >
                    {item._name}
                    {item._edit && <span> (*)</span>}
                  </div>

                  <button className="toggle-button" onClick={() => toggleOpen(item, i)}>
                    {openIndex === i ? <IoChevronDownOutline /> : <IoChevronForward />}
                  </button>
                </>
              ) : null}
            </div>

            {openIndex === i && (
              <div className="form-container">
                {formContent && formContent(item, i, (value) => editItem(i, value))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FieldListForm;
