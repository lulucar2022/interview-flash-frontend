# 面试刷题系统前端

基于 Vue3 + Vite + Pinia + Vue Router + Element Plus + Axios 构建的面试刷题系统前端项目。

## 设计风格

参考 **Miro** 设计风格，简洁、现代化：

- **主色调**: Near Black (`#1c1c1e`) + White (`#ffffff`)
- **交互色**: Blue 450 (`#5b76fe`)
- **成功色**: Success Green (`#00b473`)
- **边框**: Ring shadow 风格 (`rgb(224,226,232) 0px 0px 0px 1px`)
- **圆角**: 8px-24px 范围
- **字体**: Noto Sans SC / PingFang SC

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.4.x | 渐进式JavaScript框架 |
| Vite | 5.2.x | 下一代前端构建工具 |
| Pinia | 2.1.x | Vue状态管理 |
| Vue Router | 4.3.x | Vue官方路由管理 |
| Element Plus | 2.6.x | Vue3 UI组件库 |
| Axios | 1.6.x | HTTP请求库 |

## 项目结构

```
src/
├── api/                    # API接口模块化管理
│   └── index.js           # 接口定义
├── assets/                # 静态资源
├── components/            # 公共组件
│   └── Header.vue         # 顶部导航栏
├── router/                # 路由配置
│   └── index.js           # 路由守卫
├── stores/                # Pinia状态管理
│   ├── app.js             # 全局状态（Loading）
│   ├── user.js            # 用户状态
│   └── index.js           # Store入口
├── utils/                 # 工具函数
│   └── request.js         # Axios封装
├── views/                 # 页面组件
│   ├── Login.vue          # 登录页
│   ├── Home.vue           # 首页
│   ├── QuestionList.vue   # 题库列表
│   ├── QuestionDetail.vue # 题目详情
│   ├── Practice.vue       # 在线刷题
│   ├── WrongQuestions.vue # 错题本
│   └── Profile.vue        # 个人中心
├── App.vue                # 根组件
└── main.js                # 应用入口
```

## 页面说明

### 1. 登录页 (Login)
- 用户名密码登录
- 表单校验（长度、非空）
- 记住密码功能
- 回车键快速登录

### 2. 首页 (Home)
- 用户欢迎信息
- 学习统计卡片（总题目、已掌握、错题数、掌握率）
- 题库分类展示
- 热门题目列表
- 快捷操作入口

### 3. 题库列表 (QuestionList)
- 按分类筛选
- 按难度筛选
- 分页展示
- 跳转到题目详情

### 4. 题目详情 (QuestionDetail)
- 题目内容展示
- 答案输入
- 查看参考答案
- 收藏功能
- 加入错题本

### 5. 在线刷题 (Practice)
- 题目列表导航
- 上一题/下一题
- 答案提交
- 查看答案
- 收藏/取消收藏
- 进度展示

### 6. 错题本 (WrongQuestions)
- 错题列表展示
- 复习次数统计
- 再做一次
- 标记为已掌握
- 移除错题

### 7. 个人中心 (Profile)
- 用户信息展示
- 信息修改
- 密码修改
- 学习统计
- 我的收藏
- 退出登录

## API接口

### 用户接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/users | 获取所有用户 |
| GET | /api/users/{id} | 根据ID获取用户 |
| GET | /api/users/username/{username} | 根据用户名获取用户 |
| POST | /api/users | 创建用户 |
| PUT | /api/users/{id} | 更新用户 |
| DELETE | /api/users/{id} | 删除用户 |

### 分类接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/categories | 获取所有分类 |
| GET | /api/categories/{id} | 根据ID获取分类 |
| POST | /api/categories | 创建分类 |
| PUT | /api/categories/{id} | 更新分类 |
| DELETE | /api/categories/{id} | 删除分类 |

### 题目接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/questions | 获取题目列表（分页） |
| GET | /api/questions/{id} | 获取题目详情 |
| GET | /api/questions/random | 随机获取题目 |
| GET | /api/questions/search | 搜索题目 |
| POST | /api/questions | 创建题目 |
| PUT | /api/questions/{id} | 更新题目 |
| DELETE | /api/questions/{id} | 删除题目 |

### 学习进度接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/progress | 获取用户进度 |
| GET | /api/progress/question | 获取指定题目进度 |
| GET | /api/progress/wrong | 获取错题列表 |
| GET | /api/progress/favorites | 获取收藏列表 |
| GET | /api/progress/statistics | 获取统计信息 |
| POST | /api/progress | 更新进度 |
| DELETE | /api/progress/reset | 重置进度 |

## Axios封装

`src/utils/request.js` 实现了以下功能：

1. **请求拦截器**
   - 自动在请求头添加 `Authorization: Bearer {token}`
   - 从 localStorage 获取 token

2. **响应拦截器**
   - 统一处理返回格式 `{code, msg, data}`
   - code !== 200 时显示错误提示
   - 401 响应时弹出重新登录确认框
   - 403/404/500 等错误码处理

3. **错误处理**
   - 业务异常（BusinessException）
   - 参数校验异常（MethodArgumentNotValidException）
   - 系统未知异常

## 路由守卫

`src/router/index.js` 实现了路由守卫功能：

- 未登录状态下访问需要认证的页面 → 重定向到登录页
- 已登录状态下访问登录页 → 重定向到首页
- 动态更新页面标题

需要认证的页面（在 router 配置中添加 `meta: { requiresAuth: true }`）：
- 首页 /questions
- 题库列表 /questions
- 刷题页 /practice
- 错题本 /wrong
- 个人中心 /profile

## 状态管理

### User Store
```javascript
state: {
  token: string,      // 登录令牌
  user: object,      // 用户信息
  isLoggedIn: boolean // 登录状态
}

actions: {
  login(loginForm)    // 登录
  logout()           // 登出
  updateUser(data)    // 更新用户信息
}
```

### App Store
```javascript
state: {
  loading: boolean,   // 全局Loading状态
  loadingText: string // Loading文字
}

actions: {
  setLoading(loading, text)
}
```

## localStorage存储

| key | 说明 |
|-----|------|
| token | 登录令牌 |
| user | 用户信息JSON |
| remember_username | 记住的用户名 |
| remember_password | 记住的密码 |

## 启动项目

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 配置说明

### 环境变量 (.env)

```env
VITE_APP_TITLE=面试刷题系统
VITE_API_BASE_URL=/api
```

### 代理配置 (vite.config.js)

开发环境下，API请求会被代理到 `http://localhost:8080`。

## 与后端对接

1. 后端必须先启动（端口8080）
2. 后端返回格式：
   ```json
   {
     "code": 200,
     "msg": "success",
     "data": {}
   }
   ```
3. 前端会自动处理统一的错误响应

## 功能特性

- 响应式布局，支持移动端
- 表单验证
- 统一错误提示
- 全局Loading
- 路由权限控制
- 持久化登录状态
- 分页支持
- 程序员风格UI设计

## 后续可扩展功能

1. 真正的JWT登录认证
2. 用户注册功能
3. 题目搜索功能
4. 学习计划制定
5. 知识点标签管理
6. 刷题排行榜
7. 数据可视化统计
8. 移动端适配优化
