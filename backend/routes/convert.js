/**
 * @file convert.js
 * @author Yundi Zhang
 * @date 2025-05-21
 * @description 文件转换路由处理（Redis 方案，无MongoDB）
 * @dependencies express, FileConverter, redis
 */

const express = require('express');
const router = express.Router();
const FileConverter = require('../utils/fileConverter');
const fs = require('fs');
const redis = require('../redisClient');

const FILE_HASH_PREFIX = 'fileuploader:file:';

/**
 * 转换文件格式
 * POST /api/convert/:fileId
 * @param {string} fileId - 文件ID
 * @param {string} targetFormat - 目标格式 (txt, csv, json)
 */
router.post('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { targetFormat } = req.body;

    console.log('[Convert] 请求参数:', { fileId, targetFormat });

    // 验证目标格式
    const allowedFormats = ['txt', 'csv', 'json'];
    if (!allowedFormats.includes(targetFormat)) {
      console.log('[Convert] 不支持的目标格式:', targetFormat);
      return res.status(400).json({
        success: false,
        message: '不支持的目标格式。支持的格式：txt, csv, json'
      });
    }

    // 获取文件信息（从 Redis）
    const file = await redis.hgetall(FILE_HASH_PREFIX + fileId);
    if (!file || !file.filename) {
      console.log('[Convert] 文件不存在:', fileId);
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }
    console.log('[Convert] 文件信息:', file);

    // 转换文件
    const result = await FileConverter.convertFile(file.path, targetFormat);
    console.log('[Convert] 转换结果:', result);
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error
      });
    }

    const outputPath = result.outputPath;
    if (!fs.existsSync(outputPath)) {
      return res.status(404).json({ success: false, message: '输出文件不存在' });
    }
    const downloadName = `${file.originalName.split('.')[0]}.${targetFormat}`;
    res.download(outputPath, downloadName);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router; 