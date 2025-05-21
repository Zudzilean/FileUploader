const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const File = require('../models/File');
const FileProcessor = require('../utils/fileProcessor');
const { generateSummary } = require('../utils/aiSummary');

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/plain',
      'text/markdown',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    const allowedExtensions = ['.txt', '.md', '.pdf', '.docx', '.xlsx', '.xls'];
    
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型。请上传 txt, md, pdf, docx 或 Excel 文件。'));
    }
  }
});

// 上传文件
router.post('/upload', upload.array('files'), async (req, res) => {
  try {
    const files = req.files;
    const savedFiles = [];

    for (const file of files) {
      // 处理文件内容
      const fileContent = await FileProcessor.processFile(file.path, file.mimetype);
      
      // 创建文件记录
      const newFile = new File({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
        content: fileContent
      });

      // 保存文件记录
      await newFile.save();
      savedFiles.push(newFile);

      // 异步生成摘要
      generateSummary(newFile._id, fileContent).catch(console.error);
    }

    res.json({
      success: true,
      message: '文件上传成功',
      files: savedFiles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取文件列表
router.get('/', async (req, res) => {
  try {
    const files = await File.find().sort({ uploadDate: -1 });
    res.json({
      success: true,
      files
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取文件内容
router.get('/:id', async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    // 获取文件内容和元信息
    const fileResult = await FileProcessor.getFileContent(file.path);
    if (!fileResult.success) {
      throw new Error(fileResult.error);
    }

    res.json({
      success: true,
      file: {
        ...file.toObject(),
        content: fileResult.content,
        metadata: fileResult.metadata
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 删除文件
router.delete('/:id', async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    // 删除物理文件
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // 删除数据库记录
    await File.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: '文件删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 生成文件摘要
router.post('/:id/summary', async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    // 获取文件内容
    const fileResult = await FileProcessor.getFileContent(file.path);
    if (!fileResult.success) {
      throw new Error(fileResult.error);
    }

    // 更新文件摘要状态
    file.summaryStatus = 'processing';
    await file.save();

    // 异步生成摘要
    generateSummary(file._id, fileResult.content).catch(console.error);

    res.json({
      success: true,
      message: '摘要生成已开始'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 获取文件摘要
router.get('/:id/summary', async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    res.json({
      success: true,
      summary: file.summary,
      summaryStatus: file.summaryStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router; 