<template>
  <Layout>
    <div class="assistant-page">
      <aside class="session-panel">
        <div class="panel-header">
          <div>
            <h2>AI 助手</h2>
            <p>博客写作与查询</p>
          </div>
          <button class="icon-btn primary" title="新建对话" @click="startNewConversation">
            <Plus />
          </button>
        </div>

        <div class="history-list">
          <div v-if="historyLoading" class="panel-state">加载历史中...</div>
          <div v-else-if="historyGroups.length === 0" class="panel-state">暂无历史会话</div>
          <template v-else>
            <section v-for="group in historyGroups" :key="group.name" class="history-group">
              <h3>{{ group.name }}</h3>
              <div
                v-for="item in group.items"
                :key="item.sessionId"
                :class="['history-entry', { active: item.sessionId === sessionId }]"
              >
                <button class="history-item" @click="openHistorySession(item.sessionId)">
                  <span>{{ item.title || '未命名对话' }}</span>
                  <small>{{ formatTime(item.updateTime) }}</small>
                </button>
                <button
                  class="history-delete"
                  title="删除会话"
                  :disabled="deletingSessionId === item.sessionId"
                  @click.stop="handleDeleteSession(item)"
                >
                  <Delete />
                </button>
              </div>
            </section>
          </template>
        </div>
      </aside>

      <section class="chat-panel">
        <header class="chat-header">
          <div>
            <h1>{{ assistantInfo.title || '博客智能助手' }}</h1>
            <p>{{ assistantInfo.describe || '可以帮你查询博客、整理思路、生成或修改博客草稿。' }}</p>
          </div>
          <div class="status-pill">
            <span :class="['status-dot', { active: streaming }]"></span>
            {{ streaming ? '生成中' : '就绪' }}
          </div>
        </header>

        <main ref="messageListRef" class="message-list">
          <div v-if="sessionLoading" class="empty-state">正在准备会话...</div>
          <template v-else>
            <div v-if="messages.length === 0" class="welcome">
              <h2>想聊点什么？</h2>
              <p>你可以让我推荐博客、解释文章内容，或者帮你起草一篇新博客。</p>
              <div class="examples">
                <button
                  v-for="example in examples"
                  :key="example.title"
                  @click="useExample(example)"
                >
                  <strong>{{ example.title }}</strong>
                  <span>{{ example.describe }}</span>
                </button>
              </div>
            </div>

            <article
              v-for="message in messages"
              :key="message.id"
              :class="['message-row', message.role]"
            >
              <div class="message-bubble">
                <div
                  v-if="message.content"
                  class="message-markdown"
                  v-html="renderMarkdown(message.content)"
                ></div>
                <div v-if="message.toolResult" class="tool-card">
                  <div class="tool-title">
                    <CircleCheck v-if="message.toolResult.success" />
                    <Warning v-else />
                    <span>{{ message.toolResult.message || '工具执行完成' }}</span>
                  </div>
                  <p v-if="getToolNarration(message.toolResult)" class="tool-narration">
                    {{ getToolNarration(message.toolResult) }}
                  </p>
                  <button
                    v-if="message.toolResult.articleId"
                    class="link-btn"
                    @click="openDraftDialog(message.toolResult.articleId)"
                  >
                    查看草稿 #{{ message.toolResult.articleId }}
                  </button>
                  <div v-if="getDisplayArticles(message.toolResult.articles).length" class="article-results">
                    <button
                      v-for="article in getDisplayArticles(message.toolResult.articles)"
                      :key="article.articleId"
                      class="article-result"
                      @click="goToArticle(article.articleId)"
                    >
                      <strong>{{ article.title || '未命名文章' }}</strong>
                      <span v-if="article.tagName">{{ article.tagName }}</span>
                      <p>{{ article.summary || '暂无摘要' }}</p>
                    </button>
                  </div>
                </div>
              </div>
            </article>

            <div v-if="streaming" class="typing-row">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </template>
        </main>

        <footer class="composer">
          <textarea
            v-model="question"
            rows="3"
            placeholder="输入你的问题，例如：帮我写一篇 Redis 缓存实践博客..."
            :disabled="sessionLoading"
            @keydown.enter.exact.prevent="sendQuestion"
          ></textarea>
          <div class="composer-actions">
            <button class="secondary-btn" :disabled="!streaming" @click="handleStop">
              <VideoPause />
              停止
            </button>
            <button class="send-btn" :disabled="!canSend" @click="sendQuestion">
              <Promotion />
              发送
            </button>
          </div>
        </footer>
      </section>
    </div>

    <div v-if="draftDialogVisible" class="draft-dialog-backdrop">
      <section class="draft-dialog" role="dialog" aria-modal="true" aria-labelledby="draft-dialog-title">
        <header class="draft-dialog-header">
          <div>
            <h2 id="draft-dialog-title">AI 草稿确认</h2>
            <p>发布前可以先检查和调整内容。</p>
          </div>
          <button class="icon-btn" title="关闭" @click="closeDraftDialog">×</button>
        </header>

        <div v-if="draftLoading" class="draft-state">正在加载草稿...</div>
        <form v-else class="draft-form" @submit.prevent="publishDraft">
          <label>
            <span>标题</span>
            <input v-model="draftForm.title" type="text" required />
          </label>

          <label>
            <span>摘要</span>
            <textarea v-model="draftForm.summary" rows="3"></textarea>
          </label>

          <label>
            <span>正文</span>
            <textarea v-model="draftForm.content" rows="14" required></textarea>
          </label>

          <div v-if="draftError" class="draft-error">{{ draftError }}</div>

          <footer class="draft-actions">
            <button type="button" class="secondary-btn" @click="closeDraftDialog">取消</button>
            <button type="button" class="secondary-btn" @click="goToArticleEdit">完整编辑</button>
            <button type="submit" class="send-btn" :disabled="draftSaving">
              {{ draftSaving ? '发布中...' : '修改并发布' }}
            </button>
          </footer>
        </form>
      </section>
    </div>
  </Layout>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { CircleCheck, Delete, Plus, Promotion, VideoPause, Warning } from '@element-plus/icons-vue'
import Layout from '@/components/Layout.vue'
import { getArticleById, updateArticle } from '@/api/article'
import { renderMarkdown } from '@/utils/markdown'
import {
  createSession,
  deleteHistorySession,
  getHotExamples,
  getHistorySessions,
  getSessionMessages,
  stopChat,
  streamChat,
} from '@/api/chat'

const router = useRouter()

const sessionId = ref('')
const assistantInfo = ref({})
const examples = ref([])
const messages = ref([])
const question = ref('')
const history = ref({})
const historyLoading = ref(false)
const sessionLoading = ref(false)
const deletingSessionId = ref('')
const streaming = ref(false)
const messageListRef = ref(null)
const activeController = ref(null)
const draftDialogVisible = ref(false)
const draftLoading = ref(false)
const draftSaving = ref(false)
const draftError = ref('')
const draftForm = ref({
  articleId: null,
  title: '',
  summary: '',
  content: '',
  coverImage: '',
  tagId: '',
})

const canSend = computed(() => {
  return question.value.trim() && !streaming.value && !sessionLoading.value
})

const historyGroups = computed(() => {
  return Object.entries(history.value || {})
    .map(([name, items]) => {
      const sortedItems = Array.isArray(items)
        ? [...items].sort((a, b) => getTimeValue(b.updateTime) - getTimeValue(a.updateTime))
        : []
      return {
        name,
        items: sortedItems,
        latestTime: sortedItems.length ? getTimeValue(sortedItems[0].updateTime) : 0,
      }
    })
    .filter((group) => group.items.length > 0)
    .sort((a, b) => b.latestTime - a.latestTime)
})

const startNewConversation = async () => {
  if (streaming.value) return
  sessionId.value = ''
  messages.value = []
  await loadExamples()
  scrollToBottom()
}

const ensureSession = async () => {
  if (sessionId.value) {
    return sessionId.value
  }

  sessionLoading.value = true
  try {
    const res = await createSession(3)
    if (res.code === 1) {
      assistantInfo.value = res.data || {}
      sessionId.value = res.data.sessionId
      examples.value = res.data.examples || []
      return sessionId.value
    }
  } finally {
    sessionLoading.value = false
  }
  return ''
}

const loadHistory = async () => {
  historyLoading.value = true
  try {
    const res = await getHistorySessions()
    if (res.code === 1) {
      history.value = res.data || {}
    }
  } finally {
    historyLoading.value = false
  }
}

const loadExamples = async () => {
  try {
    const res = await getHotExamples(3)
    if (res.code === 1) {
      examples.value = res.data || []
    }
  } catch (error) {
    examples.value = []
  }
}

const openHistorySession = async (targetSessionId) => {
  if (!targetSessionId || streaming.value) return

  sessionLoading.value = true
  sessionId.value = targetSessionId
  messages.value = []
  try {
    const res = await getSessionMessages(targetSessionId)
    if (res.code === 1) {
      messages.value = (res.data || []).map((item) => ({
        id: createMessageId(),
        role: item.type === 'USER' ? 'user' : 'assistant',
        content: item.content || '',
        toolResult: item.params?.blog || null,
      }))
    }
  } finally {
    sessionLoading.value = false
    scrollToBottom()
  }
}

const handleDeleteSession = async (item) => {
  if (!item?.sessionId || deletingSessionId.value) return
  if (!confirm(`确定删除「${item.title || '未命名对话'}」吗？`)) return

  deletingSessionId.value = item.sessionId
  try {
    await deleteHistorySession(item.sessionId)
    await loadHistory()
    if (item.sessionId === sessionId.value) {
      await startNewConversation()
    }
  } finally {
    deletingSessionId.value = ''
  }
}

const useExample = (example) => {
  question.value = example.describe || example.title || ''
  sendQuestion()
}

const sendQuestion = async () => {
  const text = question.value.trim()
  if (!text || streaming.value) return

  const activeSessionId = await ensureSession()
  if (!activeSessionId) return

  messages.value.push({
    id: createMessageId(),
    role: 'user',
    content: text,
  })
  question.value = ''

  const assistantMessage = {
    id: createMessageId(),
    role: 'assistant',
    content: '',
    toolResult: null,
  }
  messages.value.push(assistantMessage)
  streaming.value = true
  activeController.value = new AbortController()
  scrollToBottom()

  try {
    await streamChat({
      question: text,
      sessionId: activeSessionId,
      signal: activeController.value.signal,
      onEvent: (event) => {
        handleChatEvent(event, assistantMessage)
      },
    })
    await loadHistory()
  } catch (error) {
    if (error.name !== 'AbortError') {
      assistantMessage.content += '\nAI 助手暂时连接失败，请稍后再试。'
    }
  } finally {
    streaming.value = false
    activeController.value = null
    scrollToBottom()
  }
}

const handleChatEvent = (event, assistantMessage) => {
  if (event.eventType === 1002) {
    streaming.value = false
    return
  }

  if (event.eventType !== 1001) return

  const data = event.eventData
  if (typeof data === 'string') {
    assistantMessage.content += data
  } else if (data?.blog) {
    assistantMessage.toolResult = data.blog
    if (data.blog.success && data.blog.articleId) {
      openDraftDialog(data.blog.articleId)
    }
  } else if (data?.error) {
    assistantMessage.content += data.error
  }
  scrollToBottom()
}

const handleStop = async () => {
  if (!sessionId.value) return
  try {
    await stopChat(sessionId.value)
  } finally {
    activeController.value?.abort()
    streaming.value = false
  }
}

const goToArticle = (articleId) => {
  if (!articleId) return
  router.push(`/article/${articleId}`)
}

const getDisplayArticles = (articles = []) => {
  const seen = new Set()
  return articles.filter((article) => {
    const articleId = article?.articleId
    if (!articleId || seen.has(articleId)) return false
    seen.add(articleId)
    return true
  })
}

const getToolNarration = (toolResult) => {
  if (!toolResult) return ''
  const articles = getDisplayArticles(toolResult.articles || [])
  if (articles.length > 0) {
    return `我找到了 ${articles.length} 篇相关博客，你可以先看摘要，点击卡片进入文章详情。`
  }
  if (toolResult.articleId) {
    return '草稿已经准备好，可以先检查内容，再选择修改并发布。'
  }
  if (toolResult.success === false) {
    return '这次没有拿到可展示的结果，可以换一个更具体的关键词再试。'
  }
  return ''
}

const openDraftDialog = async (articleId) => {
  if (!articleId) return

  draftDialogVisible.value = true
  draftLoading.value = true
  draftError.value = ''
  draftForm.value = {
    articleId,
    title: '',
    summary: '',
    content: '',
    coverImage: '',
    tagId: '',
  }

  try {
    const res = await getArticleById(articleId)
    if (res.code === 1 && res.data) {
      const article = res.data
      draftForm.value = {
        articleId: article.articleId || articleId,
        title: article.title || '',
        summary: article.summary || '',
        content: article.content || '',
        coverImage: article.coverImage || '',
        tagId: article.tagId || '',
      }
    } else {
      draftError.value = res.msg || '草稿加载失败'
    }
  } catch (error) {
    draftError.value = error.message || '草稿加载失败'
  } finally {
    draftLoading.value = false
  }
}

const closeDraftDialog = () => {
  draftDialogVisible.value = false
  draftError.value = ''
}

const publishDraft = async () => {
  if (!draftForm.value.articleId || draftSaving.value) return

  draftSaving.value = true
  draftError.value = ''
  try {
    const payload = {
      articleId: draftForm.value.articleId,
      title: draftForm.value.title,
      summary: draftForm.value.summary,
      content: draftForm.value.content,
      coverImage: draftForm.value.coverImage,
      status: 1,
      publishedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    }

    if (draftForm.value.tagId) {
      payload.tagId = draftForm.value.tagId
    }

    const res = await updateArticle(payload)
    if (res.code === 1) {
      closeDraftDialog()
      goToArticle(draftForm.value.articleId)
    } else {
      draftError.value = res.msg || '发布失败'
    }
  } catch (error) {
    draftError.value = error.message || '发布失败'
  } finally {
    draftSaving.value = false
  }
}

const goToArticleEdit = () => {
  if (!draftForm.value.articleId) return
  router.push(`/article/edit/${draftForm.value.articleId}`)
}

const formatTime = (value) => {
  if (!value) return ''
  return String(value).replace('T', ' ').slice(0, 16)
}

const getTimeValue = (value) => {
  if (!value) return 0
  return new Date(String(value).replace(' ', 'T')).getTime() || 0
}

const createMessageId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const scrollToBottom = () => {
  nextTick(() => {
    const el = messageListRef.value
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  })
}

onMounted(async () => {
  await loadHistory()
  await loadExamples()
})
</script>

<style scoped>
.assistant-page {
  max-width: 1280px;
  height: calc(100vh - 140px);
  min-height: 640px;
  margin: 0 auto;
  padding: 20px;
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 20px;
}

.session-panel,
.chat-panel {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  min-width: 0;
}

.session-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f0f2f5;
}

.panel-header h2,
.chat-header h1,
.welcome h2 {
  margin: 0;
  color: #303133;
}

.panel-header h2 {
  font-size: 20px;
}

.panel-header p,
.chat-header p,
.welcome p {
  margin: 4px 0 0;
  color: #909399;
  font-size: 14px;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.icon-btn.primary,
.send-btn {
  background: #409eff;
  color: #fff;
}

.history-list {
  padding: 12px;
  overflow-y: auto;
}

.panel-state,
.empty-state {
  padding: 32px 16px;
  text-align: center;
  color: #909399;
}

.history-group {
  margin-bottom: 14px;
}

.history-group h3 {
  margin: 8px 6px;
  font-size: 13px;
  color: #909399;
  font-weight: 600;
}

.history-entry {
  width: 100%;
  border-radius: 8px;
  background: transparent;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px;
  transition: background 0.2s ease, color 0.2s ease;
}

.history-entry:hover,
.history-entry.active {
  background: #ecf5ff;
  color: #409eff;
}

.history-item {
  min-width: 0;
  flex: 1;
  padding: 8px 10px;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  color: inherit;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.history-item span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-item small {
  color: #a8abb2;
}

.history-delete {
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #a8abb2;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.history-delete svg {
  width: 15px;
  height: 15px;
}

.history-entry:hover .history-delete,
.history-entry.active .history-delete,
.history-delete:focus-visible {
  opacity: 1;
}

.history-delete:hover {
  background: #fef0f0;
  color: #f56c6c;
}

.history-delete:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.chat-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  overflow: hidden;
}

.chat-header {
  padding: 18px 22px;
  border-bottom: 1px solid #f0f2f5;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.chat-header h1 {
  font-size: 22px;
}

.status-pill {
  flex-shrink: 0;
  padding: 6px 10px;
  border-radius: 999px;
  background: #f5f7fa;
  color: #606266;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #909399;
}

.status-dot.active {
  background: #67c23a;
}

.message-list {
  padding: 24px;
  overflow-y: auto;
  background: #fafafa;
}

.welcome {
  max-width: 680px;
  margin: 80px auto 0;
  text-align: center;
}

.examples {
  margin-top: 24px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.examples button {
  min-height: 96px;
  padding: 14px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background: #fff;
  text-align: left;
  cursor: pointer;
}

.examples button:hover {
  border-color: #409eff;
}

.examples strong,
.examples span {
  display: block;
}

.examples strong {
  color: #303133;
  margin-bottom: 6px;
}

.examples span {
  color: #606266;
  font-size: 13px;
}

.message-row {
  display: flex;
  margin-bottom: 16px;
}

.message-row.user {
  justify-content: flex-end;
}

.message-row.assistant {
  justify-content: flex-start;
}

.message-bubble {
  max-width: min(720px, 78%);
  padding: 12px 14px;
  border-radius: 8px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-row.user .message-bubble {
  background: #409eff;
  color: #fff;
}

.message-row.assistant .message-bubble {
  background: #fff;
  color: #303133;
  border: 1px solid #ebeef5;
}

.message-bubble p {
  margin: 0;
}

.message-markdown :deep(p) {
  margin: 0 0 10px;
}

.message-markdown :deep(p:last-child) {
  margin-bottom: 0;
}

.message-markdown :deep(h1),
.message-markdown :deep(h2),
.message-markdown :deep(h3),
.message-markdown :deep(h4),
.message-markdown :deep(h5),
.message-markdown :deep(h6) {
  margin: 12px 0 8px;
  line-height: 1.35;
}

.message-markdown :deep(h1) {
  font-size: 22px;
}

.message-markdown :deep(h2) {
  font-size: 19px;
}

.message-markdown :deep(h3) {
  font-size: 17px;
}

.message-markdown :deep(ul),
.message-markdown :deep(ol) {
  margin: 0 0 10px 20px;
  padding: 0;
}

.message-markdown :deep(li) {
  margin: 4px 0;
}

.message-markdown :deep(a) {
  color: #409eff;
  text-decoration: none;
}

.message-row.user .message-markdown :deep(a) {
  color: #fff;
  text-decoration: underline;
}

.message-markdown :deep(code) {
  padding: 2px 5px;
  border-radius: 4px;
  background: #f5f7fa;
  color: #d14;
  font-family: Consolas, Monaco, monospace;
  font-size: 0.92em;
}

.message-row.user .message-markdown :deep(code) {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
}

.message-markdown :deep(pre) {
  margin: 0 0 10px;
  padding: 12px;
  border-radius: 8px;
  background: #1f2933;
  overflow-x: auto;
}

.message-markdown :deep(pre code) {
  padding: 0;
  background: transparent;
  color: #f8fafc;
}

.tool-card {
  min-width: 260px;
  margin-top: 10px;
}

.tool-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.tool-title svg {
  width: 18px;
  height: 18px;
}

.tool-narration {
  margin: 8px 0 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
}

.link-btn {
  margin-top: 12px;
  padding: 8px 12px;
  border: 1px solid #409eff;
  color: #409eff;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
}

.article-results {
  margin-top: 12px;
  display: grid;
  gap: 10px;
}

.article-result {
  width: 100%;
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #f8f9fb;
  text-align: left;
  cursor: pointer;
}

.article-result:hover {
  border-color: #409eff;
  background: #ecf5ff;
}

.article-result strong {
  display: block;
  color: #303133;
  margin-bottom: 6px;
}

.article-result span {
  display: inline-block;
  margin-bottom: 6px;
  padding: 2px 6px;
  border-radius: 4px;
  background: #e1f3d8;
  color: #67c23a;
  font-size: 12px;
}

.article-result p {
  color: #606266;
  font-size: 13px;
  line-height: 1.5;
}

.typing-row {
  width: 58px;
  padding: 12px 14px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #ebeef5;
  display: flex;
  gap: 5px;
}

.typing-row span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #a8abb2;
  animation: typing 1.2s infinite ease-in-out;
}

.typing-row span:nth-child(2) {
  animation-delay: 0.15s;
}

.typing-row span:nth-child(3) {
  animation-delay: 0.3s;
}

.composer {
  border-top: 1px solid #f0f2f5;
  padding: 16px;
  background: #fff;
}

.composer textarea {
  width: 100%;
  resize: none;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
}

.composer textarea:focus {
  outline: none;
  border-color: #409eff;
}

.composer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}

.send-btn,
.secondary-btn {
  height: 38px;
  padding: 0 16px;
  border: none;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.secondary-btn {
  background: #f5f7fa;
  color: #606266;
}

.send-btn:disabled,
.secondary-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.draft-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  padding: 24px;
  background: rgba(0, 0, 0, 0.42);
  display: flex;
  align-items: center;
  justify-content: center;
}

.draft-dialog {
  width: min(860px, 100%);
  max-height: calc(100vh - 48px);
  background: #fff;
  border-radius: 8px;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
  box-shadow: 0 16px 42px rgba(0, 0, 0, 0.22);
}

.draft-dialog-header {
  padding: 18px 22px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.draft-dialog-header h2 {
  margin: 0;
  color: #303133;
  font-size: 20px;
}

.draft-dialog-header p {
  margin: 4px 0 0;
  color: #909399;
  font-size: 14px;
}

.draft-state {
  padding: 48px 22px;
  color: #909399;
  text-align: center;
}

.draft-form {
  min-height: 0;
  padding: 20px 22px 18px;
  overflow-y: auto;
  display: grid;
  gap: 14px;
}

.draft-form label {
  display: grid;
  gap: 8px;
  color: #303133;
  font-weight: 600;
}

.draft-form input,
.draft-form textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  color: #303133;
  font-size: 14px;
  line-height: 1.6;
}

.draft-form textarea {
  resize: vertical;
}

.draft-form input:focus,
.draft-form textarea:focus {
  outline: none;
  border-color: #409eff;
}

.draft-error {
  color: #f56c6c;
  font-size: 14px;
}

.draft-actions {
  position: sticky;
  bottom: -18px;
  padding-top: 12px;
  background: #fff;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@keyframes typing {
  0%,
  80%,
  100% {
    opacity: 0.35;
    transform: translateY(0);
  }
  40% {
    opacity: 1;
    transform: translateY(-3px);
  }
}

@media (max-width: 900px) {
  .assistant-page {
    height: auto;
    min-height: calc(100vh - 120px);
    grid-template-columns: 1fr;
  }

  .session-panel {
    max-height: 280px;
  }

  .examples {
    grid-template-columns: 1fr;
  }

  .message-bubble {
    max-width: 92%;
  }

  .draft-dialog-backdrop {
    padding: 12px;
    align-items: stretch;
  }

  .draft-dialog {
    max-height: calc(100vh - 24px);
  }

  .draft-actions {
    flex-wrap: wrap;
  }
}
</style>
