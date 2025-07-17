import React from 'react';
import './actionSheet.scss';

interface ActionSheetOption {
  text: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

interface ActionSheetProps {
  options: ActionSheetOption[];
  onClose: () => void;
}

const ActionSheet: React.FC<ActionSheetProps> = ({ options, onClose }) => {
  console.log('[ActionSheet] render'); // test log

  return (
    <div
      className="actionsheet-backdrop"
      onClick={onClose}
    >
      <div className="actionsheet" onClick={(e) => e.stopPropagation()} >
        {options.map((opt, idx) => (
          <button className="actionsheet-button"
            key={idx}
            onClick={() => {
              opt.onClick();
              onClose();
            }}
          >
            <span className="icon">{opt.icon}</span>
            <span className="text">{opt.text}</span>
          </button>
        ))}
        {/* <button onClick={onClose}>Đóng</button> */}
      </div>
    </div>
  );
};

export default ActionSheet;
