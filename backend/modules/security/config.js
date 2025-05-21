/**
 * @file config.js
 * @author Yundi Zhang
 * @date 2024-03-21
 * @description 安全配置模块
 */

require('dotenv').config();

const securityConfig = {
    // Redis 配置
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        password: process.env.REDIS_PASSWORD,
        ttl: 3600 // 默认缓存时间1小时
    },

    // 加密配置
    encryption: {
        key: process.env.ENCRYPTION_KEY,
        algorithm: 'aes-256-cbc',
        keyLength: 32
    },

    // 速率限制配置
    rateLimit: {
        windowMs: 60000, // 1分钟
        maxRequests: 100, // 最大请求数
        message: '请求过于频繁，请稍后再试'
    },

    // 文件上传配置
    upload: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]
    },

    // 会话配置
    session: {
        secret: process.env.SESSION_SECRET || 'your-secret-key',
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000 // 24小时
        }
    }
};

module.exports = securityConfig; 