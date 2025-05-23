/**
 * @file queues/summaryQueue.js
 * @author Yundi Zhang
 * @date 2025-05-21
 * @description 摘要队列（Redis 方案，无MongoDB）
 * @dependencies bull, redis, summaryService
 */

const Queue = require('bull');
const summaryService = require('../services/summaryService');
const redis = require('../redisClient');

const FILE_HASH_PREFIX = 'fileuploader:file:';

// 队列配置
const queueOptions = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
};

const summaryQueue = new Queue('document-summary', queueOptions);

// 处理队列中的任务
summaryQueue.process(async (job) => {
  try {
    const { fileId } = job.data;
    // 直接从 Redis 获取文件元数据
    const file = await redis.hgetall(FILE_HASH_PREFIX + fileId);
    if (!file || !file.filename) {
      throw new Error('文件不存在');
    }
    // 如果摘要已经生成，跳过
    if (file.summaryStatus === 'completed') {
      return { status: 'skipped', message: '摘要已存在' };
    }
    // 生成摘要
    const summary = await summaryService.generateSummary(fileId);
    return { status: 'completed', summary };
  } catch (error) {
    console.error(`处理摘要任务失败: ${error.message}`);
    throw error;
  }
});

// 任务完成回调
summaryQueue.on('completed', (job, result) => {
  console.log(`摘要任务完成: ${job.id}`, result);
});

// 任务失败回调
summaryQueue.on('failed', (job, error) => {
  console.error(`摘要任务失败: ${job.id}`, error.message);
});

module.exports = summaryQueue;