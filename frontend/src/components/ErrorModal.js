/**
 * @file ErrorModal.js
 * @author Yundi Zhang
 * @date 2024-03-21
 * @description 居中错误弹窗组件
 */
import React from 'react';
import ReactDOM from 'react-dom';
import './ErrorModal.css';

const ErrorModal = ({ message, onClose }) => {
  if (!message) return null;
  return ReactDOM.createPortal(
    (
      <div className="error-modal-overlay" onClick={onClose}>
        <div className="error-modal" onClick={e => e.stopPropagation()}>
          <div className="error-modal-content">
            <span className="error-modal-title">失败</span>
            <div className="error-modal-message">{message}</div>
            <button className="error-modal-close" onClick={onClose}>关闭</button>
          </div>
        </div>
      </div>
    ),
    document.body
  );
};

export default ErrorModal; 