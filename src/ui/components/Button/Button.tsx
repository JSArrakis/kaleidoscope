import React, { FC, CSSProperties } from "react";
import classNames from "classnames";
import styles from "./Button.module.css";

interface ButtonProps {
  onClick: () => void;
  style?: CSSProperties;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  title?: string;
}

const Button: FC<ButtonProps> = function Button({
  onClick,
  style,
  children,
  className,
  disabled = false,
  title,
}) {
  return (
    <button
      type="button"
      className={classNames(styles.button, className)}
      onClick={onClick}
      style={style}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
};

export default Button;
