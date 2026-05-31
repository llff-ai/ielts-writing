# Vercel 一键部署指南（中文）

本项目已内置 Vercel 构建配置，导入仓库后可直接部署。

## 1. 部署前准备

- 一个 GitHub 账号
- 一个 Vercel 账号（可用 GitHub 登录）
- 一个可用的 PostgreSQL 数据库（推荐 Neon / Supabase / Railway）
- 一枚 DeepSeek API Key

## 2. 推送代码到 GitHub

在项目根目录执行：

```bash
git init
git add .
git commit -m "feat: ready for vercel deploy"
git branch -M main
git remote add origin <你的仓库地址>
git push -u origin main
```

## 3. 在 Vercel 导入项目

1. 打开 Vercel 控制台
2. 点击 `Add New Project`
3. 选择你刚刚的 GitHub 仓库并导入
4. Vercel 会自动识别为 Next.js 项目

## 4. 配置环境变量（必须）

在 Vercel 项目设置中添加：

- `DATABASE_URL`：你的 PostgreSQL 连接串
- `NEXTAUTH_URL`：你的线上域名（例如 `https://your-app.vercel.app`）
- `NEXTAUTH_SECRET`：随机字符串（建议至少 32 位）
- `DEEPSEEK_API_KEY`：你的 DeepSeek 密钥

## 5. 一键部署

点击 `Deploy` 即可。

本仓库已配置：

- `vercel.json`：使用 `npm run vercel-build`
- `vercel-build` 脚本：自动执行
  - `prisma generate`
  - `prisma db push`
  - `next build`

## 6. 获取分享网址

部署成功后，Vercel 会给你一个可公开访问的网址：

`https://你的项目名.vercel.app`

把这个网址发给别人即可访问。

## 7. 首次部署后建议

- 到 `Settings -> Domains` 绑定自定义域名（可选）
- 确认 `NEXTAUTH_URL` 已改为最终线上域名
- 在站点里完成一次注册、提交、结果页流程验证

