// DevReportPage.jsx
import React, { useEffect, useRef, useState } from 'react';
import { IoArrowBackOutline, IoCloseOutline, IoCheckboxOutline } from 'react-icons/io5';
import gestureService from '../../../services/gestureService';
import './ReportPage.scss';
import Header from "../../../../components/header/Header";

const ReportPage = () => {
  const itemRefs = useRef([]);

  const [items, setItems] = useState([]);
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [countMultiSelect, setCountMultiSelect] = useState(0);
  const [isMultiSelectAll, setIsMultiSelectAll] = useState(false);

  useEffect(() => {
    const initialItems = [
      { Id: 1, Name: 'ABC 1' },
      { Id: 2, Name: 'ABC 2' },
      { Id: 3, Name: 'ABC 3' },
      { Id: 4, Name: 'ABC 4' },
      { Id: 5, Name: 'ABC 5' },
    ].map(item => ({ ...item, _checked: false }));
    setItems(initialItems);
  }, []);

  useEffect(() => {
    itemRefs.current.forEach((ref, index) => {
      if (ref) {
        gestureService.registerLongPress(ref, 500, () => {
          if (!isMultiSelect) {
            const newItems = items.map((item, i) => ({
              ...item,
              _checked: i === index,
            }));
            setItems(newItems);
            setIsMultiSelect(true);
            setCountMultiSelect(1);
          }
        });
      }
    });

    return () => {
      gestureService.unregisterLongPress();
    };
  }, [items, isMultiSelect]);

  const handleCheckboxChange = (index, checked) => {
    const newItems = [...items];
    newItems[index]._checked = checked;
    setItems(newItems);

    const newCount = newItems.filter(item => item._checked).length;
    setCountMultiSelect(newCount);
    setIsMultiSelectAll(newCount === newItems.length);
  };

  const handleSelectAll = () => {
    const newChecked = !isMultiSelectAll;
    const newItems = items.map(item => ({ ...item, _checked: newChecked }));
    setItems(newItems);
    setIsMultiSelectAll(newChecked);
    setCountMultiSelect(newChecked ? newItems.length : 0);
  };

  return (
    <div className="dev-report-page">
      <header className="toolbar">
        {isMultiSelect ? (
          <>
            <button onClick={() => setIsMultiSelect(false)}>
              <IoCloseOutline size={20} />
            </button>
            <h1>Đã chọn {countMultiSelect} / {items.length}</h1>
            <button onClick={handleSelectAll}>
              <IoCheckboxOutline size={20} />
            </button>
          </>
        ) : (
          <>
            <Header
              title="Report Page"
              showLeftIcon={true}
              leftIcon={<IoArrowBackOutline/>}
            />
          </>
        )}
      </header>

      <main>
        <ul className="item-list">
          {items.map((item, i) => (
            <li
              key={item.Id}
              ref={el => (itemRefs.current[i] = el)}
              className="item-row"
            >
              {isMultiSelect && (
                <input
                  type="checkbox"
                  checked={item._checked}
                  onChange={e => handleCheckboxChange(i, e.target.checked)}
                />
              )}
              <span>{item.Id}. {item.Name}</span>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
};

export default ReportPage;
