/**
 * @file server.js
 * @author Yundi Zhang
 * @date 2025-05-21
 * @description 主服务入口（仅用Redis，无MongoDB）
 * @dependencies express, cors, multer, path, fs, dotenv, redis
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 导入自定义模块
const convertRouter = require('./routes/convert');
const filesRouter = require('./routes/files');

// 配置常量
const PORT = process.env.PORT || 5000;
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 默认10MB
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

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

// 错误处理中间件
const errorHandler = (err, req, res, next) => {
  console.error(`错误: ${err.message}`);
  console.error(err.stack);
  res.status(500).json({ success: false, message: '服务器内部错误', error: err.message });
};

// 统一接口风格为 /fileuploader/upload 和 /fileuploader/files
app.use('/fileuploader/upload', filesRouter); // 上传相关
app.use('/fileuploader/files', filesRouter);  // 文件列表、详情、删除等
app.use('/fileuploader/convert', convertRouter);

// 静态文件服务（如有需要）
app.use('/uploads', express.static(uploadPath));

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