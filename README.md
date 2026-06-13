# Interview Flash — 面试刷题系统前端

基于 Vue 3 + TypeScript + Vite 5 构建的全栈面试刷题系统前端，包含题库练习、社区文章、实时通知、数据可视化等完整功能。

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.4 | 渐进式 JavaScript 框架 |
| TypeScript | 5.x | 类型安全 |
| Vite | 5.2 | 下一代前端构建工具 |
| Pinia | 2.1 | Vue 状态管理 |
| Vue Router | 4.3 | 路由管理 + 守卫 |
| Element Plus | 2.6 | Vue 3 UI 组件库 |
| Axios | 1.6 | HTTP 请求 |
| ECharts | 5.x | 数据可视化图表 |
| md-editor-v3 | 3.x | Markdown 编辑器（文章撰写） |
| @unhead/vue | SEO | 动态 OG 标签 |

## 设计系统

采用柔和粉蓝调色板（Pastel Powder-Blue），所有颜色通过 CSS 变量管理：

```css
/* 调色板 */
--powder-petal: #eddcd2;   /* 暖米色 */
--linen: #fff1e6;          /* 暖奶油 */
--soft-blush: #fde2e4;     /* 柔粉 */
--petal-frost: #fad2e1;    /* 玫瑰粉 */
--light-cyan: #c5dedd;     /* 浅青绿 */
--mint-cream: #dbe7e4;     /* 薄荷绿 */
--parchment: #f0efeb;      /* 暖灰白 */
--alice-blue: #d6e2e9;     /* 浅钢蓝 */
--pale-sky: #bcd4e6;       /* 中浅蓝 */
--powder-blue: #99c1de;    /* 蓝色（主交互色） */

/* 语义令牌 */
--color-interactive: var(--powder-blue);
--color-bg-secondary: var(--parchment);
--color-border: var(--alice-blue);
```

设计令牌定义在 `src/styles/variables.css`，全局覆盖 Element Plus 默认色。

## 项目结构

```
src/
├── api/index.ts                    # API 接口统一管理
├── components/                     # 公共组件
│   ├── Header.vue                  #   顶部导航栏 + 通知铃铛
│   ├── NotificationBell.vue        #   通知下拉面板（SSE 实时推送）
│   ├── ContributionHeatmap.vue     #   GitHub 风格贡献热力图
│   └── HeatmapCanvas.vue           #   热力图 Canvas 渲染
├── composables/
│   └── useQuestionHelpers.js       #   题型/难度共享逻辑
├── directives/
│   └── tilt.ts                     #   3D 倾斜效果指令
├── router/index.ts                 #   路由配置 + 守卫
├── stores/                         #   Pinia 状态管理
│   ├── user.ts                     #     用户状态（token, 登录）
│   └── app.ts                      #     全局状态（loading）
├── styles/
│   └── variables.css               #   设计令牌 + 全局样式
├── utils/
│   └── request.ts                  #   Axios 封装（JWT 拦截器）
├── views/                          #   页面组件
│   ├── Login.vue                   #     登录/注册
│   ├── Home.vue                    #     首页（统计 + 分类 + 热门）
│   ├── QuestionList.vue            #     题库列表（筛选 + 分页）
│   ├── QuestionDetail.vue          #     题目详情 + 答题
│   ├── Practice.vue                #     在线刷题（7 种题型）
│   ├── Statistics.vue              #     数据统计（ECharts）
│   ├── WrongQuestions.vue          #     错题本
│   ├── Profile.vue                 #     个人中心
│   ├── NotificationList.vue        #     通知列表
│   └── community/                  #     社区模块
│       ├── ArticleList.vue         #       文章列表
│       ├── ArticleDetail.vue       #       文章详情 + 评论
│       ├── ArticleCreate.vue       #       文章撰写（Markdown）
│       ├── SeriesList.vue          #       系列列表
│       ├── SeriesDetail.vue        #       系列详情
│       ├── AuthorProfile.vue       #       作者主页
│       ├── CommentItem.vue         #       评论组件（树形嵌套）
│       └── constants.js            #       渐变色常量
├── App.vue                         #   根组件
└── main.ts                         #   应用入口
```

## 页面功能

### 登录/注册 (Login)
- 用户名密码登录 + JWT 令牌
- 新用户注册（用户名/邮箱/昵称/密码）
- 记住密码 + 回车快速登录

### 首页 (Home)
- 学习统计卡片（题目数/掌握率/错题数/连续天数）
- 分类快捷入口
- 热门题目推荐
- 答题数据趋势图（ECharts）

### 题库列表 (QuestionList)
- 分类 + 难度筛选
- 关键词搜索
- 分页浏览
- 7 种题型标签（单选/多选/判断/填空/简答/编程/情景）

### 在线刷题 (Practice)
- 按分类/难度/题型筛选出题
- 全随机模式
- 7 种答题交互（单选/多选/判断/填空/简答/编程/情景）
- 上一题/下一题导航
- 查看答案 + 收藏
- 进度点阵导航

### 社区文章 (community/)
- 文章列表 + 话题筛选
- Markdown 编辑器撰写文章
- 文章详情 + 树形评论
- 点赞（原子计数）+ 收藏
- 文章系列管理

### 实时通知 (NotificationBell)
- SSE 实时推送新通知（Toast 弹出）
- 通知下拉面板（最新 5 条）
- 标记已读/全部已读
- 通知类型：评论、点赞、关注

### 个人中心 (Profile)
- 用户信息 + GitHub 风格贡献热力图
- 文章管理（发布/草稿）
- 学习统计 + 答题趋势

### 数据统计 (Statistics)
- 答题正确率趋势（ECharts 折线图）
- 分类分布（饼图）
- 文章浏览量趋势
- 粉丝增长趋势

## 启动项目

```bash
# 安装依赖
npm install

# 开发模式（端口 3000，API 代理到 :8080）
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 代理配置

开发环境下 `vite.config.ts` 将 `/api` 代理到 `http://localhost:8080`。

## 构建优化

- **分包策略**: ECharts、md-editor-v3、Element Plus 拆分为独立 chunk（`manualChunks`），减少首屏加载
- **懒加载**: 社区页面路由使用动态 import

## Docker 部署

```bash
# 从项目根目录一键启动全栈
docker compose up -d --build
# 前端: http://localhost:3000
```

前端基于 `nginx:alpine`，生产环境通过 nginx 反向代理 `/api` 到后端。

## 与后端对接

1. 后端必须先启动（端口 8080）
2. 统一响应格式: `{ code, msg, data }`
3. JWT 令牌存储在 `localStorage.token`，Axios 拦截器自动附加
4. 401 响应自动弹出重新登录提示
5. SSE 连接: `EventSource(/api/notifications/subscribe?token=xxx)`

## 功能特性

- ✅ 响应式布局（移动端适配）
- ✅ JWT 认证 + 路由守卫
- ✅ SSE 实时通知推送
- ✅ GitHub 风格贡献热力图
- ✅ Markdown 文章编辑器
- ✅ 7 种题型答题交互
- ✅ 树形评论系统
- ✅ 关注/粉丝/黑名单
- ✅ 文章系列管理
- ✅ ECharts 数据可视化
- ✅ 设计令牌系统（柔和粉蓝调色板）
- ✅ 3D 卡片倾斜效果（v-tilt 指令）
- ✅ SEO 支持（@unhead/vue + 爬虫预渲染）
