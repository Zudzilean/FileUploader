/**
 * @file backend/redisClient.js
 * @author Yundi Zhang
 * @date 2025-05-21
 * @description Redis 客户端初始化，支持安全配置（可选密码认证）
 * @dependencies ioredis, redis.secure.config.js
 */

// 引入 ioredis 库
const Redis = require('ioredis');
// 引入安全配置对象（如需密码认证，请在 redis.secure.config.js 取消相关注释）
const secureConfig = require('./redis.secure.config');

/**
 * 创建 Redis 客户端实例
 * @type {Redis}
 * @description
 * 1. 默认使用 .env 或 .env.redis.secure 中的主机和端口
 * 2. 如需密码认证，请在 redis.secure.config.js 取消 password 相关注释
 * 3. 支持后续扩展 SSL/TLS 等高级配置
 *
 * @example
 * const redis = require('./redisClient');
 * redis.set('key', 'value');
 */
const redis = new Redis(secureConfig);

module.exports = redis; 