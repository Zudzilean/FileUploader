/**
 * @file encryptionService.js
 * @author Yundi Zhang
 * @date 2024-03-21
 * @description 加密服务模块
 * @dependencies crypto-js
 */

const CryptoJS = require('crypto-js');
require('dotenv').config();

class EncryptionService {
    constructor() {
        this.encryptionKey = process.env.ENCRYPTION_KEY;
        if (!this.encryptionKey) {
            throw new Error('未配置加密密钥 ENCRYPTION_KEY');
        }
    }

    /**
     * 加密数据
     * @param {string|Buffer} data - 需要加密的数据
     * @returns {string} - 加密后的数据
     */
    encrypt(data) {
        try {
            const dataString = Buffer.isBuffer(data) ? data.toString('base64') : data;
            return CryptoJS.AES.encrypt(dataString, this.encryptionKey).toString();
        } catch (error) {
            console.error('加密失败:', error);
            throw error;
        }
    }

    /**
     * 解密数据
     * @param {string} encryptedData - 加密的数据
     * @returns {string} - 解密后的数据
     */
    decrypt(encryptedData) {
        try {
            const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
            return bytes.toString(CryptoJS.enc.Utf8);
        } catch (error) {
            console.error('解密失败:', error);
            throw error;
        }
    }

    /**
     * 加密文件内容
     * @param {Buffer} fileBuffer - 文件内容
     * @returns {Buffer} - 加密后的文件内容
     */
    encryptFile(fileBuffer) {
        try {
            const encrypted = this.encrypt(fileBuffer);
            return Buffer.from(encrypted);
        } catch (error) {
            console.error('文件加密失败:', error);
            throw error;
        }
    }

    /**
     * 解密文件内容
     * @param {Buffer} encryptedBuffer - 加密的文件内容
     * @returns {Buffer} - 解密后的文件内容
     */
    decryptFile(encryptedBuffer) {
        try {
            const decrypted = this.decrypt(encryptedBuffer.toString());
            return Buffer.from(decrypted, 'base64');
        } catch (error) {
            console.error('文件解密失败:', error);
            throw error;
        }
    }

    /**
     * 生成安全的随机密钥
     * @param {number} length - 密钥长度
     * @returns {string} - 生成的密钥
     */
    generateKey(length = 32) {
        return CryptoJS.lib.WordArray.random(length).toString();
    }
}

module.exports = new EncryptionService(); 