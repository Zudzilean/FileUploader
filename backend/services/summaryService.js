const axios = require('axios');
const File = require('../models/File');

class SummaryService {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.apiUrl = process.env.DEEPSEEK_API_URL;
  }

  /**
   * 生成文档摘要
   * @param {string} fileId - 文件ID
   * @returns {Promise<string>} - 生成的摘要
   */
  async generateSummary(fileId) {
    try {
      // 获取文件信息
      const file = await File.findById(fileId);
      if (!file || !file.content) {
        throw new Error('文件不存在或内容为空');
      }

      // 更新摘要状态为处理中
      await File.findByIdAndUpdate(fileId, { summaryStatus: 'processing' });

      // 准备内容
      const content = file.content;
      
      // 如果内容太长，截取前10000个字符
      const truncatedContent = content.length > 10000 
        ? content.substring(0, 10000) + '...(内容已截断)'
        : content;

      // 调用DeepSeek API生成摘要
      const response = await axios.post(this.apiUrl, {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "你是一个专业的文档摘要助手。请为以下文档内容生成一个简洁、全面的摘要，突出文档的主要观点和关键信息。摘要应该是中文的，不超过300字。"
          },
          {
            role: "user",
            content: truncatedContent
          }
        ],
        max_tokens: 500,
        temperature: 0.5,
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      // 提取摘要
      const summary = response.data.choices[0].message.content.trim();

      // 更新文件记录
      await File.findByIdAndUpdate(fileId, {
        summary,
        summaryStatus: 'completed',
        summaryDate: new Date()
      });

      return summary;
    } catch (error) {
      console.error(`生成摘要失败: ${error.message}`);
      
      // 更新摘要状态为失败
      await File.findByIdAndUpdate(fileId, { 
        summaryStatus: 'failed',
        summary: `摘要生成失败: ${error.message}`
      });
      
      throw error;
    }
  }
}

module.exports = new SummaryService();