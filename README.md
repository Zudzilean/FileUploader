# 文件管理与格式转换工具

## 项目简介
本项目为支持多格式文件上传、内容查看、AI智能摘要、格式转换的全栈应用，前端基于 React，后端基于 Node.js + Express + Redis。

---

## 目录结构
```
FileUploader/
├── backend/         # 后端Node服务
├── frontend/        # 前端React项目
├── tests/           # 测试用例
├── README.md        # 项目说明
└── ...
```

---

## 环境变量配置（backend/.env）
```
PORT=5000
NODE_ENV=development
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads
REDIS_HOST=localhost
REDIS_PORT=6379
DEEPSEEK_API_KEY=你的DeepSeek密钥
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions
SUMMARY_MAX_LENGTH=300
```

---

## 启动方式

### 1. 后端
```bash
cd backend
npm install
npm run dev
```

### 2. 前端
```bash
cd frontend
npm install
npm start
```

前端默认代理到 `http://localhost:5000`。

---

## 主要API接口说明

### 文件上传
- `POST /fileuploader/upload`
  - form-data: `files`（支持多文件）
  - 返回：文件元信息数组

### 文件列表
- `GET /fileuploader/files`
  - 返回：所有已上传文件的元信息

### 文件详情
- `GET /fileuploader/files/:id`
  - 返回：指定文件的内容、元数据、摘要等

### 生成/轮询AI摘要
- `POST /fileuploader/files/:id/summary`  # 主动触发摘要生成
- `GET /fileuploader/files/:id/summary`   # 获取摘要内容和状态

### 文件格式转换
- `POST /fileuploader/convert/:id`
  - body: `{ targetFormat: 'txt'|'csv'|'json' }`
  - 返回：转换后文件（二进制流，自动下载）

---

## 常见问题

- **上传文件名乱码？**
  - 已修复，后端自动处理编码。
- **摘要404或轮询报错？**
  - 请确保后端已实现 `/fileuploader/files/:id/summary` 的 GET/POST 路由。
- **转换接口404？**
  - 前端请求路径需为 `/fileuploader/convert/:id`。
- **AI摘要失败？**
  - 检查 DeepSeek API Key 是否正确，额度是否充足。
- **Redis未启动？**
  - 请确保本地或远程 Redis 服务已启动。

---

## 贡献&维护
- 作者：Yundi Zhang
- 日期：2025-05-23
- 如有问题请提 issue 或联系作者。