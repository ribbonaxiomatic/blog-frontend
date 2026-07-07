# AI 助手前端开发日志

## 开发内容

- 新增 `src/api/chat.js`，封装 AI 助手相关接口。
- 新增 `src/views/Assistant.vue`，提供 AI 助手聊天页面。
- 新增 `/assistant` 路由，并设置为登录后可访问。
- 在公共导航 `src/components/Layout.vue` 中加入“AI助手”入口。

## 修复记录

- 修复助手页面导入了不存在的 `CircleStop` 图标导致页面模块加载失败的问题，改为使用 Element Plus 已提供的 `VideoPause`。
- 将公共布局 `Layout.vue` 恢复为原有结构，只保留“AI助手”导航入口，避免导航布局改动影响已有页面。
- 将消息 ID 生成从直接调用 `crypto.randomUUID()` 调整为带降级逻辑的本地函数。

## 向量检索优化

- 在 `src/api/article.js` 中新增 `syncArticleVectors` 和 `getArticleVectorStatus`。
- 在管理员文章管理页增加“查看向量库状态”和“同步文章到向量库”操作。
- 在 AI 助手页支持展示 `searchArticles` 工具返回的 `articles` 列表，并可点击跳转文章详情。
- 管理员同步接口用于初始化或修复向量库；日常文章新增、修改、删除已由后端 `ArticleServiceImpl` 自动异步维护向量库。

## 已接入的后端能力

- `POST /session?n=3`：创建新会话，获取 `sessionId`、助手介绍和示例问题。
- `GET /session/history`：获取当前用户历史会话。
- `GET /session/{sessionId}`：获取指定会话历史消息。
- `POST /chat`：发送问题并流式接收 AI 回复。
- `POST /chat/stop?sessionId=xxx`：停止当前会话生成。

## 联调说明

普通 JSON 接口继续使用项目已有的 axios 封装。`/chat` 是 `text/event-stream` 流式响应，不能直接复用 axios 响应拦截器，所以在 `src/api/chat.js` 中使用 `fetch` 和 `ReadableStream` 单独处理。

聊天请求会从 `localStorage` 读取 `token`，并通过请求头传给后端：

```js
headers: {
  'Content-Type': 'application/json',
  token: localStorage.getItem('token') || '',
}
```

后端返回事件约定：

- `eventType = 1001`：普通数据或工具调用结果。
- `eventType = 1002`：生成结束。
- `eventType = 1003`：参数事件，当前页面暂未单独使用。

## 页面能力

- 进入页面后自动创建一个新会话。
- 支持展示助手介绍和示例问题。
- 支持发送问题并实时追加 AI 流式回复。
- 支持停止生成。
- 支持展示历史会话分组。
- 支持点击历史会话恢复聊天记录。
- 支持展示工具调用结果卡片，例如博客创建成功后跳转文章详情。

## 这次有意没有做的事

- 没有修改后端 agent 逻辑。
- 没有改变原有文章、搜索、收藏、登录等业务接口。
- 没有引入新的前端依赖。
- 没有把 AI 创建博客改成“前端确认后再发布”，当前仍沿用后端工具直接落库的实现。

## 后续建议

- 如果希望 AI 写博客更安全，可以把“创建博客”改成先生成草稿，再由用户确认发布。
- 可以给历史会话补充前端重命名和删除按钮。
- 可以在后端开启或确认 `@EnableAsync`，让会话标题更新真正异步执行。
- 建议确认后端提示词文件和配置文件均为 UTF-8，避免 AI 系统提示词出现乱码。
