# 发布说明

## Version 1.0.0 — MVP Release

**发布日期**: 2025年5月9日

### 概述

Memory Story Generator MVP 版本发布！这是一个 AI 驱动的照片故事生成工具，可以将照片集合转化为具有情感共鸣的叙事故事板。

### 核心功能

#### 1. 照片上传
- 拖放上传多张照片
- 文件选择器批量选择
- 支持 JPG、PNG、HEIC 格式
- 缩略图预览网格
- 删除单张照片

#### 2. AI 特征提取
- 集成 Gemini 2.0 Flash Vision API
- 提取 30+ 维度特征：
  - 场景基础信息（地点、场景类型）
  - 时间维度（时段、季节、天气）
  - 人物信息（人数、表情、姿态）
  - 情感与氛围
  - 活动与事件
  - 物体与元素
  - 视觉特征（颜色、光线、构图）
- 并行处理，支持进度回调

#### 3. 特征审核界面
- 照片标签页展示所有照片
- 每张照片展示提取的特征
- 可编辑任意特征字段
- 实时更新 AI 分析结果

#### 4. 故事线生成
- 自动分析特征空间分布
- 智能选择最佳叙事结构：
  - 时间线（chronological）
  - 情感线（emotional）
  - 主题线（thematic）
- AI 推荐叙事风格
- 支持自定义风格描述

#### 5. 故事板生成
- 每张照片独立分镜描述
- 自动分配时长
- 建议转场效果
- 支持多种叙事风格：
  - 温馨家庭
  - 文艺旅行
  - 欢乐聚会
  - 纪录片风格
  - 幽默风趣

#### 6. 导出功能
- **Markdown** — 带 frontmatter 元数据
- **JSON** — 结构化数据，便于程序处理
- **纯文本** — 人工审阅友好
- 复制到剪贴板
- 浏览器下载

#### 7. 重新生成
- 更新叙事脚本
- 保持当前照片顺序
- 生成新的叙事版本

### 技术亮点

- **Next.js 16.2.6** + React 19
- **Tailwind CSS 4** 现代化 UI
- **TypeScript** 类型安全
- **80.98% 测试覆盖率**
- **Vitest** 单元测试
- **React Testing Library** 组件测试

### 已知限制

- 照片未持久化存储（页面刷新会丢失）
- 无上传错误提示
- 无文件处理进度指示器
- 不支持照片拖拽排序

### 系统要求

- Node.js 18+
- 现代浏览器（Chrome、Edge、Safari、Firefox）
- Gemini API Key

### 安装与运行

```bash
# 安装依赖
npm install

# 配置 API Key
echo "NEXT_PUBLIC_GEMINI_API_KEY=your_key" > .env.local

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
npm start
```

### 路线图

**v1.1.0（计划中）**
- IndexedDB 持久化
- 上传错误处理
- 文件处理进度条
- 照片拖拽排序

**v2.0.0（未来）**
- 音乐推荐
- 旁白生成
- 多故事板模板
- 云服务导入（Google Photos、iCloud）

---

感谢使用 Memory Story Generator！
