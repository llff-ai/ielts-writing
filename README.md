# 基于RAG的雅思写作助教（MVP）

一个面向雅思写作训练场景的全栈 Web 应用，覆盖从选题、提交作文、AI 批改到历史复盘的完整流程。

## 在线体验

- 生产环境链接：<https://ielts-writing-one-woad.vercel.app?_vercel_share=haOxcBnRXpIIByV9QZoI2Vl85Q8jsioy>

## Github地址
- https://github.com/llff-ai/ielts-writing.git

## 目录

- [功能特性](#功能特性)
- [页面展示](#页面展示)
- [系统流程](#系统流程)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [本地运行](#本地运行)
- [常用命令](#常用命令)

## 功能特性

- 邮箱注册/登录（NextAuth Credentials）
- 题库选题 + 自定义题目输入
- 作文提交与实时字数统计
- RAG 召回（范文 + 参考观点）
- 结构化批改结果（总评、分项评分、句级建议、改写示例、行动建议）
- 历史记录与报告重生成

## 页面展示

### 首页
![首页](docs/images/screenshot-home.png)

### 提交页
![提交页](docs/images/screenshot-submit.png)

### 结果页
![结果页](docs/images/screenshot-result.png)

## 系统流程

```mermaid
flowchart LR
    A["用户登录"] --> B["提交题目与作文"]
    B --> C["保存 EssaySubmission"]
    C --> D["RAG 召回：范文 + 观点知识块"]
    D --> E["构建 Prompt"]
    E --> F["DeepSeek 生成批改结果"]
    F --> G["保存 FeedbackReport"]
    G --> H["结果页展示"]
    H --> I["历史记录 / 重新生成"]
```

## 技术栈

- 前端：Next.js 14（App Router）+ React 18 + Tailwind CSS
- 后端：Next.js Route Handlers
- 认证：next-auth v5
- 数据库：PostgreSQL + Prisma
- AI：openai SDK（DeepSeek 兼容接口）

## 项目结构

```text
.
├─ app/                      # 页面与 API 路由
├─ components/               # 页面组件
├─ lib/                      # auth / rag / report / model client
├─ prisma/
│  ├─ schema.prisma
│  └─ seed.ts
├─ data/                     # 题库、范文、观点库 JSON
├─ scripts/
│  ├─ e2e-smoke.mjs
│  └─ parse_knowledge_base.py
├─ docs/
│  └─ images/
├─ .env.example
└─ README.md
```

## 本地运行

1. 安装依赖

```bash
npm install
```

2. 配置环境变量

```bash
cp .env.example .env.local
```

3. 初始化数据库并导入种子数据

```bash
npm run prisma:push
npm run db:seed
```

4. 启动开发环境

```bash
npm run dev
```

访问地址：`http://localhost:3000`

## 常用命令

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run prisma:push
npm run db:seed
npm run e2e:smoke
```

