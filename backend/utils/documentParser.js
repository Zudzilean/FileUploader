const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * 文档解析工具类
 * 用于从不同类型的文件中提取文本内容
 */
class DocumentParser {
  /**
   * 解析文档内容
   * @param {string} filePath - 文件路径
   * @returns {Promise<string>} - 提取的文本内容
   */
  async parseDocument(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error('文件不存在');
      }

      const fileExt = path.extname(filePath).toLowerCase();
      let content = '';

      // 根据文件类型处理内容
      switch (fileExt) {
        case '.txt':
        case '.md':
          content = await this.parseTextFile(filePath);
          break;
        
        case '.pdf':
          content = await this.parsePdfFile(filePath);
          break;
        
        case '.docx':
          content = await this.parseDocxFile(filePath);
          break;
        
        default:
          throw new Error('不支持的文件类型');
      }

      return content;
    } catch (error) {
      console.error(`解析文档失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 解析文本文件
   * @param {string} filePath - 文件路径
   * @returns {Promise<string>} - 文本内容
   */
  async parseTextFile(filePath) {
    return fs.readFileSync(filePath, 'utf8');
  }

  /**
   * 解析PDF文件
   * @param {string} filePath - 文件路径
   * @returns {Promise<string>} - 提取的文本内容
   */
  async parsePdfFile(filePath) {
    const pdfData = fs.readFileSync(filePath);
    const pdfResult = await pdfParse(pdfData);
    return pdfResult.text;
  }

  /**
   * 解析DOCX文件
   * @param {string} filePath - 文件路径
   * @returns {Promise<string>} - 提取的文本内容
   */
  async parseDocxFile(filePath) {
    const docxResult = await mammoth.extractRawText({ path: filePath });
    return docxResult.value;
  }
}

module.exports = new DocumentParser();