/**
 * @file ConvertModal.js
 * @author Yundi Zhang
 * @date 2024-03-21
 * @description 文件转换弹窗组件
 */

import React, { useState, useRef } from 'react';
import axios from 'axios';
import './ConvertModal.css';
import ErrorModal from './ErrorModal';

function getSupportedFormats(file) {
  if (!file) return [];
  const ext = (file.originalName || file.name || '').split('.').pop().toLowerCase();
  let formats = [];
  switch (ext) {
    case 'xlsx':
    case 'xls':
      formats = ['txt', 'csv', 'json']; break;
    case 'pdf':
    case 'docx':
      formats = ['txt', 'json']; break;
    case 'txt':
    case 'md':
      formats = ['txt', 'json']; break;
    default:
      formats = [];
  }
  // 过滤掉与当前文件扩展名相同的目标格式
  return formats.filter(fmt => fmt !== ext);
}

const ConvertModal = ({ isOpen, onClose, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetFormat, setTargetFormat] = useState('txt');
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (selectedFile) {
        setError('只能选择一个文件，请先删除当前文件');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConvert = async () => {
    if (!selectedFile) {
      setError('请先选择要转换的文件');
      return;
    }

    try {
      setConverting(true);
      setError(null);
      console.log('开始转换:', selectedFile, targetFormat);

      // 直接请求后端已上传文件的转换接口
      const response = await axios.post(
        `/fileuploader/convert/${selectedFile._id}`,
        { targetFormat },
        { responseType: 'blob' }
      );

      console.log('收到后端响应:', response);
      // 自动下载
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const downloadName = `${selectedFile.originalName.split('.')[0]}.${targetFormat}`;
      link.setAttribute('download', downloadName);
      document.body.appendChild(link);
      console.log('准备触发下载:', downloadName);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      console.log('下载已触发');

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || '转换失败，请稍后重试');
      console.error('转换异常:', err);
    } finally {
      setConverting(false);
    }
  };

  if (!isOpen) return null;

  const supportedFormats = getSupportedFormats(selectedFile);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="convert-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>文件格式转换</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {/* 文件选择区域 */}
          <div className="file-selection">
            <label className="file-label">
              {selectedFile ? (
                <div className="selected-file">
                  <button className="remove-file" onClick={handleRemoveFile}>×</button>
                  <span className="file-name" title={selectedFile.name}>
                    {selectedFile.name.length > 30 
                      ? selectedFile.name.substring(0, 29) + '…'
                      : selectedFile.name}
                  </span>
                </div>
              ) : (
                <div className="file-input-wrapper">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept=".txt,.md,.pdf,.docx,.xlsx,.xls"
                    className="file-input"
                  />
                  <span className="file-input-text">选择文件</span>
                </div>
              )}
            </label>
          </div>

          {/* 格式选择区域 */}
          <div className="format-selection">
            <label className="format-label">目标格式：</label>
            <select
              value={targetFormat}
              onChange={(e) => setTargetFormat(e.target.value)}
              className="format-select"
            >
              {supportedFormats.map(fmt => (
                <option key={fmt} value={fmt}>{fmt.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {/* 转换按钮 */}
          <button
            className="convert-button"
            onClick={handleConvert}
            disabled={!selectedFile || converting}
          >
            {converting ? '转换中...' : '开始转换'}
          </button>
        </div>
      </div>
      {/* 错误弹窗 */}
      <ErrorModal message={error} onClose={() => setError(null)} />
    </div>
  );
};

export default ConvertModal; 