# 文件上传、内容解析与格式转换系统

一个基于 Node.js 和 React 的文件上传与格式转换系统，支持多种文件格式的上传、内容查看、AI 摘要生成与格式转换导出。

## 功能特点

- 支持多种文件格式（TXT、MD、PDF、DOCX、XLSX、XLS）
- 文件内容自动解析与展示
- 使用 DeepSeek AI 生成文档摘要
- 文件格式智能转换（仅显示支持的目标格式，且不会出现与原格式相同的选项）
- 转换成功后自动弹出"保存为"窗口，用户可自选保存路径
- 文件列表管理与删除
- 响应式设计，支持移动端

## 操作步骤

1. 访问 `http://localhost:3000` 打开应用
2. 点击左侧 "+" 按钮上传支持的文件（如 txt、md、pdf、docx、xlsx）
3. 点击文件名可查看内容或生成智能摘要
4. 点击右上角 "转换" 按钮，可将文件导出为其他格式（仅显示支持的目标格式）
5. 转换成功后，浏览器会自动弹出"保存为"窗口，选择本地保存路径
6. 如需每次选择保存位置，请在浏览器设置中开启"下载前询问保存位置"

## 注意事项

- 仅支持有意义的格式转换（如 txt 转 json，xlsx 转 csv 等），不会出现"txt 转 txt"这类无意义选项
- 单个文件大小限制为 10MB
- 一次最多可上传 10 个文件
- 摘要生成可能需要一些时间，请耐心等待
- 如果摘要生成失败，可以点击"生成摘要"按钮重试

## 技术栈

### 前端
- React (用户界面)
- Axios (HTTP 请求)
- CSS/自定义样式

### 后端
- Node.js (运行环境)
- Express (Web 框架)
- MongoDB (数据库存储)
- Mongoose (MongoDB对象建模)
- Bull (任务队列)
- Redis (队列存储)
- Multer (文件上传)
- DeepSeek API (AI摘要生成)
- xlsx, csv-writer, pdf-parse, mammoth 等格式处理库

## 安装与启动

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
在 `backend` 目录下创建 `.env` 文件，参考原说明。

4. 启动服务
```bash
# 启动后端服务
cd backend
npm start

# 启动前端服务
cd ../frontend
npm start
```

## 项目结构
```
fileuploader/
├── backend/           # 后端代码
├── frontend/          # 前端代码
└── README.md          # 项目说明
```

## 常见问题

- 文件上传失败：检查文件大小、格式、网络
- 转换失败：请确认目标格式支持，或查看后端日志
- 下载未弹窗：请在浏览器设置中开启"下载前询问保存位置"

## 贡献指南

欢迎提交 Issue 和 Pull Request。

## 许可证

MIT License

## 清理缓存、依赖和上传文件

如需释放空间或重置开发环境，可一键删除所有依赖、缓存和上传文件：

### Linux/macOS 命令
```bash
rm -rf node_modules backend/node_modules frontend/node_modules \
       backend/uploads uploads \
       dist build coverage .cache .temp .tmp \
       backend/dist backend/build backend/coverage backend/.cache backend/.temp backend/.tmp \
       frontend/dist frontend/build frontend/coverage frontend/.cache frontend/.temp frontend/.tmp
```

### Windows PowerShell 命令
```powershell
Remove-Item -Recurse -Force node_modules, .\backend\node_modules, .\frontend\node_modules
Remove-Item -Recurse -Force .\backend\uploads, .\uploads
Remove-Item -Recurse -Force dist, build, coverage, .cache, .temp, .tmp, \
  .\backend\dist, .\backend\build, .\backend\coverage, .\backend\.cache, .\backend\.temp, .\backend\.tmp, \
  .\frontend\dist, .\frontend\build, .\frontend\coverage, .\frontend\.cache, .\frontend\.temp, .\frontend\.tmp
```

> ⚠️ 删除操作不可恢复，请确保没有重要数据需要保留。