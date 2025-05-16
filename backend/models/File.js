const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  originalName: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  content: {
    type: String,
    required: false
  },
  summary: {
    type: String,
    required: false
  },
  summaryStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  summaryDate: {
    type: Date,
    required: false
  }
});

// 添加文本索引以便搜索
FileSchema.index({ originalName: 'text', content: 'text', summary: 'text' });

module.exports = mongoose.model('File', FileSchema);