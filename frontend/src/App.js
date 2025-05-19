import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './App.css';
import FileUploader from './components/FileUploader';
import FileViewer from './components/FileViewer';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 获取已上传的文件列表
  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/files`);
      if (response.data.success) {
        // 文件已按上传时间降序排序
        setUploadedFiles(response.data.files);
      } else {
        setError('获取文件列表失败: ' + response.data.message);
      }
    } catch (err) {
      setError('获取文件列表失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始加载和刷新时获取文件列表
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles, refreshTrigger]);

  // 处理上传成功
  const handleUploadSuccess = (newFiles) => {
    // 触发文件列表刷新
    setRefreshTrigger(prev => prev + 1);
  };

  // 处理文件删除
  const handleFileDeleted = (fileId) => {
    // 从当前列表中移除已删除的文件
    setUploadedFiles(prevFiles => 
      prevFiles.filter(file => file._id !== fileId)
    );
  };

  // 手动刷新文件列表
  const refreshFileList = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>文件上传与查看系统</h1>
      </header>
      
      <main className="App-main">
        <section className="upload-section">
          <div className="section-header">
            <h2>上传文件</h2>
          </div>
          <FileUploader onUploadSuccess={handleUploadSuccess} />
        </section>
        
        <section className="view-section">
          <div className="section-header">
            <h2>文件管理</h2>
            <button 
              className="refresh-btn" 
              onClick={refreshFileList}
              disabled={loading}
              title="刷新文件列表"
            >
              {loading ? '刷新中...' : '刷新'}
            </button>
          </div>
          
          {loading && uploadedFiles.length === 0 ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p>加载文件列表中...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
              <button className="dismiss-btn" onClick={() => setError(null)}>✕</button>
            </div>
          ) : (
            <FileViewer 
              uploadedFiles={uploadedFiles} 
              onFileDeleted={handleFileDeleted}
            />
          )}
        </section>
      </main>
      
      <footer className="App-footer">
        <div className="footer-content">
          <p>支持上传 TXT、MD、PDF 和 DOCX 文件</p>
          <p className="version">版本 1.0.0</p>
        </div>
      </footer>
    </div>
  );
}

export default App;