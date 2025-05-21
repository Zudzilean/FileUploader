import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const FileUploader = ({ onUploadSuccess }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // 自动清除成功消息
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // 获取文件类型图标
  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'txt':
        return '📄';
      case 'md':
        return '📝';
      case 'pdf':
        return '📑';
      case 'docx':
        return '📋';
      case 'xlsx':
      case 'xls':
        return '📊';
      default:
        return '📁';
    }
  };

  // 文件大小格式化
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };

  // 验证文件类型
  const validateFileType = (file) => {
    const validTypes = [
      'text/plain', 
      'text/markdown', 
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',  // Excel 2007+
      'application/vnd.ms-excel'  // Excel 97-2003
    ];
    const validExtensions = ['txt', 'md', 'pdf', 'docx', 'xlsx', 'xls'];
    
    const fileType = file.type;
    const fileExt = file.name.split('.').pop().toLowerCase();
    
    return validTypes.includes(fileType) || validExtensions.includes(fileExt);
  };

  const onDrop = useCallback((acceptedFiles) => {
    // 过滤文件类型
    const validFiles = acceptedFiles.filter(validateFileType);
    const invalidFiles = acceptedFiles.filter(file => !validateFileType(file));

    if (invalidFiles.length > 0) {
      setError(`以下文件类型不支持: ${invalidFiles.map(f => f.name).join(', ')}。请上传 txt, md, pdf, docx 或 Excel 文件。`);
    } else {
      setError(null);
    }

    if (validFiles.length > 0) {
      // 添加预览URL
      const filesWithPreview = validFiles.map(file => 
        Object.assign(file, {
          preview: URL.createObjectURL(file)
        })
      );
      
      setFiles(prevFiles => [...prevFiles, ...filesWithPreview]);
      
      if (invalidFiles.length === 0) {
        setSuccessMessage(`已添加 ${validFiles.length} 个文件`);
      }
    }
  }, []);

  // 清理预览URL
  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.preview) URL.revokeObjectURL(file.preview);
      });
    };
  }, [files]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    noClick: false,
    noKeyboard: false
  });

  const uploadFiles = async () => {
    if (files.length === 0) {
      setError('请先选择文件');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress({ percent: percentCompleted });
        }
      });

      setUploading(false);
      
      if (response.data.success) {
        const uploadedCount = response.data.files.length;
        setSuccessMessage(`成功上传 ${uploadedCount} 个文件`);
        setFiles([]);
        setUploadProgress({});
        
        // 通知父组件上传成功，传递文件信息
        onUploadSuccess(response.data.files);
        
        // 显示摘要生成提示
        setTimeout(() => {
          setSuccessMessage(`文件已上传，AI正在生成摘要，请稍候...`);
        }, 2000);
      } else {
        setError('上传失败: ' + response.data.message);
      }
    } catch (err) {
      setUploading(false);
      
      if (err.response?.status === 413) {
        setError('文件大小超过服务器限制');
      } else {
        setError('上传失败: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const removeFile = (index) => {
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      // 清理预览URL
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const clearAllFiles = () => {
    // 清理所有预览URL
    files.forEach(file => {
      if (file.preview) URL.revokeObjectURL(file.preview);
    });
    setFiles([]);
  };

  return (
    <div className="file-uploader">
      {/* 上传按钮：圆形图标按钮 */}
      <button
        className="upload-icon-btn"
        type="button"
        onClick={open}
        title="上传文件"
        disabled={uploading}
      >
        <span className="upload-icon">📎</span>
      </button>
      <input {...getInputProps()} style={{ display: 'none' }} />

      {/* 文件列表 */}
      <ul className="file-list">
        {files.map((file, index) => (
          <li key={index} className="file-item">
            <span className="file-name">{file.name}</span>
            <button
              className="remove-file"
              onClick={() => removeFile(index)}
              title="移除文件"
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      {/* 错误和成功提示、进度条、上传按钮等保留原有逻辑，可适当精简 */}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
          <button className="dismiss-btn" onClick={() => setError(null)}>✕</button>
        </div>
      )}
      {successMessage && (
        <div className="success-message">
          <span className="success-icon">✅</span>
          {successMessage}
          <button className="dismiss-btn" onClick={() => setSuccessMessage(null)}>✕</button>
        </div>
      )}
      {uploading && (
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${uploadProgress.percent || 0}%` }}></div>
          <span className="progress-text">{uploadProgress.percent || 0}%</span>
        </div>
      )}
      <div className="action-buttons">
        <button
          className="upload-btn"
          onClick={uploadFiles}
          disabled={uploading || files.length === 0}
        >
          {uploading ? '上传中...' : '上传文件'}
        </button>
      </div>
    </div>
  );
};

export default FileUploader;