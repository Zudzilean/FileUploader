/**
 * @file redis.secure.config.js
 * @author Yundi Zhang
 * @date 2025-05-21
 * @description Redis 安全连接配置文件，支持 AUTH 密码（默认注释，需加密时取消注释）
 * @dependencies dotenv, ioredis
 */

// 加载 .env.redis.secure 文件中的环境变量
// 如需启用 Redis 密码认证，请取消下方 require 语句的注释
// require('dotenv').config({ path: '.env.redis.secure' });

/**
 * Redis 安全配置对象
 * @returns {Object} Redis 连接配置
 * @example
 * const config = require('./redis.secure.config');
 * const Redis = require('ioredis');
 * const redis = new Redis(config);
 * // 如需启用密码认证，请取消 password 行的注释
 */
const redisSecureConfig = {
    host: process.env.REDIS_HOST,         // Redis 主机
    port: process.env.REDIS_PORT,         // Redis 端口
    // password: process.env.REDIS_PASSWORD, // Redis AUTH 密码（如需加密请取消此行注释）
    // 如需 SSL/TLS，可在此扩展
};

module.exports = redisSecureConfig; 