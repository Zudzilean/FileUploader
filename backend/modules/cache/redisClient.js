/**
 * @file redisClient.js
 * @author Yundi Zhang
 * @date 2024-03-21
 * @description Redis 客户端模块
 * @dependencies redis
 */

const Redis = require('redis');
require('dotenv').config();

class RedisClient {
    constructor() {
        this.client = null;
        this.isConnected = false;
    }

    /**
     * 初始化 Redis 客户端
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            this.client = Redis.createClient({
                url: process.env.REDIS_URL || 'redis://localhost:6379',
                password: process.env.REDIS_PASSWORD
            });

            this.client.on('error', (err) => {
                console.error('Redis 客户端错误:', err);
                this.isConnected = false;
            });

            this.client.on('connect', () => {
                console.log('Redis 连接成功');
                this.isConnected = true;
            });

            await this.client.connect();
        } catch (error) {
            console.error('Redis 初始化失败:', error);
            throw error;
        }
    }

    /**
     * 设置缓存
     * @param {string} key - 缓存键
     * @param {any} value - 缓存值
     * @param {number} ttl - 过期时间（秒）
     * @returns {Promise<void>}
     */
    async set(key, value, ttl = 3600) {
        try {
            const stringValue = JSON.stringify(value);
            await this.client.set(key, stringValue, { EX: ttl });
        } catch (error) {
            console.error('Redis 设置缓存失败:', error);
            throw error;
        }
    }

    /**
     * 获取缓存
     * @param {string} key - 缓存键
     * @returns {Promise<any>}
     */
    async get(key) {
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('Redis 获取缓存失败:', error);
            throw error;
        }
    }

    /**
     * 删除缓存
     * @param {string} key - 缓存键
     * @returns {Promise<void>}
     */
    async del(key) {
        try {
            await this.client.del(key);
        } catch (error) {
            console.error('Redis 删除缓存失败:', error);
            throw error;
        }
    }

    /**
     * 关闭连接
     * @returns {Promise<void>}
     */
    async close() {
        if (this.client) {
            await this.client.quit();
            this.isConnected = false;
        }
    }
}

module.exports = new RedisClient(); 