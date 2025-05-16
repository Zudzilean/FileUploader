# 文件上传与查看系统

一个基于React和Node.js的文件上传和处理系统，支持多种文件格式的上传、查看和管理，并集成了AI驱动的文档摘要功能。

## 功能特点

### 前端功能
- 拖放文件上传区域
- 支持多文件选择和上传
- 实时上传进度显示
- 文件类型验证（支持txt、md、pdf、docx）
- 文件列表管理和内容查看
- AI文档摘要显示
- 手动触发摘要生成
- 文件删除功能
- 响应式设计，适配不同设备

### 后端功能
- 文件上传和存储
- 文件内容读取和解析
- AI驱动的文档摘要生成
- 支持多种文件格式处理：
  - 文本文件(txt)直接读取
  - Markdown文件(md)直接读取
  - PDF文件解析为文本
  - Word文档(docx)解析为文本
- 异步任务队列处理
- 文件安全验证
- 文件删除功能

### AI摘要功能
- 自动生成文档摘要
- 摘要状态实时跟踪
- 支持手动重新生成摘要
- 摘要历史记录保存

## 技术栈

### 前端
- React.js
- Axios (HTTP请求)
- React-Dropzone (文件拖放功能)
- CSS3 (样式和动画)

### 后端
- Node.js
- Express.js (Web服务器)
- MongoDB (数据库存储)
- Mongoose (MongoDB对象建模)
- Multer (文件上传处理)
- pdf-parse (PDF文件解析)
- mammoth (Word文档解析)
- OpenAI API (AI摘要生成)
- Bull (任务队列管理)
- Redis (队列存储)
- dotenv (环境变量管理)

## AI摘要功能设置

1. 确保已安装Redis并运行
2. 在backend/.env文件中添加OpenAI API密钥：
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```
3. 配置摘要生成参数（可选）：
   ```
   SUMMARY_MAX_LENGTH=300  # 摘要最大长度
   ```

## 使用说明

### 基本使用
1. 上传文件后，系统会自动解析内容并生成摘要
2. 在文件查看界面可以查看AI生成的摘要
3. 点击"生成摘要"按钮可以手动触发摘要生成
4. 摘要状态会实时更新(等待处理/生成中/已完成/失败)

### 高级功能
- 摘要生成过程使用异步队列处理，不会阻塞主线程
- 系统会保存生成的摘要，下次查看时可直接显示
- 支持重新生成摘要以获取更新版本

## 项目结构

```
FileUploader/
├── frontend/             # 前端React应用
│   ├── public/           # 静态资源
│   └── src/              # 源代码
│       ├── components/   # React组件
│       │   ├── FileUploader.js  # 文件上传组件
│       │   └── FileViewer.js    # 文件查看组件
│       ├── App.js        # 主应用组件
│       └── App.css       # 应用样式
├── backend/              # 后端Node.js应用
│   ├── server.js         # 服务器入口文件
│   ├── uploads/          # 上传文件存储目录
│   └── .env              # 环境变量配置
└── README.md             # 项目说明文档
```

## 安装和运行

### 前提条件
- Node.js (v14+)
- npm 或 yarn

### 后端设置
1. 进入后端目录
   ```bash
   cd backend
   ```

2. 安装依赖
   ```bash
   npm install
   ```

3. 创建.env文件（或使用已有的）
   ```
   PORT=5000
   MAX_FILE_SIZE=10485760  # 10MB in bytes
   UPLOAD_DIR=uploads
   ```

4. 启动服务器
   ```bash
   # 开发模式（自动重启）
   npm run dev
   
   # 生产模式
   npm start
   ```

### 前端设置
1. 进入前端目录
   ```bash
   cd frontend
   ```

2. 安装依赖
   ```bash
   npm install
   ```

3. 启动开发服务器
   ```bash
   npm start
   ```

4. 构建生产版本
   ```bash
   npm run build
   ```

## 使用指南

1. 启动后端和前端服务器
2. 打开浏览器访问 `http://localhost:3000`
3. 使用拖放区域或"浏览文件"按钮选择文件
4. 点击"上传文件"按钮上传选中的文件
5. 上传完成后，文件将显示在右侧的文件列表中
6. 点击文件名查看文件内容
7. 使用删除按钮可以删除不需要的文件

## 注意事项

- 系统目前支持的文件类型：txt、md、pdf、docx
- 单个文件大小限制为10MB
- 文件内容查看功能针对不同文件类型有不同的处理方式

## 未来改进计划

- 添加用户认证系统
- 集成更高级的AI模型来处理文档内容
- 添加文件搜索功能
- 支持更多文件格式
- 添加文件分类和标签功能