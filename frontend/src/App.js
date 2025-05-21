import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './App.css';
import FileUploader from './components/FileUploader';
import FileViewer from './components/FileViewer';
import FileConverter from './components/FileConverter';
import ConvertModal from './components/ConvertModal';

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
  const [showConvertModal, setShowConvertModal] = useState(false);

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
          <div className="sidebar-buttons">
            <button className="upload-icon-btn sidebar-upload-btn" type="button" onClick={handleUploadBtnClick} title="新增文件">
              <span className="upload-icon">+</span>
            </button>
          </div>
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
            <div className="loading">加载中...</div>
          ) : selectedFile ? (
            <div className="file-display">
              <div className="file-header">
                <h2>{selectedFile.originalName}</h2>
                <div className="file-actions">
                  <button
                    className={`action-btn${viewMode === 'content' ? ' active' : ''}`}
                    onClick={showFileContent}
                  >
                    内容
                  </button>
                  <button
                    className={`action-btn${viewMode === 'summary' ? ' active' : ''}`}
                    onClick={showSummary}
                  >
                    摘要
                  </button>
                  <FileConverter file={selectedFile} />
                </div>
              </div>
              <div className="file-content">
                {viewMode === 'content' ? (
                  <pre>{fileContent}</pre>
                ) : (
                  <div className="summary-content">
                    {summaryLoading ? (
                      <div className="loading">生成摘要中...</div>
                    ) : summaryStatus === 'pending' ? (
                      <div className="loading">等待生成摘要...</div>
                    ) : summaryStatus === 'failed' ? (
                      <div className="error">生成摘要失败</div>
                    ) : (
                      <div className="summary-text">{fileSummary}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="no-file-selected">
              <p>欢迎使用文件管理与格式转换工具！</p>
              <ol style={{textAlign: 'left', margin: '0 auto', maxWidth: 420, fontSize: '1rem', color: '#666'}}>
                <li>点击左侧 <b>"+"</b> 按钮上传支持的文件（如 txt、md、pdf、docx、xlsx）。</li>
                <li>点击文件名可查看内容或生成智能摘要。</li>
                <li>点击右上角 <b>"转换"</b> 按钮，可将文件导出为其他格式（仅显示支持的目标格式）。</li>
                <li>转换成功后，浏览器会自动弹出"保存为"窗口，选择本地保存路径。</li>
                <li>如需每次选择保存位置，请在浏览器设置中开启"下载前询问保存位置"。</li>
              </ol>
            </div>
          )}
        </main>
      </div>
      {/* 上传弹窗 */}
      {showUploader && (
        <div className="modal-mask" onClick={() => setShowUploader(false)}>
          <div className="modal-uploader" onClick={e => e.stopPropagation()}>
            <FileUploader onUploadSuccess={handleUploadSuccess} />
          </div>
        </div>
      )}
      {/* 转换弹窗 */}
      <ConvertModal
        isOpen={showConvertModal}
        onClose={() => setShowConvertModal(false)}
        onSuccess={() => {
          setShowConvertModal(false);
          // 可以在这里添加成功后的回调
        }}
      />
    </div>
  );
}

export default App;