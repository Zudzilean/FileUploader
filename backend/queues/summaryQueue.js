const Queue = require('bull');
const summaryService = require('../services/summaryService');
const File = require('../models/File');

// 创建摘要队列
const queueOptions = process.env.NODE_ENV === 'test' || process.env.USE_MEMORY_QUEUE 
  ? { 
      redis: {
        host: 'localhost',
        port: 6379,
        maxRetriesPerRequest: null // 禁用重试
      },
      settings: {
        stalledInterval: 0 // 禁用延迟检查
      }
    }
  : {
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
    
    // 检查文件是否存在
    const file = await File.findById(fileId);
    if (!file) {
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