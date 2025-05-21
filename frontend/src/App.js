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
  const [selectedFile, setSelectedFile] = useState(null);
  const [showUploader, setShowUploader] = useState(false);
  const fileInputRef = React.useRef();
  const [viewMode, setViewMode] = useState('content'); // 'content' or 'summary'
  const [fileContent, setFileContent] = useState('');
  const [fileSummary, setFileSummary] = useState('');
  const [summaryStatus, setSummaryStatus] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/files`);
      if (response.data.success) {
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

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles, refreshTrigger]);

  const handleUploadSuccess = (newFiles) => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleFileDeleted = (fileId) => {
    setUploadedFiles(prevFiles => 
      prevFiles.filter(file => file._id !== fileId)
    );
  };

  const handleSelectFile = (file) => {
    setSelectedFile(file);
  };

  const handleFileInputChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        setRefreshTrigger(prev => prev + 1);
        // 自动选中新上传的第一个文件并显示内容
        if (response.data.files && response.data.files.length > 0) {
          const newFile = response.data.files[0];
          setSelectedFile(newFile);
          setViewMode('content');
          // 直接获取并显示文件内容
          const contentResponse = await axios.get(`${API_URL}/files/${newFile._id}`);
          if (contentResponse.data.success) {
            setFileContent(contentResponse.data.file.content || '');
          }
        }
      } else {
        setError('上传失败: ' + response.data.message);
      }
    } catch (err) {
      setError('上传失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
      // 清空input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const showFileContent = async () => {
    if (!selectedFile) return;
    setViewMode('content');
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/files/${selectedFile._id}`);
      if (response.data.success) {
        setFileContent(response.data.file.content || '');
      } else {
        setError('获取文件内容失败: ' + response.data.message);
      }
    } catch (err) {
      setError('获取文件内容失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const showSummary = async () => {
    if (!selectedFile) return;
    setViewMode('summary');
    setSummaryLoading(true);
    setError(null);
    try {
      // 先尝试获取摘要
      let response = await axios.get(`${API_URL}/files/${selectedFile._id}`);
      if (response.data.success && response.data.file.summary) {
        setFileSummary(response.data.file.summary);
        setSummaryStatus(response.data.file.summaryStatus || 'completed');
        setSummaryLoading(false);
        return;
      }
      // 没有摘要则请求生成
      response = await axios.post(`${API_URL}/files/${selectedFile._id}/summary`);
      if (response.data.success) {
        setSummaryStatus('pending');
        // 轮询摘要状态
        pollSummary(selectedFile._id);
      } else {
        setError('生成摘要失败: ' + response.data.message);
        setSummaryLoading(false);
      }
    } catch (err) {
      setError('生成摘要失败: ' + (err.response?.data?.message || err.message));
      setSummaryLoading(false);
    }
  };

  const pollSummary = (fileId) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${API_URL}/files/${fileId}/summary`);
        if (response.data.success) {
          setSummaryStatus(response.data.summaryStatus);
          if (response.data.summary) setFileSummary(response.data.summary);
          if (['completed', 'failed'].includes(response.data.summaryStatus)) {
            clearInterval(interval);
            setSummaryLoading(false);
          }
        }
      } catch {
        clearInterval(interval);
        setSummaryLoading(false);
      }
    }, 2000);
  };

  const getFileTypeIcon = (file) => {
    const extension = (file.originalName || file.name || '').split('.').pop().toLowerCase();
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

  const handleUploadBtnClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('确定要删除该文件吗？')) return;
    setLoading(true);
    setError(null);
    try {
      const response = await axios.delete(`${API_URL}/files/${fileId}`);
      if (response.data.success) {
        setUploadedFiles(prev => prev.filter(f => f._id !== fileId));
        if (selectedFile && selectedFile._id === fileId) setSelectedFile(null);
      } else {
        setError('删除文件失败: ' + response.data.message);
      }
    } catch (err) {
      setError('删除文件失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="app-main-flex">
        {/* 左侧栏 */}
        <aside className="sidebar">
          <button className="upload-icon-btn sidebar-upload-btn" type="button" onClick={handleUploadBtnClick} title="新增文件">
            <span className="upload-icon">+</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            multiple
            accept=".txt,.md,.pdf,.docx,.xlsx,.xls"
            onChange={handleFileInputChange}
          />
          <ul className="sidebar-file-list">
            {uploadedFiles.map((file, idx) => (
              <li
                key={file._id}
                className={`sidebar-file-item${selectedFile && selectedFile._id === file._id ? ' selected' : ''}`}
                title={file.originalName}
                onClick={() => handleSelectFile(file)}
              >
                <span className="file-name-ellipsis">{file.originalName}</span>
                <button
                  className="delete-file-x"
                  title="删除文件"
                  onClick={e => { e.stopPropagation(); handleDeleteFile(file._id); }}
                >×</button>
              </li>
            ))}
          </ul>
        </aside>
        {/* 右侧主显示区 */}
        <main className="main-display-area">
          {error && (
            <div className="message error">
              <div className="message-content">
                <span className="error-icon">⚠️</span>
                {error}
                <button className="dismiss-btn" onClick={() => setError(null)}>✕</button>
              </div>
            </div>
          )}
          {loading ? (
            <div className="message system">
              <div className="message-content loading">
                <div className="loading-spinner"></div>
                <p>正在加载...</p>
              </div>
            </div>
          ) : (
            selectedFile ? (
              <div className="file-content-area">
                <div className="file-content-header">
                  <span className="file-icon" style={{fontSize:'2rem'}}>{getFileTypeIcon(selectedFile)}</span>
                  <span style={{marginLeft:'1rem',fontWeight:600}}>{selectedFile.originalName}</span>
                </div>
                <div className="file-meta-info">
                  <span>大小: {selectedFile.size} 字节</span>
                  {selectedFile.uploadDate && <span style={{marginLeft:'1.5rem'}}>上传于: {selectedFile.uploadDate}</span>}
                </div>
                {/* 内容/摘要切换 */}
                {viewMode === 'content' && (
                  <div className="content-display" style={{marginTop:'2rem'}}>
                    {fileContent ? fileContent.split('\n').map((line,i)=>(<div key={i} className="content-line">{line || <br />}</div>)) : <span style={{color:'#bbb'}}>暂无内容</span>}
                  </div>
                )}
                {viewMode === 'summary' && (
                  <div className="content-display" style={{marginTop:'2rem'}}>
                    {summaryLoading ? <span style={{color:'#bbb'}}>AI正在生成摘要...</span> :
                      summaryStatus==='completed' && fileSummary ? fileSummary :
                      summaryStatus==='failed' ? <span style={{color:'red'}}>摘要生成失败</span> :
                      <span style={{color:'#bbb'}}>暂无摘要</span>
                    }
                  </div>
                )}
              </div>
            ) : (
              <div className="guide-text-center">
                <span style={{color:'#b0b0b0', textAlign:'center'}}>
                  点击右侧+添加文件<br />
                  支持格式：txt、md、pdf、docx、xlsx、xls
                </span>
              </div>
            )
          )}
        </main>
      </div>
      {/* 底部操作区 */}
      <footer className="bottom-action-bar">
        <button className="action-btn" disabled={!selectedFile} onClick={showFileContent}>文件内容</button>
        <button className="action-btn" disabled={!selectedFile} onClick={showSummary}>生成摘要</button>
      </footer>
      {/* 上传弹窗 */}
      {showUploader && (
        <div className="modal-mask" onClick={() => setShowUploader(false)}>
          <div className="modal-uploader" onClick={e => e.stopPropagation()}>
            <FileUploader onUploadSuccess={handleUploadSuccess} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;