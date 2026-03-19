import React, { FC, CSSProperties } from 'react';
import classNames from 'classnames';
import styles from './Button.module.css';

interface ButtonProps {
  onClick: () => void;
  style?: CSSProperties;
  children: React.ReactNode;
  className?: string;
}

const Button: FC<ButtonProps> = function Button({
  onClick,
  style,
  children,
  className,
}) {
  return (
    <button
      type="button"
      className={classNames(styles.button, className)}
      onClick={onClick}
      style={style}
    >
      {children}
    </button>
  );
};

export default Button;
