const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const ExcelParser = require('./excelParser');

class FileProcessor {
  /**
   * 获取文件内容
   * @param {string} filePath - 文件路径
   * @returns {Promise<Object>} 文件内容和元信息
   */
  static async getFileContent(filePath) {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const extension = path.extname(filePath).toLowerCase();
      let content = '';
      let metadata = {};

      // 根据文件类型选择处理方法
      switch (extension) {
        case '.txt':
        case '.md':
          content = fileBuffer.toString('utf-8');
          break;

        case '.pdf':
          const pdfData = await pdf(fileBuffer);
          content = pdfData.text;
          metadata = {
            pages: pdfData.numpages,
            info: pdfData.info
          };
          break;

        case '.docx':
          const result = await mammoth.extractRawText({ buffer: fileBuffer });
          content = result.value;
          break;

        case '.xlsx':
        case '.xls':
          const excelData = ExcelParser.parseExcel(fileBuffer);
          if (excelData.success) {
            content = ExcelParser.formatExcelToText(excelData);
            metadata = {
              sheets: excelData.data.sheetNames,
              totalSheets: excelData.data.totalSheets
            };
          } else {
            throw new Error(excelData.error);
          }
          break;

        default:
          throw new Error('不支持的文件类型');
      }

      return {
        success: true,
        content,
        metadata
      };
    } catch (error) {
      return {
        success: false,
        error: `文件处理失败: ${error.message}`
      };
    }
  }

  /**
   * 处理文件内容
   * @param {string} filePath - 文件路径
   * @param {string} fileType - 文件类型
   * @returns {Promise<string>} 处理后的文件内容
   */
  static async processFile(filePath, fileType) {
    const result = await this.getFileContent(filePath);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.content;
  }
}

module.exports = FileProcessor; 