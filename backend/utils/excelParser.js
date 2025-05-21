/**
 * @file excelParser.js
 * @author Yundi Zhang
 * @date 2024-03-21
 * @description Excel 文件解析工具类
 * @dependencies xlsx
 */

const XLSX = require('xlsx');

class ExcelParser {
  /**
   * 解析 Excel 文件内容
   * @param {Buffer} fileBuffer - Excel 文件的 Buffer 数据
   * @returns {Object} 解析结果，包含表格数据和元信息
   */
  static parseExcel(fileBuffer) {
    try {
      // 读取工作簿
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      
      // 获取所有工作表名称
      const sheetNames = workbook.SheetNames;
      
      // 存储所有工作表的数据
      const sheets = {};
      
      // 遍历每个工作表
      sheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        // 将工作表转换为 JSON 数据
        let data = [];
        try {
          data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        } catch (e) {
          data = [];
        }
        // 获取工作表的范围
        let range = null;
        if (worksheet && worksheet['!ref']) {
          try {
            range = XLSX.utils.decode_range(worksheet['!ref']);
          } catch (e) {
            range = null;
          }
        }
        sheets[sheetName] = {
          data: data,
          range: range ? {
            startRow: range.s.r,
            endRow: range.e.r,
            startCol: range.s.c,
            endCol: range.e.c
          } : null
        };
      });
      
      return {
        success: true,
        data: {
          sheets: sheets,
          sheetNames: sheetNames,
          totalSheets: sheetNames.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Excel 解析失败: ${error.message}\n${error.stack}`
      };
    }
  }

  /**
   * 将 Excel 数据转换为文本格式
   * @param {Object} excelData - Excel 解析结果
   * @returns {string} 格式化后的文本内容
   */
  static formatExcelToText(excelData) {
    if (!excelData.success) {
      return 'Excel 解析失败';
    }

    let textContent = '';
    const { sheets, sheetNames } = excelData.data;

    sheetNames.forEach(sheetName => {
      const sheet = sheets[sheetName];
      textContent += `工作表: ${sheetName}\n`;
      textContent += '='.repeat(50) + '\n\n';

      // 添加表头
      if (sheet.data.length > 0) {
        const headers = sheet.data[0];
        textContent += headers.join('\t') + '\n';
        textContent += '-'.repeat(50) + '\n';
      }

      // 添加数据行
      for (let i = 1; i < sheet.data.length; i++) {
        const row = sheet.data[i];
        textContent += row.join('\t') + '\n';
      }

      textContent += '\n\n';
    });

    return textContent;
  }
}

module.exports = ExcelParser; 