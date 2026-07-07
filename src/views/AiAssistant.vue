<template>
  <Layout>
    <div class="ai-page">
      <!-- 左侧：会话历史侧边栏 -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <el-button type="primary" :icon="Plus" @click="handleNewSession">新建会话</el-button>
        </div>

        <div class="history-list">
          <div v-if="historyLoading" class="history-tip">加载中...</div>
          <div v-else-if="historyGroups.length === 0" class="history-tip">暂无历史会话</div>
          <template v-else>
            <div v-for="group in historyGroups" :key="group.label" class="history-group">
              <div class="group-title">{{ group.label }}</div>
              <div
                v-for="item in group.items"
                :key="item.sessionId"
                :class="['history-item', { active: item.sessionId === sessionId }]"
                @click="switchSession(item.sessionId)"
              >
                <el-icon class="item-icon"><ChatDotRound /></el-icon>
                <span class="item-title">{{ item.title }}</span>
                <el-dropdown
                  class="item-menu"
                  trigger="click"
                  @click.stop
                  @command="(cmd) => handleHistoryCommand(cmd, item)"
                >
                  <el-icon class="menu-trigger" @click.stop><MoreFilled /></el-icon>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="rename">重命名</el-dropdown-item>
                      <el-dropdown-item command="delete">删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </template>
        </div>
      </aside>

      <!-- 右侧：对话主区 -->
      <section class="chat">
        <!-- 消息区 -->
        <div ref="msgBoxRef" class="messages">
          <!-- 空会话：欢迎页 -->
          <div v-if="messages.length === 0" class="welcome">
            <div class="avatar-ai">
              <el-icon :size="36"><MagicStick /></el-icon>
            </div>
            <h2 class="welcome-title">{{ assistantTitle }}</h2>
            <p class="welcome-desc">{{ assistantDesc }}</p>
            <div class="examples">
              <div
                v-for="(ex, idx) in suggestions"
                :key="idx"
                class="example-card"
                @click="sendMessage(ex.describe || ex.title)"
              >
                <div class="example-title">{{ ex.title }}</div>
                <div v-if="ex.describe" class="example-desc">{{ ex.describe }}</div>
              </div>
            </div>
          </div>

          <!-- 消息列表 -->
          <template v-else>
            <div
              v-for="(msg, idx) in messages"
              :key="idx"
              :class="['message', msg.role]"
            >
              <div :class="['avatar', msg.role]">
                <el-icon v-if="msg.role === 'assistant'" :size="20"><MagicStick /></el-icon>
                <span v-else>我</span>
              </div>
              <div class="bubble-wrap">
                <div :class="['bubble', { error: msg.isError }]">
                  <span class="bubble-text">{{ msg.content }}</span>
                  <span v-if="msg.loading" class="cursor">▍</span>
                </div>
                <!-- 工具调用结果：博客卡片 -->
                <div v-if="msg.blog" class="blog-card" @click="previewBlog(msg.blog)">
                  <div class="blog-card-header">
                    <el-icon><Document /></el-icon>
                    <span>{{ msg.blog.success ? '博客创建成功' : '博客操作结果' }}</span>
                  </div>
                  <div class="blog-card-body">{{ msg.blog.message }}</div>
                  <div v-if="msg.blog.success && msg.blog.articleId" class="blog-card-footer">
                    点击查看文章 →
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- 输入区 -->
        <div class="input-area">
          <el-input
            v-model="inputText"
            type="textarea"
            :rows="2"
            :disabled="streaming"
            placeholder="输入你的问题，按 Enter 发送，Shift+Enter 换行"
            resize="none"
            @keydown.enter.exact.prevent="onEnter"
          />
          <div class="input-actions">
            <el-button v-if="streaming" type="danger" :icon="VideoPause" @click="handleStop">
              停止生成
            </el-button>
            <el-button
              v-else
              type="primary"
              :icon="Promotion"
              :disabled="!inputText.trim()"
              @click="onEnter"
            >
              发送
            </el-button>
          </div>
        </div>
      </section>
    </div>

    <!-- 预览确认弹窗 -->
    <el-dialog
      v-model="previewVisible"
      title="博客预览确认"
      width="640px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div v-if="previewLoading" class="preview-loading">
        <el-icon class="is-loading" :size="24"><Loading /></el-icon>
        <span>加载文章预览中...</span>
      </div>
      <div v-else-if="previewArticle" class="preview-body">
        <div v-if="previewArticle.coverImage" class="preview-cover">
          <img :src="previewArticle.coverImage" alt="封面图" />
        </div>
        <h2 class="preview-title">{{ previewArticle.title }}</h2>
        <div v-if="previewArticle.tagName" class="preview-meta">
          <el-tag size="small" type="info">{{ previewArticle.tagName }}</el-tag>
        </div>
        <p v-if="previewArticle.summary" class="preview-summary">{{ previewArticle.summary }}</p>
        <div class="preview-content">{{ previewArticle.content }}</div>
      </div>
      <div v-else class="preview-empty">
        <p>无法加载文章信息，请稍后重试。</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="previewVisible = false">关闭</el-button>
          <el-button type="info" @click="handleViewArticle">仅查看文章</el-button>
          <el-button type="primary" :loading="previewPublishing" @click="handlePublish">
            确认发布
          </el-button>
        </span>
      </template>
    </el-dialog>
  </Layout>
</template>

<script setup>
import { ref, reactive, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Promotion,
  VideoPause,
  MagicStick,
  ChatDotRound,
  MoreFilled,
  Document,
  Loading,
} from '@element-plus/icons-vue'
import Layout from '@/components/Layout.vue'
import {
  createSession,
  getHotQuestions,
  getSessionMessages,
  getSessionHistory,
  deleteSession,
  renameSession,
  stopChat,
  chatStream,
} from '@/api/ai'
import { getArticleById, publishArticle } from '@/api/article'

const router = useRouter()

// ===== 会话状态 =====
const sessionId = ref('')
const assistantTitle = ref('Hello，我是诺玛')
const assistantDesc = ref('我是博客网站的智能助理，可以为你撰写博客、回答问题。')
const suggestions = ref([]) // 空会话时展示的示例/热门问题

// ===== 消息列表 =====
// 每条消息：{ role: 'user'|'assistant', content, blog, loading, isError }
const messages = ref([])
const inputText = ref('')
const streaming = ref(false)
let abortController = null

// ===== 历史会话 =====
const historyLoading = ref(false)
// 历史分组顺序
const GROUP_ORDER = ['当天', '最近30天', '最近1年', '1年以上']
const historyGroups = ref([])

const msgBoxRef = ref(null)

// ===== 预览确认弹窗 =====
const previewVisible = ref(false)
const previewLoading = ref(false)
const previewPublishing = ref(false)
const previewArticle = ref(null) // { articleId, title, summary, content, coverImage, tagName, ... }

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  if (msgBoxRef.value) {
    msgBoxRef.value.scrollTop = msgBoxRef.value.scrollHeight
  }
}

// ===== 初始化 =====
const loadHotQuestions = async () => {
  try {
    const res = await getHotQuestions(6)
    suggestions.value = res.data || []
  } catch {
    // 忽略，空会话仍可正常提问
  }
}

const loadHistory = async () => {
  historyLoading.value = true
  try {
    const res = await getSessionHistory()
    const map = res.data || {}
    historyGroups.value = GROUP_ORDER.filter((k) => map[k]?.length).map((k) => ({
      label: k,
      items: map[k],
    }))
  } catch (e) {
    console.error('加载历史会话失败:', e)
  } finally {
    historyLoading.value = false
  }
}

// 新建会话（仅在前端清空，sessionId 在首次提问时按需创建，避免产生空会话）
const handleNewSession = () => {
  if (streaming.value) {
    ElMessage.warning('请先停止当前生成')
    return
  }
  sessionId.value = ''
  messages.value = []
  inputText.value = ''
  loadHotQuestions()
}

// 切换到某个历史会话
const switchSession = async (sid) => {
  if (streaming.value || sid === sessionId.value) return
  try {
    const res = await getSessionMessages(sid)
    sessionId.value = sid
    messages.value = (res.data || []).map((m) => ({
      role: m.type === 'USER' ? 'user' : 'assistant',
      content: m.content || '',
      blog: m.params?.blog || null,
      loading: false,
      isError: false,
    }))
    await scrollToBottom()
  } catch {
    ElMessage.error('加载会话历史失败')
  }
}

// 历史项菜单
const handleHistoryCommand = async (cmd, item) => {
  if (cmd === 'rename') {
    try {
      const { value } = await ElMessageBox.prompt('请输入新标题', '重命名会话', {
        inputValue: item.title,
        confirmButtonText: '确定',
        cancelButtonText: '取消',
      })
      if (value && value.trim()) {
        await renameSession(item.sessionId, value.trim())
        ElMessage.success('已重命名')
        loadHistory()
      }
    } catch {
      // 用户取消
    }
  } else if (cmd === 'delete') {
    try {
      await ElMessageBox.confirm('确定删除该会话？删除后不可恢复。', '提示', {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
      })
      await deleteSession(item.sessionId)
      ElMessage.success('已删除')
      if (item.sessionId === sessionId.value) {
        handleNewSession()
      }
      loadHistory()
    } catch {
      // 用户取消
    }
  }
}

// ===== 发送消息 =====
const ensureSession = async () => {
  if (sessionId.value) return
  const res = await createSession(3)
  sessionId.value = res.data.sessionId
  if (res.data.title) assistantTitle.value = res.data.title
  if (res.data.describe) assistantDesc.value = res.data.describe
}

const sendMessage = async (text) => {
  const question = (text ?? inputText.value).trim()
  if (!question || streaming.value) return

  await ensureSession()

  messages.value.push({ role: 'user', content: question, blog: null, loading: false, isError: false })
  const assistantMsg = reactive({
    role: 'assistant',
    content: '',
    blog: null,
    loading: true,
    isError: false,
  })
  messages.value.push(assistantMsg)
  inputText.value = ''
  streaming.value = true
  await scrollToBottom()

  abortController = new AbortController()
  await chatStream({
    question,
    sessionId: sessionId.value,
    signal: abortController.signal,
    onEvent: (evt) => {
      // STOP：本轮结束
      if (evt.eventType === 1002) {
        assistantMsg.loading = false
        return
      }
      if (evt.eventType !== 1001) return
      const data = evt.eventData
      if (typeof data === 'string') {
        assistantMsg.content += data
        scrollToBottom()
      } else if (data && typeof data === 'object') {
        // 错误事件
        if (data.error) {
          assistantMsg.content += (assistantMsg.content ? '\n' : '') + data.error
          assistantMsg.isError = true
        }
        // 工具调用结果：博客卡片
        if (data.blog) {
          assistantMsg.blog = data.blog
          if (data.blog.success && data.blog.articleId) {
            previewBlog(data.blog)
          }
        }
      }
    },
    onError: () => {
      assistantMsg.loading = false
      assistantMsg.isError = true
      assistantMsg.content += (assistantMsg.content ? '\n' : '') + '连接出错，请重试。'
      ElMessage.error('对话请求失败')
    },
    onDone: () => {
      assistantMsg.loading = false
      streaming.value = false
      abortController = null
      // 标题由后端首次提问后异步生成，刷新历史列表
      loadHistory()
    },
  })
}

const onEnter = () => {
  if (!streaming.value && inputText.value.trim()) {
    sendMessage()
  }
}

// 中止生成
const handleStop = async () => {
  abortController?.abort()
  if (sessionId.value) {
    await stopChat(sessionId.value).catch(() => {})
  }
}

// 预览工具创建的博客
const previewBlog = async (blog) => {
  if (!blog?.success || !blog.articleId) return
  previewVisible.value = true
  previewLoading.value = true
  previewArticle.value = null
  try {
    const res = await getArticleById(blog.articleId)
    if (res.code === 1) {
      previewArticle.value = res.data
    }
  } catch {
    ElMessage.error('加载文章预览失败')
  } finally {
    previewLoading.value = false
  }
}

// 发布文章
const handlePublish = async () => {
  if (!previewArticle.value) return
  previewPublishing.value = true
  try {
    const res = await publishArticle(previewArticle.value.articleId)
    if (res.code === 1) {
      ElMessage.success('文章已发布')
      previewVisible.value = false
      router.push(`/article/${previewArticle.value.articleId}`)
    } else {
      ElMessage.error(res.msg || '发布失败')
    }
  } catch {
    ElMessage.error('发布请求失败')
  } finally {
    previewPublishing.value = false
  }
}

// 查看文章（不发布）
const handleViewArticle = () => {
  if (!previewArticle.value) return
  previewVisible.value = false
  router.push(`/article/${previewArticle.value.articleId}`)
}

onMounted(() => {
  loadHotQuestions()
  loadHistory()
})
</script>

<style scoped>
.ai-page {
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  height: calc(100vh - 120px);
  gap: 20px;
}

/* ===== 侧边栏 ===== */
.sidebar {
  width: 240px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 14px;
  border-bottom: 1px solid #f0f0f0;
}

.sidebar-header .el-button {
  width: 100%;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.history-tip {
  text-align: center;
  color: #999;
  font-size: 13px;
  padding: 20px 0;
}

.history-group {
  margin-bottom: 8px;
}

.group-title {
  font-size: 12px;
  color: #999;
  padding: 6px 8px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.history-item:hover {
  background: #f5f7fa;
}

.history-item.active {
  background: #ecf5ff;
}

.item-icon {
  color: #409eff;
  flex-shrink: 0;
}

.item-title {
  flex: 1;
  font-size: 13px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-trigger {
  color: #999;
  cursor: pointer;
  display: none;
}

.history-item:hover .menu-trigger {
  display: block;
}

/* ===== 对话主区 ===== */
.chat {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

/* 欢迎页 */
.welcome {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.avatar-ai {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff, #66b1ff);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.welcome-title {
  margin: 0 0 8px;
  font-size: 24px;
  color: #333;
}

.welcome-desc {
  color: #999;
  margin: 0 0 28px;
  max-width: 480px;
}

.examples {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  width: 100%;
  max-width: 560px;
}

.example-card {
  text-align: left;
  padding: 14px 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.example-card:hover {
  border-color: #409eff;
  background: #f5f9ff;
  transform: translateY(-2px);
}

.example-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.example-desc {
  font-size: 12px;
  color: #999;
  line-height: 1.5;
}

/* 消息气泡 */
.message {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.message.user {
  flex-direction: row-reverse;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #fff;
}

.avatar.assistant {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.avatar.user {
  background: #67c23a;
}

.bubble-wrap {
  max-width: 75%;
  display: flex;
  flex-direction: column;
}

.message.user .bubble-wrap {
  align-items: flex-end;
}

.bubble {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.7;
  color: #333;
  background: #f5f7fa;
  white-space: pre-wrap;
  word-break: break-word;
}

.message.user .bubble {
  background: #ecf5ff;
  color: #1d6fd1;
}

.bubble.error {
  background: #fef0f0;
  color: #f56c6c;
}

.cursor {
  display: inline-block;
  animation: blink 1s step-start infinite;
  color: #409eff;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

/* 博客卡片 */
.blog-card {
  margin-top: 10px;
  border: 1px solid #e1f3d8;
  background: #f0f9eb;
  border-radius: 8px;
  padding: 12px 14px;
  cursor: pointer;
  transition: all 0.2s;
  max-width: 320px;
}

.blog-card:hover {
  box-shadow: 0 2px 10px rgba(103, 194, 58, 0.25);
}

.blog-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #67c23a;
}

.blog-card-body {
  font-size: 13px;
  color: #555;
  margin: 6px 0;
  line-height: 1.5;
}

.blog-card-footer {
  font-size: 12px;
  color: #409eff;
  font-weight: 600;
}

/* 输入区 */
.input-area {
  border-top: 1px solid #f0f0f0;
  padding: 16px;
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.input-area :deep(.el-textarea__inner) {
  font-size: 14px;
}

.input-actions {
  flex-shrink: 0;
}

/* 预览确认弹窗 */
.preview-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px 0;
  color: #909399;
  font-size: 14px;
}

.preview-body {
  max-height: 460px;
  overflow-y: auto;
}

.preview-cover {
  margin-bottom: 16px;
  border-radius: 8px;
  overflow: hidden;
}

.preview-cover img {
  width: 100%;
  max-height: 240px;
  object-fit: cover;
}

.preview-title {
  margin: 0 0 10px;
  font-size: 20px;
  color: #303133;
  line-height: 1.4;
}

.preview-meta {
  margin-bottom: 12px;
}

.preview-summary {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 14px;
  padding: 10px 14px;
  background: #f5f7fa;
  border-radius: 6px;
  border-left: 3px solid #409eff;
}

.preview-content {
  font-size: 14px;
  color: #303133;
  line-height: 1.8;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  max-height: 200px;
  overflow-y: auto;
  padding: 12px 14px;
  background: #fafafa;
  border-radius: 6px;
  border: 1px solid #ebeef5;
}

.preview-empty {
  text-align: center;
  padding: 40px 0;
  color: #909399;
}

@media (max-width: 768px) {
  .ai-page {
    flex-direction: column;
    height: auto;
    padding: 0 12px;
  }

  .sidebar {
    width: 100%;
    max-height: 200px;
  }

  .chat {
    height: calc(100vh - 320px);
  }

  .examples {
    grid-template-columns: 1fr;
  }

  .bubble-wrap {
    max-width: 85%;
  }
}
</style>
