/**
 * @file index.js
 * @author Yundi Zhang
 * @date 2024-03-21
 * @description 模块初始化文件
 */

const redisClient = require('./cache/redisClient');
const encryptionService = require('./encryption/encryptionService');
const RateLimiter = require('./security/rateLimiter');
const securityConfig = require('./security/config');

/**
 * 初始化所有模块
 * @returns {Promise<void>}
 */
async function initializeModules() {
    try {
        // 初始化 Redis 客户端
        await redisClient.initialize();
        console.log('Redis 模块初始化成功');

        // 验证加密服务
        if (!encryptionService.encryptionKey) {
            throw new Error('加密服务初始化失败：未配置加密密钥');
        }
        console.log('加密服务模块初始化成功');

        // 创建速率限制器实例
        const rateLimiter = new RateLimiter(securityConfig.rateLimit);
        console.log('安全模块初始化成功');

        return {
            redisClient,
            encryptionService,
            rateLimiter,
            config: securityConfig
        };
    } catch (error) {
        console.error('模块初始化失败:', error);
        throw error;
    }
}

module.exports = {
    initializeModules,
    redisClient,
    encryptionService,
    RateLimiter,
    securityConfig
}; 