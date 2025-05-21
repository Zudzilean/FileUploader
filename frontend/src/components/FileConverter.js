/**
 * @file FileConverter.js
 * @author Yundi Zhang
 * @date 2024-03-21
 * @description 文件格式转换组件
 */

import React, { useState } from 'react';
import axios from 'axios';
import './FileConverter.css';

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

const FileConverter = ({ file }) => {
  const [targetFormat, setTargetFormat] = useState('txt');
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const supportedFormats = getSupportedFormats(file);

  const handleConvert = async () => {
    try {
      setConverting(true);
      setError(null);
      setSuccess(null);
      console.log('开始转换:', file, targetFormat);

      const response = await axios.post(
        `/api/convert/${file._id}`,
        { targetFormat },
        { responseType: 'blob' }
      );

      console.log('收到后端响应:', response);
      // 自动下载
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      const downloadName = `${file.originalName.split('.')[0]}.${targetFormat}`;
      link.href = url;
      link.setAttribute('download', downloadName);
      document.body.appendChild(link);
      console.log('准备触发下载:', downloadName);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      console.log('下载已触发');

      setSuccess(`文件已成功转换为 ${targetFormat} 格式`);
    } catch (err) {
      setError(err.response?.data?.message || '转换失败，请稍后重试');
      console.error('转换异常:', err);
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="file-converter">
      <div className="converter-controls">
        <select
          value={targetFormat}
          onChange={(e) => setTargetFormat(e.target.value)}
          disabled={converting}
          className="format-select"
        >
          {supportedFormats.map(fmt => (
            <option key={fmt} value={fmt}>{fmt.toUpperCase()}</option>
          ))}
        </select>
        <button
          onClick={handleConvert}
          disabled={converting}
          className="convert-button"
        >
          {converting ? '转换中...' : '转换'}
        </button>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {success && (
        <div className="success-message">
          {success}
        </div>
      )}
    </div>
  );
};

export default FileConverter; 