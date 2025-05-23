/**
 * @file routes/files.js
 * @author Yundi Zhang
 * @date 2025-05-21
 * @description 文件上传与管理路由（Redis 方案，无MongoDB）
 * @dependencies express, multer, path, fs, redis, fileProcessor
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const FileProcessor = require('../utils/fileProcessor');
const { generateSummary } = require('../utils/aiSummary');
const redis = require('../redisClient');

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

// Redis key helpers
const FILE_LIST_KEY = 'fileuploader:filelist'; // 存储所有文件ID的有序集合
const FILE_HASH_PREFIX = 'fileuploader:file:'; // 每个文件的详细信息 hash

// 上传文件
router.post('/', upload.array('files'), async (req, res) => {
  try {
    const files = req.files;
    const savedFiles = [];

    for (const file of files) {
      // 处理文件名编码，防止中文乱码
      const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
      // 处理文件内容
      const fileContent = await FileProcessor.processFile(file.path, file.mimetype);
      const fileId = file.filename; // 直接用唯一文件名做ID
      const fileMeta = {
        _id: fileId,
        filename: file.filename,
        originalName: originalName, // 用转换后的
        path: file.path,
        size: file.size,
        mimetype: file.mimetype,
        uploadDate: Date.now(),
        content: fileContent,
        summary: '',
        summaryStatus: 'pending',
        summaryDate: '',
      };
      // 存入Redis
      await redis.hmset(FILE_HASH_PREFIX + fileId, fileMeta);
      await redis.zadd(FILE_LIST_KEY, Date.now(), fileId);
      savedFiles.push(fileMeta);
      // 异步生成摘要
      generateSummary(fileId, fileContent).catch(console.error);
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
    // 获取所有文件ID
    const fileIds = await redis.zrevrangebyscore(FILE_LIST_KEY, '+inf', '-inf');
    const files = [];
    for (const id of fileIds) {
      const meta = await redis.hgetall(FILE_HASH_PREFIX + id);
      if (meta && meta.filename) {
        meta._id = id;
        files.push(meta);
      }
    }
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
    const fileId = req.params.id;
    const meta = await redis.hgetall(FILE_HASH_PREFIX + fileId);
    if (!meta || !meta.filename) {
      return res.status(404).json({ success: false, message: '文件不存在' });
    }
    meta._id = fileId;
    // 获取文件内容和元信息
    const fileResult = await FileProcessor.getFileContent(meta.path);
    if (!fileResult.success) {
      throw new Error(fileResult.error);
    }
    res.json({
      success: true,
      file: {
        ...meta,
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

// 获取文件摘要状态和内容
router.get('/:id/summary', async (req, res) => {
  try {
    const fileId = req.params.id;
    const meta = await redis.hgetall(FILE_HASH_PREFIX + fileId);
    if (!meta || !meta.filename) {
      return res.status(404).json({ success: false, message: '文件不存在' });
    }
    res.json({
      success: true,
      summary: meta.summary || '',
      summaryStatus: meta.summaryStatus || 'pending',
      summaryDate: meta.summaryDate || ''
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 主动触发文件摘要生成
router.post('/:id/summary', async (req, res) => {
  try {
    const fileId = req.params.id;
    const meta = await redis.hgetall(FILE_HASH_PREFIX + fileId);
    if (!meta || !meta.filename) {
      return res.status(404).json({ success: false, message: '文件不存在' });
    }
    // 检查文件内容
    const fileResult = await FileProcessor.getFileContent(meta.path);
    if (!fileResult.success) {
      return res.status(400).json({ success: false, message: '文件内容为空，无法生成摘要' });
    }
    // 更新状态为待处理
    await redis.hmset(FILE_HASH_PREFIX + fileId, { summaryStatus: 'pending' });
    // 触发摘要生成
    generateSummary(fileId, fileResult.content).catch(console.error);
    res.json({
      success: true,
      message: '摘要生成请求已提交',
      summaryStatus: 'pending'
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
    const fileId = req.params.id;
    const meta = await redis.hgetall(FILE_HASH_PREFIX + fileId);
    if (!meta || !meta.filename) {
      return res.status(404).json({ success: false, message: '文件不存在' });
    }
    // 删除物理文件
    if (fs.existsSync(meta.path)) {
      fs.unlinkSync(meta.path);
    }
    // 删除Redis记录
    await redis.del(FILE_HASH_PREFIX + fileId);
    await redis.zrem(FILE_LIST_KEY, fileId);
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

module.exports = router; 