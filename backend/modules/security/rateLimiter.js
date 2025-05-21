/**
 * @file rateLimiter.js
 * @author Yundi Zhang
 * @date 2024-03-21
 * @description 速率限制中间件
 * @dependencies redis
 */

const redisClient = require('../cache/redisClient');

class RateLimiter {
    constructor(options = {}) {
        this.windowMs = options.windowMs || 60000; // 时间窗口，默认1分钟
        this.maxRequests = options.maxRequests || 100; // 最大请求数，默认100
        this.message = options.message || '请求过于频繁，请稍后再试';
    }

    /**
     * 中间件处理函数
     * @returns {Function} Express中间件
     */
    middleware() {
        return async (req, res, next) => {
            const ip = req.ip;
            const key = `ratelimit:${ip}`;

            try {
                const requests = await redisClient.incr(key);
                
                if (requests === 1) {
                    await redisClient.client.expire(key, this.windowMs / 1000);
                }

                if (requests > this.maxRequests) {
                    return res.status(429).json({
                        error: this.message,
                        retryAfter: Math.ceil(this.windowMs / 1000)
                    });
                }

                next();
            } catch (error) {
                console.error('速率限制错误:', error);
                next();
            }
        };
    }
}

module.exports = RateLimiter; 