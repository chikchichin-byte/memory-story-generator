# Memory Story Generator

> AI驱动的照片故事生成工具 — 将照片集合转化为具有情感共鸣的叙事故事板

## 功能特性

- 📸 **批量照片上传** — 拖放或文件选择，支持 JPG/PNG/HEIC 格式
- 🤖 **AI特征提取** — Gemini 2.0 Flash Vision 提取 30+ 维度特征
- ✏️ **特征审核** — 查看和编辑 AI 提取的特征信息
- 📖 **智能故事线** — 自动分析生成最佳叙事结构（时间/情感/主题）
- 🎬 **分镜脚本** — AI 生成的电影级分镜描述，支持多种风格
- 📤 **多格式导出** — Markdown（含 frontmatter）、JSON、纯文本
- 🔄 **重新生成** — 更新叙事脚本，探索不同叙事风格

## 快速开始

### 环境要求

- Node.js 18+
- npm / yarn / pnpm / bun

### 安装

```bash
# 克隆项目
git clone <repository-url>
cd demo-app

# 安装依赖
npm install
```

### 配置

创建 `.env.local` 文件并配置 Gemini API Key：

```env
GEMINI_API_KEY=your_api_key_here
```

获取 API Key: https://ai.google.dev/

**注意**：本项目使用服务端 API 代理，你的 API Key 不会暴露给用户。详见 [部署指南](DEPLOYMENT.md)。

### 运行

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 运行生产版本
npm start
```

访问 [http://localhost:3000](http://localhost:3000)

## 技术栈

- **框架**: Next.js 16.2.6 + React 19
- **样式**: Tailwind CSS 4
- **测试**: Vitest + React Testing Library
- **AI**: Gemini 2.0 Flash Vision API

## 测试

```bash
# 运行测试
npm test

# 测试覆盖率
npm run test:run -- --coverage

# 测试 UI
npm run test:ui
```

当前测试覆盖率：**80.98%**

## 项目结构

```
src/
├── app/
│   └── page.tsx           # 主应用页面
├── components/
│   └── photo-upload/      # 照片上传组件
├── lib/
│   ├── feature-space/     # 特征空间数据模型
│   ├── feature-extraction/# AI 特征提取
│   ├── story-arc/         # 故事线生成
│   ├── storyboard/        # 故事板生成与导出
│   └── types.ts           # 类型定义
└── middleware.ts          # API 路由
```

## 使用流程

1. **上传照片** — 拖放或选择多张照片
2. **AI 分析** — 自动提取时间、地点、情感、事件等特征
3. **审核编辑** — 查看 AI 提取结果，可手动修正
4. **生成故事** — 选择叙事风格，生成分镜脚本
5. **导出分享** — 导出为 Markdown/JSON/纯文本

## 部署

想要让别人通过网页访问你的应用？查看 [部署指南](DEPLOYMENT.md)

支持的平台：
- **Vercel**（推荐）— 一键部署，自动 HTTPS
- Netlify
- Railway
- 自托管

## 待办事项

- [ ] IndexedDB 持久化存储
- [ ] 上传错误提示
- [ ] 文件处理进度指示器
- [ ] 拖拽排序照片
- [ ] 更多叙事风格模板

详细计划请查看 [TODO.md](TODO.md)

## License

MIT
