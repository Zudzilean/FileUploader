/**
 * @file services/summaryService.js
 * @author Yundi Zhang
 * @date 2025-05-21
 * @description 摘要服务（Redis 方案，无MongoDB）
 * @dependencies axios, redis
 */

const axios = require('axios');
const redis = require('../redisClient');

const FILE_HASH_PREFIX = 'fileuploader:file:';

class SummaryService {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.apiUrl = process.env.DEEPSEEK_API_URL;
  }

  /**
   * 生成摘要并写入 Redis
   * @param {string} fileId 文件ID
   * @returns {Promise<string>} 摘要内容
   */
  async generateSummary(fileId) {
    // 获取文件元数据
    const file = await redis.hgetall(FILE_HASH_PREFIX + fileId);
    if (!file || !file.filename) {
      throw new Error('文件不存在');
    }
    // 只处理有内容的文件
    if (!file.content) {
      await redis.hset(FILE_HASH_PREFIX + fileId, 'summaryStatus', 'failed');
      throw new Error('文件内容为空，无法生成摘要');
    }
    // 调用AI摘要API（此处为伪代码/示例）
    let summary = '';
    try {
      // 这里可根据实际API实现
      // const response = await axios.post(this.apiUrl, { content: file.content }, { headers: { 'Authorization': `Bearer ${this.apiKey}` } });
      // summary = response.data.summary;
      summary = '【AI摘要示例】' + file.content.slice(0, 100) + '...'; // 示例：取前100字
      await redis.hmset(FILE_HASH_PREFIX + fileId, {
        summary,
        summaryStatus: 'completed',
        summaryDate: Date.now()
      });
      return summary;
    } catch (error) {
      await redis.hset(FILE_HASH_PREFIX + fileId, 'summaryStatus', 'failed');
      throw new Error('生成摘要失败: ' + error.message);
    }
  }
}

module.exports = new SummaryService();