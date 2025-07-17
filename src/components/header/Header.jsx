import React from "react";
import "./Header.scss";

const Header = ({
  title,
  showLeftIcon = false,
  showRightIcon = false,
  onBack,
  onRightIconClick,
  leftIcon,   
  rightIcon,  
}) => {
  return (
    <div className="header">
      {showLeftIcon ? (
        <button className="back-button" onClick={onBack || (() => window.history.back())}>
          {leftIcon || <span>&lt;</span>} {/* nếu không có icon thì dùng ký hiệu nhỏ */}
        </button>
      ) : (
        <div style={{ width: 0 }} />
      )}

      <h1 className="title">{title}</h1>

      {showRightIcon ? (
        <button className="icon-right" onClick={onRightIconClick} >
          {rightIcon || <span>⚙</span>} {/* nếu không có icon thì dùng ký hiệu nhỏ */}
        </button>
      ) : (
        <div style={{ width: 0 }} />
      )}
    </div>
  );
};

export default Header;
