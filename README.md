# 文件上传与AI摘要系统

一个基于 Node.js 和 React 的文件上传系统，支持文件上传、内容解析和 AI 摘要生成功能。

## 功能特点

- 支持多种文件格式（TXT、MD、PDF、DOCX）
- 文件内容自动解析
- 使用 DeepSeek AI 生成文档摘要
- 实时显示上传进度
- 文件列表管理
- 响应式设计，支持移动端

## 技术栈

### 前端
- React (用户界面)
- Axios (HTTP 请求)
- TailwindCSS (样式)

### 后端
- Node.js (运行环境)
- Express (Web 框架)
- MongoDB (数据库存储)
- Mongoose (MongoDB对象建模)
- Bull (任务队列)
- Redis (队列存储)
- Multer (文件上传)
- DeepSeek API (AI摘要生成)

## 环境要求

- Node.js 18+
- MongoDB 4.4+
- Redis 6+

## 安装步骤

1. 克隆项目
```bash
git clone [项目地址]
cd fileuploader
```

2. 安装依赖
```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

3. 配置环境变量
在 `backend` 目录下创建 `.env` 文件：
```
# 服务器配置
PORT=5000
NODE_ENV=development

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/fileuploader

# 文件上传配置
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads

# DeepSeek API配置
DEEPSEEK_API_KEY=your_api_key
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions
```

4. 启动服务
```bash
# 启动后端服务
cd backend
npm start

# 启动前端服务
cd ../frontend
npm start
```

## 使用说明

1. 访问 `http://localhost:3000` 打开应用
2. 点击"选择文件"或拖拽文件到上传区域
3. 选择要上传的文件（支持 TXT、MD、PDF、DOCX 格式）
4. 点击"上传"按钮开始上传
5. 上传完成后，系统会自动开始生成摘要
6. 在文件列表中查看文件信息和摘要

## 注意事项

- 单个文件大小限制为 10MB
- 一次最多可上传 10 个文件
- 摘要生成可能需要一些时间，请耐心等待
- 如果摘要生成失败，可以点击"生成摘要"按钮重试

## 开发说明

### 项目结构
```
fileuploader/
├── backend/           # 后端代码
│   ├── models/       # 数据模型
│   ├── services/     # 业务逻辑
│   ├── queues/       # 任务队列
│   ├── utils/        # 工具函数
│   └── server.js     # 服务器入口
├── frontend/         # 前端代码
│   ├── src/         # 源代码
│   └── public/      # 静态资源
└── README.md        # 项目说明
```

### 开发命令
```bash
# 后端开发
cd backend
npm run dev

# 前端开发
cd frontend
npm start
```

### 依赖管理
项目使用 npm 管理依赖，主要依赖包括：

#### 后端依赖
- express: Web 框架
- mongoose: MongoDB 对象建模
- multer: 文件上传处理
- bull: 任务队列
- axios: HTTP 客户端
- dotenv: 环境变量管理

#### 前端依赖
- react: 用户界面库
- axios: HTTP 客户端
- tailwindcss: 样式框架

完整的依赖列表请查看 `package.json` 文件。安装依赖时，只需运行 `npm install` 即可。

## 常见问题

1. 文件上传失败
   - 检查文件大小是否超过限制
   - 确认文件格式是否支持
   - 检查网络连接

2. 摘要生成失败
   - 确认 DeepSeek API 密钥是否正确
   - 检查网络连接
   - 查看服务器日志

3. 数据库连接失败
   - 确认 MongoDB 服务是否运行
   - 检查数据库连接字符串

4. 依赖安装问题
   - 确保 Node.js 版本正确（18+）
   - 删除 node_modules 目录后重新安装
   - 检查网络连接是否正常

## 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License