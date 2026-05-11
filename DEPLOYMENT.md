# 部署指南

本文档说明如何将 Memory Story Generator 部署到 Vercel，让其他人可以通过网页访问你的应用。

---

## 部署架构说明

```
用户浏览器 → 你的网站 (Vercel) → Next.js API Routes → Gemini API
                                      ↑
                                 隐藏你的 API Key
```

**关键点**：
- ✅ API Key 存储在服务端环境变量中
- ✅ 用户无法看到你的 API Key
- ✅ 所有 AI 请求通过你的后端代理

---

## 方法 1：通过 Vercel 网站（推荐）

### 步骤 1：准备代码

1. 将代码推送到 GitHub
2. 确保仓库包含以下文件：
   - `package.json`
   - `next.config.ts`
   - `vercel.json`

### 步骤 2：在 Vercel 导入项目

1. 访问 [vercel.com](https://vercel.com)
2. 登录或注册账号
3. 点击 **"Add New"** → **"Project"**
4. 导入你的 GitHub 仓库

### 步骤 3：配置环境变量

在 Vercel 项目设置中添加环境变量：

1. 进入项目 → **Settings** → **Environment Variables**
2. 添加以下变量：

| 名称 | 值 | 环境 |
|------|-----|------|
| `GEMINI_API_KEY` | 你的 Gemini API Key | Production, Preview, Development |

### 步骤 4：部署

点击 **"Deploy"** 按钮，等待部署完成（约 1-2 分钟）

部署完成后，你会得到一个 URL，如：`https://your-project.vercel.app`

---

## 方法 2：通过 Vercel CLI

### 安装 Vercel CLI

```bash
npm i -g vercel
```

### 登录

```bash
vercel login
```

### 部署

```bash
cd d:/Dev/demo-app
vercel
```

按照提示操作：
1. 选择链接到现有项目或创建新项目
2. 确认项目设置
3. 添加环境变量 `GEMINI_API_KEY`
4. 等待部署完成

---

## 环境变量说明

### 开发环境

创建 `.env.local` 文件：

```env
GEMINI_API_KEY=your_api_key_here
```

### 生产环境 (Vercel)

在 Vercel 项目设置中配置：
- **Settings** → **Environment Variables**
- 添加 `GEMINI_API_KEY`

### ⚠️ 安全注意事项

| 变量类型 | 是否安全 | 说明 |
|---------|---------|------|
| `GEMINI_API_KEY` | ✅ 安全 | 仅服务端可用，用户无法看到 |
| `NEXT_PUBLIC_GEMINI_API_KEY` | ❌ 不安全 | 会暴露给所有用户 |

**本项目只使用 `GEMINI_API_KEY`（服务端变量）**

---

## 部署后测试

1. 访问你的 Vercel URL
2. 上传几张照片测试功能
3. 检查浏览器控制台，确保没有 API Key 泄露

---

## 更新部署

代码更新后，Vercel 会自动重新部署：

1. 推送代码到 GitHub
2. Vercel 自动检测并部署
3. 约 1-2 分钟后新版本上线

---

## 费用说明

### Vercel
- **免费套餐**：足够个人使用
  - 100GB 带宽/月
  - 无限部署
  - 自动 HTTPS
  - 全球 CDN

### Gemini API
- **免费套餐**：
  - 每天请求数有限
  - 适合测试和少量使用
- **付费套餐**：按使用量计费

---

## 常见问题

### Q: 部署后功能无法使用？
**A**: 检查环境变量是否正确配置：
1. Vercel 项目设置中是否添加了 `GEMINI_API_KEY`
2. API Key 是否有效

### Q: 如何查看部署日志？
**A**:
1. 进入 Vercel 项目
2. 点击 **Deployments** → 选择最新部署 → **View Logs**

### Q: 可以绑定自己的域名吗？
**A**: 可以！
1. 进入项目 → **Settings** → **Domains**
2. 添加你的域名
3. 按提示配置 DNS

### Q: 如何限制 API 使用量？
**A**:
1. 在 API 路由中添加速率限制
2. 使用 Vercel Edge Config
3. 添加用户认证系统

---

## 其他部署平台

### Netlify

创建 `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[functions]
  node_bundler = "esbuild"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

然后连接 Git 仓库并部署。

### Railway

1. 访问 [railway.app](https://railway.app)
2. 新建项目 → Deploy from GitHub repo
3. 添加环境变量 `GEMINI_API_KEY`
4. 部署

---

## 下一步

部署完成后，你可以考虑：
- 添加用户认证（NextAuth.js）
- 添加数据库存储用户数据
- 添加分析和监控
- 自定义域名
