import React from "react";
import "./Button.scss";
import classNames from "classnames";

const Button = ({
  children,
  type = "primary",
  icon,
  iconPosition = "left", 
  onClick,
  className = "",
  ...props
}) => {
  return (
    <button
      className={classNames("custom-button", type, className)}
      onClick={onClick}
      {...props}
    >
      {icon && iconPosition === "left" && <span className="icon">{icon}</span>}
      <span className="label">{children}</span>
      {icon && iconPosition === "right" && <span className="icon">{icon}</span>}
    </button>
  );
};

export default Button;