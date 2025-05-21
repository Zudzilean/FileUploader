/**
 * @file fileConverter.js
 * @author Yundi Zhang
 * @date 2025-05-21
 * @description 文件格式转换工具类
 * @dependencies xlsx, csv-writer, fs, path
 */

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

class FileConverter {
  /**
   * 将文件转换为指定格式
   * @param {string} filePath - 源文件路径
   * @param {string} targetFormat - 目标格式 (txt, csv, json)
   * @returns {Promise<Object>} 转换结果
   */
  static async convertFile(filePath, targetFormat) {
    try {
      const extension = path.extname(filePath).toLowerCase();
      const fileName = path.basename(filePath, extension);
      const outputDir = path.join(path.dirname(filePath), 'converted');
      
      // 确保输出目录存在
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      let content;
      let outputPath;

      // 读取源文件内容
      const fileBuffer = fs.readFileSync(filePath);

      // 根据源文件类型和目标格式进行转换
      switch (extension) {
        case '.xlsx':
        case '.xls':
          content = await this.convertExcel(fileBuffer, targetFormat);
          break;
        case '.pdf':
          content = await this.convertPdf(fileBuffer, targetFormat);
          break;
        case '.docx':
          content = await this.convertWord(fileBuffer, targetFormat);
          break;
        case '.txt':
        case '.md':
          content = await this.convertText(fileBuffer, targetFormat);
          break;
        default:
          throw new Error('不支持的文件类型');
      }

      // 生成输出文件路径
      outputPath = path.join(outputDir, `${fileName}.${targetFormat}`);

      // 写入转换后的文件
      await this.writeFile(outputPath, content, targetFormat);

      return {
        success: true,
        message: '文件转换成功',
        outputPath
      };
    } catch (error) {
      return {
        success: false,
        error: `文件转换失败: ${error.message}`
      };
    }
  }

  /**
   * 转换Excel文件
   * @param {Buffer} fileBuffer - 文件内容
   * @param {string} targetFormat - 目标格式
   * @returns {Promise<Object>} 转换后的内容
   */
  static async convertExcel(fileBuffer, targetFormat) {
    const workbook = XLSX.read(fileBuffer);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    
    switch (targetFormat) {
      case 'csv':
        return XLSX.utils.sheet_to_csv(firstSheet);
      case 'json':
        return JSON.stringify(XLSX.utils.sheet_to_json(firstSheet), null, 2);
      case 'txt':
        return XLSX.utils.sheet_to_txt(firstSheet);
      default:
        throw new Error('不支持的目标格式');
    }
  }

  /**
   * 转换PDF文件
   * @param {Buffer} fileBuffer - 文件内容
   * @param {string} targetFormat - 目标格式
   * @returns {Promise<Object>} 转换后的内容
   */
  static async convertPdf(fileBuffer, targetFormat) {
    const pdf = require('pdf-parse');
    const data = await pdf(fileBuffer);
    
    switch (targetFormat) {
      case 'txt':
        return data.text;
      case 'json':
        return JSON.stringify({
          text: data.text,
          info: data.info,
          metadata: data.metadata
        }, null, 2);
      default:
        throw new Error('不支持的目标格式');
    }
  }

  /**
   * 转换Word文件
   * @param {Buffer} fileBuffer - 文件内容
   * @param {string} targetFormat - 目标格式
   * @returns {Promise<Object>} 转换后的内容
   */
  static async convertWord(fileBuffer, targetFormat) {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    
    switch (targetFormat) {
      case 'txt':
        return result.value;
      case 'json':
        return JSON.stringify({
          text: result.value,
          messages: result.messages
        }, null, 2);
      default:
        throw new Error('不支持的目标格式');
    }
  }

  /**
   * 转换文本文件
   * @param {Buffer} fileBuffer - 文件内容
   * @param {string} targetFormat - 目标格式
   * @returns {Promise<Object>} 转换后的内容
   */
  static async convertText(fileBuffer, targetFormat) {
    const text = fileBuffer.toString('utf-8');
    
    switch (targetFormat) {
      case 'json':
        return JSON.stringify({ content: text }, null, 2);
      case 'txt':
        return text;
      default:
        throw new Error('不支持的目标格式');
    }
  }

  /**
   * 写入转换后的文件
   * @param {string} outputPath - 输出文件路径
   * @param {string|Object} content - 文件内容
   * @param {string} format - 文件格式
   * @returns {Promise<void>}
   */
  static async writeFile(outputPath, content, format) {
    if (format === 'csv' && typeof content === 'string') {
      const csvWriter = createCsvWriter({
        path: outputPath,
        header: [
          { id: 'content', title: 'Content' }
        ]
      });
      await csvWriter.writeRecords([{ content }]);
    } else {
      fs.writeFileSync(outputPath, content);
    }
  }
}

module.exports = FileConverter; 