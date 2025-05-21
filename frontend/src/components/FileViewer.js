import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const FileViewer = ({ uploadedFiles, onFileDeleted }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [deletingFile, setDeletingFile] = useState(null);
  const [summary, setSummary] = useState('');
  const [summaryStatus, setSummaryStatus] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  // 当上传的文件列表变化时，如果当前选中的文件不在列表中，则清除选中状态
  useEffect(() => {
    if (selectedFile && !uploadedFiles.some(file => file.filename === selectedFile.filename)) {
      setSelectedFile(null);
      setFileContent('');
    }
  }, [uploadedFiles, selectedFile]);

  // 自动清除成功消息
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // 获取文件内容和摘要
  const fetchFileContent = async (file) => {
    if (selectedFile && selectedFile._id === file._id) {
      return; // 已经选中该文件，不需要重新获取
    }
    
    setLoading(true);
    setError(null);
    setSummary('');
    setSummaryStatus('');
    setSummaryError(null);
    setSelectedFile(file);
    
    try {
      const response = await axios.get(`${API_URL}/files/${file._id}`);
      
      if (response.data.success) {
        const { content, summary, summaryStatus } = response.data.file;
        setFileContent(content);
        setSummary(summary || '');
        setSummaryStatus(summaryStatus);
        
        // 如果摘要状态是pending，开始轮询摘要状态
        if (summaryStatus === 'pending' || summaryStatus === 'processing') {
          pollSummaryStatus(file._id);
        }
      } else {
        setError('获取文件内容失败: ' + response.data.message);
        setFileContent('');
      }
    } catch (err) {
      setError('获取文件内容失败: ' + (err.response?.data?.message || err.message));
      setFileContent('');
    } finally {
      setLoading(false);
    }
  };

  // 轮询摘要状态
  const pollSummaryStatus = async (fileId) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await axios.get(`${API_URL}/files/${fileId}/summary`);
        
        if (response.data.success) {
          const { summary, summaryStatus } = response.data;
          setSummaryStatus(summaryStatus);
          
          if (summary) {
            setSummary(summary);
          }
          
          // 如果摘要已完成或失败，停止轮询
          if (summaryStatus === 'completed' || summaryStatus === 'failed') {
            clearInterval(pollInterval);
          }
        }
      } catch (error) {
        console.error('轮询摘要状态失败:', error);
        clearInterval(pollInterval);
      }
    }, 5000); // 每5秒轮询一次

    // 清理函数
    return () => clearInterval(pollInterval);
  };

  // 手动触发摘要生成
  const generateSummary = async () => {
    if (!selectedFile) return;

    setSummaryLoading(true);
    setSummaryError(null);
    
    try {
      const response = await axios.post(`${API_URL}/files/${selectedFile._id}/summary`);
      
      if (response.data.success) {
        setSummaryStatus('pending');
        pollSummaryStatus(selectedFile._id);
      } else {
        setSummaryError('触发摘要生成失败: ' + response.data.message);
      }
    } catch (err) {
      setSummaryError('触发摘要生成失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setSummaryLoading(false);
    }
  };

  const deleteFile = async (file) => {
    if (!window.confirm(`确定要删除文件 "${file.originalName}" 吗？`)) {
      return;
    }
    
    setDeletingFile(file._id);
    setError(null);
    
    try {
      const response = await axios.delete(`${API_URL}/files/${file._id}`);
      
      if (response.data.success) {
        setSuccessMessage(`文件 "${file.originalName}" 已成功删除`);
        
        // 如果删除的是当前选中的文件，清除选中状态
        if (selectedFile && selectedFile._id === file._id) {
          setSelectedFile(null);
          setFileContent('');
          setSummary('');
          setSummaryStatus('');
        }
        
        // 通知父组件更新文件列表
        if (onFileDeleted) {
          onFileDeleted(file._id);
        }
      } else {
        setError('删除文件失败: ' + response.data.message);
      }
    } catch (err) {
      setError('删除文件失败: ' + (err.response?.data?.message || err.message));
    } finally {
      setDeletingFile(null);
    }
  };

  const getFileTypeIcon = (file) => {
    const extension = file.originalName.split('.').pop().toLowerCase();
    
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

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };

  // 格式化日期
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // 获取文件类型名称
  const getFileTypeName = (file) => {
    const extension = file.originalName.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'txt':
        return 'Text';
      case 'md':
        return 'Markdown';
      case 'pdf':
        return 'PDF';
      case 'docx':
        return 'Word';
      case 'xlsx':
      case 'xls':
        return 'Excel';
      default:
        return '未知';
    }
  };

  return (
    <div className="file-viewer">
      {uploadedFiles.length === 0 ? (
        <div className="message system">
          <div className="message-content">
            <div className="empty-state-icon">📂</div>
            <p>没有上传的文件</p>
            <p className="empty-state-hint">上传文件后将显示在这里</p>
          </div>
        </div>
      ) : (
        <div className="file-viewer-grid">
          <div className="file-list">
            <h3>文件列表 ({uploadedFiles.length})</h3>
            <ul className="files-list">
              {uploadedFiles.map((file, index) => (
                <li 
                  key={index} 
                  className={`file-item ${selectedFile && selectedFile.filename === file.filename ? 'selected' : ''}`}
                >
                  <div 
                    className="file-info"
                    onClick={() => fetchFileContent(file)}
                  >
                    <div className="file-details">
                      <span className="file-name">{file.originalName}</span>
                    </div>
                  </div>
                  <button 
                    className="delete-file-btn"
                    onClick={() => deleteFile(file)}
                    disabled={deletingFile === file.filename}
                    title="删除文件"
                  >
                    {deletingFile === file.filename ? '...' : '🗑️'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="file-content">
            {selectedFile ? (
              <>
                <div className="message system">
                  <div className="message-content">
                    <div className="file-content-header">
                      <div className="file-content-title">
                        <span className="file-icon">{getFileTypeIcon(selectedFile)}</span>
                        <h3>{selectedFile.originalName}</h3>
                      </div>
                      <div className="file-content-meta">
                        <span className="file-size">
                          {formatFileSize(selectedFile.size)}
                        </span>
                        {selectedFile.uploadDate && (
                          <span className="file-date">
                            上传于: {formatDate(selectedFile.uploadDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="message system">
                  <div className="message-content">
                    <div className="summary-section">
                      <div className="summary-header">
                        <h4>AI文档摘要</h4>
                        <div className="summary-status">
                          {summaryStatus === 'pending' && (
                            <span className="status pending">等待处理</span>
                          )}
                          {summaryStatus === 'processing' && (
                            <span className="status processing">生成中...</span>
                          )}
                          {summaryStatus === 'completed' && (
                            <span className="status completed">已完成</span>
                          )}
                          {summaryStatus === 'failed' && (
                            <span className="status failed">生成失败</span>
                          )}
                          
                          <button 
                            className="generate-summary-btn"
                            onClick={generateSummary}
                            disabled={summaryLoading || summaryStatus === 'processing' || summaryStatus === 'pending'}
                            title="重新生成摘要"
                          >
                            {summaryLoading ? '处理中...' : '生成摘要'}
                          </button>
                        </div>
                      </div>
                      
                      {summaryError && (
                        <div className="error-message">
                          <span className="error-icon">⚠️</span>
                          {summaryError}
                          <button className="dismiss-btn" onClick={() => setSummaryError(null)}>✕</button>
                        </div>
                      )}
                      
                      <div className="summary-content">
                        {(summaryStatus === 'pending' || summaryStatus === 'processing') && (
                          <div className="summary-loading">
                            <div className="loading-spinner"></div>
                            <p>AI正在生成文档摘要，请稍候...</p>
                          </div>
                        )}
                        
                        {summaryStatus === 'completed' && summary && (
                          <div className="summary-text">
                            {selectedFile.mimetype.includes('excel') && (
                              <div className="excel-summary-header">
                                <h5>Excel 文件摘要</h5>
                                {selectedFile.metadata && (
                                  <div className="excel-metadata">
                                    <span>工作表数量: {selectedFile.metadata.totalSheets}</span>
                                    {selectedFile.metadata.sheets && (
                                      <span>工作表列表: {selectedFile.metadata.sheets.join(', ')}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="summary-content-text">
                              {summary}
                            </div>
                          </div>
                        )}
                        
                        {summaryStatus === 'failed' && (
                          <div className="summary-error">
                            <p>摘要生成失败，请点击"生成摘要"按钮重试。</p>
                          </div>
                        )}
                        
                        {!summaryStatus && (
                          <div className="summary-empty">
                            <p>点击"生成摘要"按钮，使用AI生成文档摘要。</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="message system">
                  <div className="message-content">
                    <h4>文件内容</h4>
                    {loading ? (
                      <div className="loading">
                        <div className="loading-spinner"></div>
                        <p>正在加载文件内容...</p>
                      </div>
                    ) : fileContent ? (
                      <div className="content-display">
                        {fileContent.split('\n').map((line, i) => (
                          <div key={i} className="content-line">{line || <br />}</div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-content">
                        <p>无法显示文件内容</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="message system">
                <div className="message-content">
                  <div className="empty-state-icon">👈</div>
                  <p>从左侧选择一个文件查看内容</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileViewer;