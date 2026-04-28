import React, { FC, CSSProperties } from "react";
import styles from "./Modal.module.css";

interface ModalProps {
  isOpen: boolean;
  children: React.ReactNode;
  style?: CSSProperties;
  fullScreen?: boolean;
  resizable?: boolean;
}

const Modal: FC<ModalProps> = function Modal({
  isOpen,
  children,
  style,
  fullScreen,
  resizable,
}) {
  if (!isOpen) return null;

  return (
    <div className={fullScreen ? styles.overlay : styles.overlayParent}>
      <div
        className={`${styles.modal} ${resizable ? styles.resizable : ""}`}
        style={style}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;
