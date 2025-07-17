// FieldDate.jsx
import React, { useEffect, useState, useRef } from 'react';
import {
  IoCalendarClearOutline,
  IoClose,
  IoTextOutline,
  IoEllipsisHorizontalOutline,
  IoEllipsisVerticalOutline,
  IoListOutline,
  IoListCircleOutline,
  IoLayersOutline,
  IoPrintOutline,
  IoArrowBackOutline
} from 'react-icons/io5';
import FieldText from '../../../../components/input/field-text/FieldText';
import FieldNumber from '../../../../components/input/field-num/FieldNum';
import FieldDate from '../../../../components/input/field-date/FieldDate';
import FieldSelect from '../../../../components/input/field-select/FieldSelect';
import FieldSelectList from '../../../../components/input/field-select-list/FieldSelectList';
import FieldListForm from '../../../../components/input/field-list-form/FieldListForm';
import Button from '../../../../components/Button';
import Header from "../../../../components/header/Header";
import './DevForm.scss';

// const formatDate = (dateStr) => {
//   if (!dateStr) return '';
//   const date = new Date(dateStr);
//   if (isNaN(date)) return '';
//   return date.toLocaleDateString('vi-VN');
// };

// const sysdate = () => new Date().toISOString();

const DevForm = () => {
  const c_lstFormPackage = useRef(null);

  // Data
  const s_listItem = [
    { Id: 1, Name: 'Item 1' },
    { Id: 2, Name: 'Item 2' },
    { Id: 3, Name: 'Item 3' }
  ];
  const s_listObject = [
    { Id: 1, Name: 'Object 1', Parent: null },
    { Id: 2, Name: 'Object 2', Parent: null },
    { Id: 3, Name: 'Object 3', Parent: 2 },
    { Id: 4, Name: 'Object 4', Parent: 2 }
  ];

  // Fields
  const [f_text, setFText] = useState('');
  const [f_number, setFNumber] = useState('');
  const [f_decimal, setFDecimal] = useState('');
  const [f_select_single, setFSelectSingle] = useState(-1);
  const [f_select_multi, setFSelectMulti] = useState([]);
  const [f_select_list_single, setFSelectListSingle] = useState(-1);
  const [f_select_list_multi, setFSelectListMulti] = useState([]);
  const [f_date, setFDate] = useState('');
  const [f_package, setFPackage] = useState({});

  useEffect(() => {
    defaultSetForm();
  }, []);

  // Helpers
  const getForm = () => {
    const form = {};
    const fStr = (k, v) => v && (form[k] = v);
    const fId = (k, v) => v > -1 && (form[k] = v);
    const fIdArr = (k, v) => v.length > 0 && (form[k] = v);
    const fIdArr2 = (k, v) => v.length > 0 && (form[k] = v.join(','));

    fStr('f_text', f_text);
    fStr('f_number', f_number);
    fStr('f_decimal', f_decimal);
    fStr('f_date', f_date);
    fId('f_select_single', f_select_single);
    fIdArr('f_select_multi_t1', f_select_multi);
    fIdArr2('f_select_multi_t2', f_select_multi);
    fId('f_select_list_single', f_select_list_single);
    fIdArr('f_select_list_multi_t1', f_select_list_multi);
    fIdArr2('f_select_list_multi_t2', f_select_list_multi);
    form.f_list_form = c_lstFormPackage.current?.getItemEdited() || [];

    return form;
  };

  const setForm = (form = {}) => {
    setFText(form.f_text || '');
    setFNumber(form.f_number || '');
    setFDecimal(form.f_decimal || '');
    setFDate(form.f_date || '');
    setFSelectSingle(form.f_select_single || -1);
    setFSelectMulti((form.f_select_multi || '').split(',').map(Number).filter(Boolean));
    setFSelectListSingle(form.f_select_list_single || -1);
    setFSelectListMulti((form.f_select_list_multi || '').split(',').map(Number).filter(Boolean));
  };

  const defaultSetForm = () => {
    setForm({
      f_text: 'ABC',
      f_number: '2025',
      f_decimal: '3.1415',
      f_date: '2025-02-07T21:30:12',
      f_select_single: 2,
      f_select_multi: '1,3',
      f_select_list_single: 2,
      f_select_list_multi: '1,3'
    });
  };

  const resetForm = () => setForm({});

  const print = () => {
    console.log('[dev-form.page] print', getForm());
    alert('Đã in console.');
  };

  return (
    <div className="dev-form-page">
      <Header
        title="Form Field"
        showLeftIcon={true}
        leftIcon={<IoArrowBackOutline/>}
      />

      <div className="form-container">
        <div className="card">
          <div className="item">
            <div className="item-label">
              <IoTextOutline className="icon" />
              <span>Text Field</span>
            </div>
            <div className="item-field">
              <FieldText value={f_text} onChange={setFText} />
            </div>
          </div>

          <div className="item">
            <div className="item-label">
              <IoEllipsisHorizontalOutline className="icon" />
              <span>Number Field</span>
            </div>
            <div className="item-field">
              <FieldNumber value={f_number} onChange={setFNumber} />
            </div>
          </div>

          <div className="item">
            <div className="item-label">
              <IoEllipsisVerticalOutline className="icon" />
              <span>Decimal Field</span>
            </div>
            <div className="item-field">
              <FieldNumber value={f_decimal} onChange={setFDecimal} isDecimal />
            </div>
          </div>

          <div className="item">
            <div className="item-label">
              <IoCalendarClearOutline className="icon" />
              <span>Date</span>
            </div>
            <div className="item-field">
              <FieldDate value={f_date} onChange={setFDate} />
            </div>
          </div>

          <div className="item">
            <div className="item-label">
              <IoListOutline className="icon" />
              <span>Select Single</span>
            </div>
            <FieldSelect value={f_select_single} onChange={setFSelectSingle} list={s_listItem} />
          </div>

          <div className="item">
            <div className="item-label">
              <IoListCircleOutline className="icon" />
              <span>Select Multi</span>
            </div>
            <FieldSelect value={f_select_multi} onChange={setFSelectMulti} list={s_listItem} multiple />
          </div>

          <div className="item">
            <div className="item-label">
              <IoListOutline className="icon" />
              <span>Select List Single</span>
            </div>
            <FieldSelectList value={f_select_list_single} onChange={setFSelectListSingle} list={s_listItem} />
          </div>

          <div className="item">
            <div className="item-label">
              <IoListCircleOutline className="icon" />
              <span>Select List Multi</span>
            </div>
            <FieldSelectList value={f_select_list_multi} onChange={setFSelectListMulti} list={s_listItem} multiple />
          </div>

          <div className="item">
            <div className="item-label">
              <IoLayersOutline className="icon" />
              <span>List Form</span>
            </div>
            <FieldListForm
              ref={c_lstFormPackage}
              list={s_listObject}
              propValue="Id"
              propName="Name"
              propParent="Parent"
              formContent={({ item, index }) => (
                <FieldText
                  value={f_package.Text || ''}
                  onChange={(val) => {
                    setFPackage({ ...f_package, Text: val });
                    c_lstFormPackage.current?.edit(index, { ...f_package, Text: val });
                  }}
                  label="Text Field"
                />
              )}
            />
          </div>
        </div>
      </div>

      <div className="footer-buttons">
        <div className="left-buttons">
          <Button className="primary" onClick={defaultSetForm}>Set</Button>
          <Button className="outline" onClick={resetForm}>Reset</Button>
        </div>
        <div className="right-buttons">
          <Button className="primary" onClick={print}>
            <IoPrintOutline style={{ fontSize: 20, marginRight: 6 }} />
            PRINT
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DevForm;
