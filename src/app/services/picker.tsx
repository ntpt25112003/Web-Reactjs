import React from 'react';

interface PickerOption {
  label: string;
  value: any;
}

interface PickerProps {
  options: PickerOption[];
  onConfirm: (value: any) => void;
  onCancel: () => void;
}

const picker: React.FC<PickerProps> = ({ options, onConfirm, onCancel }) => {
  const [selected, setSelected] = React.useState(options[0]?.value);

  return (
    <div className="picker-backdrop" onClick={onCancel}>
      <div className="picker" onClick={e => e.stopPropagation()}>
        <select value={selected} onChange={e => setSelected(e.target.value)}>
          {options.map((opt, idx) => (
            <option key={idx} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button onClick={() => onConfirm(selected)}>Chọn</button>
        <button onClick={onCancel}>Hủy</button>
      </div>
    </div>
  );
};

export default picker;
