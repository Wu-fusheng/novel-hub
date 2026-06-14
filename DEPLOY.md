# 📖 Novel Hub - 小说托管平台

一个基于 Next.js + Supabase 的小说阅读与托管平台，支持作者管理和读者注册登录阅读。

## ✨ 功能特性

### 读者端
- 📚 小说库浏览（网格布局，响应式设计）
- 📖 沉浸式阅读器（字体大小调节、4种主题切换）
- 📋 侧边栏章节目录
- ✅ 阅读进度自动记录
- 📱 完美适配手机/平板/电脑
- 🔐 用户注册/登录系统

### 管理后台
- 📊 仪表盘（小说统计、最近更新）
- ✏️ 小说 CRUD（创建、编辑、删除、发布/草稿）
- 📝 章节 CRUD（创建、编辑、排序、发布控制）
- 📈 字数自动统计
- 🔒 权限控制（admin/author 角色才能访问）

## 🛠 技术栈

| 技术 | 用途 |
|------|------|
| [Next.js 16](https://nextjs.org/) | 全栈 React 框架 |
| [Supabase](https://supabase.com/) | 数据库 + 认证 + 实时订阅 |
| [Tailwind CSS](https://tailwindcss.com/) | 样式框架 |
| [TypeScript](https://www.typescriptlang.org/) | 类型安全 |
| [Vercel](https://vercel.com/) | 免费部署托管 |

## 📦 项目结构

```
novel-hub/
├── src/
│   ├── app/
│   │   ├── admin/              # 管理后台
│   │   │   ├── layout.tsx      # 后台布局（权限校验）
│   │   │   ├── nav.tsx         # 后台导航
│   │   │   ├── page.tsx        # 仪表盘
│   │   │   └── novels/         # 小说管理
│   │   │       ├── page.tsx    # 小说列表
│   │   │       ├── new/        # 新建小说
│   │   │       └── [id]/       # 编辑小说 + 章节管理
│   │   ├── auth/               # 认证
│   │   │   ├── login/          # 登录
│   │   │   ├── register/       # 注册
│   │   │   ├── callback/       # OAuth 回调
│   │   │   └── logout/         # 登出
│   │   ├── novel/[id]/         # 小说详情 + 章节阅读
│   │   ├── novels/             # 小说库
│   │   ├── layout.tsx          # 全局布局
│   │   ├── page.tsx            # 首页
│   │   └── globals.css         # 全局样式
│   ├── components/
│   │   └── Navbar.tsx          # 导航栏
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts       # 浏览器端客户端
│   │   │   ├── server.ts       # 服务端客户端
│   │   │   └── middleware.ts    # 中间件辅助
│   │   └── types.ts            # TypeScript 类型定义
│   └── middleware.ts           # Next.js 中间件
├── supabase-schema.sql          # 数据库迁移 SQL
├── .env.local                   # 环境变量
└── package.json
```

## 🚀 部署指南

### 第一步：创建 Supabase 项目

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 点击 **New Project**，创建一个新项目
3. 记下项目的 **Project URL** 和 **anon public key**

### 第二步：执行数据库迁移

1. 在 Supabase Dashboard 中，进入 **SQL Editor**
2. 复制 `supabase-schema.sql` 文件的全部内容
3. 粘贴到 SQL Editor 中并点击 **Run**
4. 这将创建所有必要的表（profiles、novels、chapters、reading_progress）和 RLS 策略

### 第三步：配置 Supabase Auth

1. 在 Supabase Dashboard 中，进入 **Authentication → URL Configuration**
2. 设置 **Site URL** 为你的 Vercel 部署域名（如 `https://your-app.vercel.app`）
3. 在 **Redirect URLs** 中添加：
   - `https://your-app.vercel.app/auth/callback`

### 第四步：推送到 GitHub

```bash
cd novel-hub
git init
git add .
git commit -m "Initial commit: Novel Hub"
git remote add origin https://github.com/你的用户名/novel-hub.git
git push -u origin main
```

### 第五步：部署到 Vercel

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 **Add New → Project**
3. 导入你的 GitHub 仓库 `novel-hub`
4. 在 **Environment Variables** 中添加：
   - `NEXT_PUBLIC_SUPABASE_URL` = 你的 Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = 你的 Supabase anon public key
   - `SUPABASE_SERVICE_ROLE_KEY` = 你的 Supabase service role key
5. 点击 **Deploy**

### 第六步：设置管理员账户

1. 通过网站注册一个新账户
2. 在 Supabase Dashboard 中，进入 **Table Editor → profiles**
3. 找到你的用户记录，将 `role` 字段改为 `admin` 或 `author`
4. 刷新网站，你将看到管理后台入口

## 📖 使用说明

### 添加小说
1. 登录后，点击导航栏的 **管理后台**
2. 点击 **新建小说**，填写标题、简介、类型等信息
3. 创建后，进入小说编辑页面添加章节
4. 勾选 **发布** 后，读者即可在小说库中看到

### 阅读小说
1. 注册/登录后，浏览小说库
2. 点击小说封面进入详情页
3. 选择章节开始阅读
4. 阅读器支持：字体大小调节、主题切换、侧边栏目录

## 📄 License

MIT
