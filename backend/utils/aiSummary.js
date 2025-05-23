/**
 * @file utils/aiSummary.js
 * @author Yundi Zhang
 * @date 2024-03-21
 * @description AI 文件摘要生成工具（DeepSeek版）
 * @dependencies axios, redis
 */

const axios = require('axios');
const redis = require('../redisClient');

const FILE_HASH_PREFIX = 'fileuploader:file:';

// 从环境变量读取 DeepSeek 配置
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
const SUMMARY_MAX_LENGTH = process.env.SUMMARY_MAX_LENGTH || 300;

/**
 * 生成文件摘要
 * @param {string} fileId - 文件ID
 * @param {string} content - 文件内容
 * @returns {Promise<void>}
 */
async function generateSummary(fileId, content) {
  try {
    await redis.hmset(FILE_HASH_PREFIX + fileId, { summaryStatus: 'processing' });

    // 调用 DeepSeek API
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `你是一个专业的文件摘要生成助手。请为以下内容生成一个简洁的摘要（不超过${SUMMARY_MAX_LENGTH}字），突出重要信息。`
          },
          {
            role: "user",
            content: content
          }
        ],
        max_tokens: Number(SUMMARY_MAX_LENGTH)
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const summary = response.data.choices[0].message.content;

    await redis.hmset(FILE_HASH_PREFIX + fileId, {
      summary: summary,
      summaryStatus: 'completed',
      summaryDate: Date.now()
    });
  } catch (error) {
    console.error('生成摘要失败:', error);
    await redis.hmset(FILE_HASH_PREFIX + fileId, {
      summaryStatus: 'failed',
      summary: '生成摘要失败: ' + (error.message || '未知错误')
    });
  }
}

module.exports = {
  generateSummary
}; 