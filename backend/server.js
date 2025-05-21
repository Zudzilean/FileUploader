const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 导入自定义模块
const File = require('./models/File');
const documentParser = require('./utils/documentParser');
const summaryQueue = require('./queues/summaryQueue');

// 配置常量
const PORT = process.env.PORT || 5000;
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 默认10MB
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fileuploader';

// 数据库连接配置
let mongod;
if (process.env.NODE_ENV === 'test' || process.env.USE_MEMORY_DB) {
  // 使用内存数据库
  const { MongoMemoryServer } = require('mongodb-memory-server');
  
  mongod = new MongoMemoryServer({
    instance: {
      dbName: 'fileuploader-test'
    },
    binary: {
      version: '4.4.1'
    }
  });

  module.exports = async () => {
    const uri = await mongod.getUri();
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('连接到内存MongoDB');
  };
} else {
  // 使用真实MongoDB
  mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
    .then(() => console.log('MongoDB连接成功'))
    .catch(err => {
      console.error('MongoDB连接失败:', err.message);
      process.exit(1);
    });
}

// 关闭数据库连接
process.on('SIGINT', async () => {
  try {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
    console.log('数据库连接已关闭');
    process.exit(0);
  } catch (err) {
    console.error('关闭数据库连接失败:', err);
    process.exit(1);
  }
});

// 确保上传目录存在
const uploadPath = path.join(__dirname, UPLOAD_DIR);
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
  console.log(`创建上传目录: ${uploadPath}`);
}

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 请求日志中间件
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} | ${req.method} ${req.originalUrl} | ${res.statusCode} | ${duration}ms`);
  });
  next();
});

// 配置文件存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // 生成安全的文件名
    const timestamp = Date.now();
    // 使用Buffer处理中文文件名
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    // 只替换特殊字符
    const safeFilename = originalName.replace(/[<>:"/\\|?*]/g, '_');
    const uniqueFilename = `${timestamp}-${safeFilename}`;
    cb(null, uniqueFilename);
  }
});

// 文件类型验证
const validateFileType = (file) => {
  const allowedTypes = [
    'text/plain', 
    'text/markdown', 
    'application/pdf', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',  // Excel 2007+
    'application/vnd.ms-excel'  // Excel 97-2003
  ];
  const allowedExtensions = ['.txt', '.md', '.pdf', '.docx', '.xlsx', '.xls'];
  
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  // 检查MIME类型和文件扩展名
  return allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExt);
};

// 文件过滤器
const fileFilter = (req, file, cb) => {
  if (validateFileType(file)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型。请上传 txt, md, pdf, docx 或 Excel 文件。'), false);
  }
};

// 配置上传
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { 
    fileSize: MAX_FILE_SIZE,
    files: 10 // 限制一次最多上传10个文件
  }
});

// 错误处理中间件
const errorHandler = (err, req, res, next) => {
  console.error(`错误: ${err.message}`);
  console.error(err.stack);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        success: false, 
        message: `文件大小超过限制 (最大 ${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(2)} MB)` 
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: '一次最多只能上传10个文件'
      });
    }
    return res.status(400).json({ success: false, message: `上传错误: ${err.message}` });
  }
  
  res.status(500).json({ success: false, message: '服务器内部错误', error: err.message });
};

// 文件上传路由
app.post('/api/upload', (req, res, next) => {
  upload.array('files')(req, res, async (err) => {
    if (err) {
      return next(err);
    }
    
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: '没有文件被上传' });
      }

      console.log(`上传了 ${req.files.length} 个文件`);
      
      // 处理每个上传的文件
      const uploadedFiles = await Promise.all(req.files.map(async (file) => {
        console.log(`文件上传成功: ${file.originalname} (${file.size} bytes)`);
        // 解析文件名，防止中文乱码
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        // 解析文件内容
        let content = '';
        try {
          content = await documentParser.parseDocument(file.path);
        } catch (parseError) {
          console.error(`解析文件内容失败: ${parseError.message}`);
        }
        // 创建文件记录
        const newFile = new File({
          filename: file.filename,
          originalName: originalName, // 用解码后的
          path: file.path,
          size: file.size,
          mimetype: file.mimetype,
          content,
          summaryStatus: content ? 'pending' : 'failed',
          uploadDate: new Date()
        });
        const savedFile = await newFile.save();
        // 如果内容解析成功，添加到摘要队列
        if (content) {
          await summaryQueue.add({ fileId: savedFile._id });
        }
        return {
          _id: savedFile._id,
          filename: savedFile.filename,
          originalName: savedFile.originalName,
          size: savedFile.size,
          mimetype: savedFile.mimetype,
          summaryStatus: savedFile.summaryStatus,
          uploadDate: savedFile.uploadDate
        };
      }));

      res.json({
        success: true,
        message: `成功上传 ${uploadedFiles.length} 个文件`,
        files: uploadedFiles
      });
    } catch (error) {
      console.error('文件上传处理失败:', error);
      next(error);
    }
  });
});

// 读取文件内容路由
app.get('/api/files/:fileId', async (req, res, next) => {
  try {
    const fileId = req.params.fileId;
    
    // 从数据库获取文件信息
    const file = await File.findById(fileId);
    
    if (!file) {
      return res.status(404).json({ success: false, message: '文件不存在' });
    }
    
    // 如果数据库中已有内容，直接返回
    if (file.content) {
      console.log(`从数据库返回文件内容: ${file.filename} (${file.content.length} 字符)`);
      
      return res.status(200).json({
        success: true,
        file: {
          _id: file._id,
          filename: file.filename,
          originalName: file.originalName,
          size: file.size,
          mimetype: file.mimetype,
          content: file.content,
          summary: file.summary,
          summaryStatus: file.summaryStatus,
          uploadDate: file.uploadDate,
          summaryDate: file.summaryDate
        }
      });
    }
    
    // 如果数据库中没有内容，尝试从文件系统读取
    const filePath = path.join(__dirname, UPLOAD_DIR, file.filename);
    console.log(`尝试从文件系统读取文件: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      console.log(`文件不存在: ${filePath}`);
      return res.status(404).json({ success: false, message: '文件不存在于文件系统' });
    }

    // 解析文件内容
    try {
      const content = await documentParser.parseDocument(filePath);
      
      // 更新数据库中的文件内容
      file.content = content;
      file.summaryStatus = 'pending';
      await file.save();
      
      // 添加到摘要队列
      await summaryQueue.add({ fileId: file._id });
      
      console.log(`成功读取并更新文件内容: ${file.filename} (${content.length} 字符)`);
      
      return res.status(200).json({
        success: true,
        file: {
          _id: file._id,
          filename: file.filename,
          originalName: file.originalName,
          size: file.size,
          mimetype: file.mimetype,
          content: content,
          summaryStatus: 'pending',
          uploadDate: file.uploadDate
        }
      });
    } catch (parseError) {
      console.error(`解析文件内容失败: ${parseError.message}`);
      
      // 更新文件状态为解析失败
      file.summaryStatus = 'failed';
      await file.save();
      
      return res.status(500).json({ 
        success: false, 
        message: '解析文件内容失败', 
        error: parseError.message 
      });
    }
  } catch (error) {
    console.error(`读取文件失败: ${error.message}`);
    next(error);
  }
});

// 获取文件摘要
app.get('/api/files/:fileId/summary', async (req, res, next) => {
  try {
    const fileId = req.params.fileId;
    
    // 从数据库获取文件信息
    const file = await File.findById(fileId);
    
    if (!file) {
      return res.status(404).json({ success: false, message: '文件不存在' });
    }
    
    res.status(200).json({
      success: true,
      summary: file.summary,
      summaryStatus: file.summaryStatus,
      summaryDate: file.summaryDate
    });
  } catch (error) {
    console.error(`获取文件摘要失败: ${error.message}`);
    next(error);
  }
});

// 手动触发文件摘要生成
app.post('/api/files/:fileId/summary', async (req, res, next) => {
  try {
    const fileId = req.params.fileId;
    
    // 从数据库获取文件信息
    const file = await File.findById(fileId);
    
    if (!file) {
      return res.status(404).json({ success: false, message: '文件不存在' });
    }
    
    // 检查文件是否有内容
    if (!file.content) {
      return res.status(400).json({ success: false, message: '文件内容为空，无法生成摘要' });
    }
    
    // 更新摘要状态为待处理
    file.summaryStatus = 'pending';
    await file.save();
    
    // 添加到摘要队列
    await summaryQueue.add({ fileId: file._id });
    
    res.status(200).json({
      success: true,
      message: '摘要生成请求已提交',
      summaryStatus: 'pending'
    });
  } catch (error) {
    console.error(`触发摘要生成失败: ${error.message}`);
    next(error);
  }
});

// 获取所有上传的文件列表
app.get('/api/files', async (req, res, next) => {
  try {
    // 从数据库获取文件列表
    const files = await File.find({}, {
      _id: 1,
      filename: 1,
      originalName: 1,
      size: 1,
      mimetype: 1,
      uploadDate: 1,
      summaryStatus: 1,
      summaryDate: 1
    }).sort({ uploadDate: -1 });
    
    console.log(`从数据库获取到 ${files.length} 个文件`);
    
    res.status(200).json({
      success: true,
      files
    });
  } catch (error) {
    console.error(`获取文件列表失败: ${error.message}`);
    next(error);
  }
});

// 删除文件路由
app.delete('/api/files/:fileId', async (req, res, next) => {
  try {
    const fileId = req.params.fileId;
    
    // 从数据库获取文件信息
    const file = await File.findById(fileId);
    
    if (!file) {
      return res.status(404).json({ success: false, message: '文件不存在' });
    }
    
    const filename = file.filename;
    
    // 安全检查：防止目录遍历攻击
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ success: false, message: '无效的文件名' });
    }
    
    // 规范化路径
    const normalizedFilename = path.normalize(filename).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(__dirname, UPLOAD_DIR, normalizedFilename);
    
    console.log(`尝试删除文件: ${filePath}`);

    // 再次检查路径是否在允许的目录内
    const relativePath = path.relative(path.join(__dirname, UPLOAD_DIR), filePath);
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      return res.status(400).json({ success: false, message: '无效的文件路径' });
    }

    // 尝试从文件系统删除文件
    try {
      // 检查文件是否存在
      if (fs.existsSync(filePath)) {
        // 检查是否为文件而不是目录
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          // 删除文件
          fs.unlinkSync(filePath);
          console.log(`文件已从文件系统删除: ${filePath}`);
        }
      }
    } catch (fsError) {
      console.error(`从文件系统删除文件失败: ${fsError.message}`);
      // 继续执行，即使文件系统删除失败，我们仍然需要从数据库中删除记录
    }
    
    // 从数据库中删除文件记录
    await File.findByIdAndDelete(fileId);
    console.log(`文件记录已从数据库删除: ${fileId}`);
    
    res.status(200).json({
      success: true,
      message: '文件已成功删除',
      fileId
    });
  } catch (error) {
    console.error(`删除文件失败: ${error.message}`);
    next(error);
  }
});

// 注册错误处理中间件
app.use(errorHandler);

// 启动服务器
const server = app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`上传目录: ${uploadPath}`);
  console.log(`最大文件大小: ${(MAX_FILE_SIZE / (1024 * 1024)).toFixed(2)} MB`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

module.exports = app; // 导出供测试使用