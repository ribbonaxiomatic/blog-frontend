<template>
  <Layout>
    <div class="home-page">
      <section class="hero">
        <div class="hero-content">
          <div class="hero-kicker">AI · Java · Agent · RAG · 开发笔记</div>
          <h1>记录技术、思考与成长</h1>
          <p>这里是一个面向开发者的交流社区，分享后端实践、AI 应用、项目复盘和学习路线。</p>
          <div class="hero-actions">
            <button @click="scrollToArticles" class="hero-primary">开始阅读</button>
            <button @click="goToAssistant" class="hero-secondary">问问 AI 助手</button>
          </div>
        </div>
        <div class="hero-panel">
          <div class="hero-stat">
            <strong>{{ total || articles.length }}</strong>
            <span>社区文章</span>
          </div>
          <div class="hero-stat">
            <strong>{{ totalViews }}</strong>
            <span>本页阅读</span>
          </div>
          <div class="hero-stat">
            <strong>{{ tags.length }}</strong>
            <span>活跃标签</span>
          </div>
        </div>
      </section>

      <div class="home-shell">
        <main ref="articleSectionRef" class="article-section">
          <div class="section-head">
            <div>
              <span class="section-eyebrow">Latest Posts</span>
              <h2>最新文章</h2>
            </div>
            <div class="search-box">
              <input v-model="searchQuery" type="text" placeholder="搜索文章、用户..." @keyup.enter="goToSearch" />
              <button @click="goToSearch">搜索</button>
            </div>
          </div>

          <div v-if="loading" class="loading">加载中...</div>
          <div v-else-if="articles.length === 0" class="empty">暂无文章</div>

          <article v-for="article in articles" :key="article.articleId" class="article-card">
            <div class="cover" :style="getCoverStyle(article)">
              <img v-if="article.coverImage" :src="article.coverImage" alt="cover" />
              <span v-else>{{ getTagName(article) }}</span>
            </div>
            <div class="article-content">
              <div class="article-topline">
                <span class="tag">{{ getTagName(article) }}</span>
                <span>{{ getReadMinutes(article) }} 分钟阅读</span>
              </div>
              <h3 @click="goToDetail(article.articleId)" class="title">
                {{ article.title || '未命名文章' }}
              </h3>
              <p class="summary">{{ getSummary(article) }}</p>
              <div class="meta">
                <span class="author-avatar">{{ getInitial(article.userId) }}</span>
                <span>作者: {{ getUserName(article.userId) }}</span>
                <span>{{ formatDate(article.publishedAt || article.createdAt) }}</span>
                <span>阅读 {{ article.viewCount || 0 }}</span>
                <span>点赞 {{ article.likeCount || 0 }}</span>
                <span>评论 {{ article.commentCount || 0 }}</span>
              </div>
            </div>
          </article>

          <div v-if="total > 0" class="pagination">
            <div class="pagination-info">
              共 {{ total }} 条，当前显示第 {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, total) }} 条
            </div>

            <div class="pagination-controls">
              <button @click="goToPage(1)" :disabled="currentPage === 1" class="page-btn">首页</button>
              <button @click="prevPage" :disabled="currentPage === 1" class="page-btn">上一页</button>

              <div class="page-numbers">
                <button
                  v-for="page in visiblePages"
                  :key="page"
                  @click="goToPage(page)"
                  :class="['page-number', { active: page === currentPage }]"
                >
                  {{ page }}
                </button>
                <span v-if="visiblePages[visiblePages.length - 1] < totalPages - 1" class="page-ellipsis">...</span>
                <button
                  v-if="visiblePages[visiblePages.length - 1] < totalPages"
                  @click="goToPage(totalPages)"
                  :class="['page-number', { active: totalPages === currentPage }]"
                >
                  {{ totalPages }}
                </button>
              </div>

              <button @click="nextPage" :disabled="currentPage >= totalPages" class="page-btn">下一页</button>
              <button @click="goToPage(totalPages)" :disabled="currentPage >= totalPages" class="page-btn">末页</button>
            </div>

            <div class="pagination-jump">
              <span>跳转至</span>
              <input
                v-model.number="jumpPage"
                type="number"
                :min="1"
                :max="totalPages"
                @keyup.enter="handleJumpPage"
                class="jump-input"
              />
              <span>页</span>
              <button @click="handleJumpPage" class="jump-btn">确定</button>
            </div>
          </div>
        </main>

        <aside class="sidebar">
          <section class="side-card community-card">
            <span class="side-eyebrow">Community</span>
            <h3>技术交流社区</h3>
            <p>分享 AI、后端、工程实践与成长笔记。</p>
            <div class="community-grid">
              <div>
                <strong>{{ total || articles.length }}</strong>
                <span>文章</span>
              </div>
              <div>
                <strong>{{ totalLikes }}</strong>
                <span>点赞</span>
              </div>
            </div>
          </section>

          <section class="side-card">
            <div class="side-title">
              <h3>热门文章</h3>
              <span>按阅读量</span>
            </div>
            <button
              v-for="article in hotArticles"
              :key="article.articleId"
              class="hot-item"
              @click="goToDetail(article.articleId)"
            >
              <strong>{{ article.title || '未命名文章' }}</strong>
              <span>阅读 {{ article.viewCount || 0 }} · 点赞 {{ article.likeCount || 0 }}</span>
            </button>
            <div v-if="hotArticles.length === 0" class="side-empty">暂无推荐</div>
          </section>

          <section class="side-card">
            <div class="side-title">
              <h3>标签云</h3>
              <span>探索主题</span>
            </div>
            <div class="tag-cloud">
              <button v-for="tag in tags" :key="tag.tagId || tag.tagName" @click="searchByTag(tag)">
                {{ tag.tagName }}
              </button>
            </div>
            <div v-if="tags.length === 0" class="side-empty">暂无标签</div>
          </section>

          <section class="side-card promo-card">
            <span>推荐入口</span>
            <h3>用 AI 快速生成草稿</h3>
            <p>让助手帮你整理思路，再由你确认、编辑并发布。</p>
            <button @click="goToAssistant">打开 AI 助手</button>
          </section>
        </aside>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getArticleList } from '@/api/article'
import { getTagList } from '@/api/tag'
import { getUserById } from '@/api/user'
import Layout from '@/components/Layout.vue'

const router = useRouter()

const articles = ref([])
const tags = ref([])
const loading = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(6)
const total = ref(0)
const jumpPage = ref(1)
const userNames = ref({})
const articleSectionRef = ref(null)

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = 1
  let end = totalPages.value

  if (totalPages.value > maxVisible) {
    const half = Math.floor(maxVisible / 2)
    start = Math.max(1, currentPage.value - half)
    end = Math.min(totalPages.value, start + maxVisible - 1)
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1)
    }
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

const hotArticles = computed(() => {
  return [...articles.value]
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, 5)
})

const totalViews = computed(() => {
  return articles.value.reduce((sum, article) => sum + (article.viewCount || 0), 0)
})

const totalLikes = computed(() => {
  return articles.value.reduce((sum, article) => sum + (article.likeCount || 0), 0)
})

const goToSearch = () => {
  if (searchQuery.value.trim()) {
    router.push({ path: '/search', query: { q: searchQuery.value.trim() } })
  }
}

const searchByTag = (tag) => {
  if (!tag?.tagName) return
  router.push({ path: '/search', query: { q: tag.tagName } })
}

const goToAssistant = () => {
  router.push('/assistant')
}

const scrollToArticles = () => {
  articleSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const loadArticles = async () => {
  loading.value = true
  try {
    const params = {
      status: 1,
      isDeleted: 0,
      page: currentPage.value,
      pageSize: pageSize.value,
    }
    if (searchQuery.value) {
      params.query = searchQuery.value
    }
    const res = await getArticleList(params)
    if (res.code === 1) {
      articles.value = res.data.rows || []
      total.value = res.data.total || 0
      jumpPage.value = currentPage.value
      loadAuthorNames(articles.value)
    }
  } catch (error) {
    console.error('加载文章失败:', error)
  } finally {
    loading.value = false
  }
}

const loadTags = async () => {
  try {
    const res = await getTagList({ status: 1, page: 1, pageSize: 18 })
    if (res.code === 1) {
      tags.value = res.data.rows || []
    }
  } catch (error) {
    console.error('加载标签失败:', error)
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    loadArticles()
    window.scrollTo(0, 0)
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    loadArticles()
    window.scrollTo(0, 0)
  }
}

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
    currentPage.value = page
    jumpPage.value = page
    loadArticles()
    window.scrollTo(0, 0)
  }
}

const handleJumpPage = () => {
  const page = Number(jumpPage.value)
  if (page >= 1 && page <= totalPages.value) {
    goToPage(page)
  } else {
    jumpPage.value = currentPage.value
    alert(`请输入 1 到 ${totalPages.value} 之间的页码`)
  }
}

const goToDetail = (id) => {
  router.push(`/article/${id}`)
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return String(dateStr).split(' ')[0]
}

const getTagName = (article) => {
  return article.tagName || '技术笔记'
}

const getSummary = (article) => {
  const source = article.summary || article.content || ''
  return source
    .replace(/[#>*_`[\]()]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 118) || '这篇文章还没有摘要，点进去看看完整内容。'
}

const getReadMinutes = (article) => {
  const length = (article.content || article.summary || '').length
  return Math.max(1, Math.ceil(length / 500))
}

const getInitial = (userId) => {
  const name = getUserName(userId)
  return name.slice(0, 1).toUpperCase()
}

const getCoverStyle = (article) => {
  if (article.coverImage) return {}
  const seed = Number(article.articleId || article.userId || 1)
  const gradients = [
    'linear-gradient(135deg, #4f8ef7, #7c5cfc)',
    'linear-gradient(135deg, #06b6d4, #3b82f6)',
    'linear-gradient(135deg, #22c55e, #14b8a6)',
    'linear-gradient(135deg, #f97316, #ec4899)',
  ]
  return { background: gradients[seed % gradients.length] }
}

const loadAuthorNames = async (articlesList) => {
  const userIds = [...new Set(articlesList.map((article) => article.userId).filter(Boolean))]
  const promises = userIds
    .filter((userId) => !userNames.value[userId])
    .map(async (userId) => {
      try {
        const res = await getUserById(userId)
        if (res.code === 1 && res.data) {
          userNames.value[userId] = res.data.userName || `用户 ${userId}`
        } else {
          userNames.value[userId] = `用户 ${userId}`
        }
      } catch (error) {
        console.warn(`加载用户 ${userId} 信息失败:`, error)
        userNames.value[userId] = `用户 ${userId}`
      }
    })

  await Promise.all(promises)
}

const getUserName = (userId) => {
  if (!userId) return '未知用户'
  return userNames.value[userId] || `用户 ${userId}`
}

onMounted(() => {
  loadArticles()
  loadTags()
})
</script>

<style scoped>
.home-page {
  max-width: 1240px;
  margin: 0 auto;
  padding: 28px 20px 56px;
}

.hero {
  min-height: 330px;
  border-radius: 24px;
  padding: 42px;
  background:
    linear-gradient(135deg, rgba(79, 142, 247, 0.95), rgba(124, 92, 252, 0.94)),
    var(--color-primary);
  color: #fff;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 28px;
  align-items: center;
  box-shadow: 0 28px 60px rgba(79, 142, 247, 0.25);
  overflow: hidden;
  position: relative;
}

.hero::after {
  content: '';
  position: absolute;
  inset: auto -80px -160px auto;
  width: 360px;
  height: 360px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
}

.hero-content,
.hero-panel {
  position: relative;
  z-index: 1;
}

.hero-kicker {
  display: inline-flex;
  padding: 7px 12px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  font-size: 13px;
  margin-bottom: 18px;
}

.hero h1 {
  margin: 0;
  font-size: clamp(34px, 5vw, 58px);
  line-height: 1.05;
}

.hero p {
  max-width: 650px;
  margin: 18px 0 0;
  font-size: 17px;
  color: rgba(255, 255, 255, 0.84);
}

.hero-actions {
  margin-top: 28px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.hero-primary,
.hero-secondary,
.search-box button,
.promo-card button {
  border: none;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 600;
}

.hero-primary,
.hero-secondary {
  height: 42px;
  padding: 0 20px;
}

.hero-primary {
  background: #fff;
  color: #3154d4;
}

.hero-secondary {
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.28);
}

.hero-panel {
  display: grid;
  gap: 12px;
}

.hero-stat {
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
}

.hero-stat strong {
  display: block;
  font-size: 30px;
  line-height: 1;
}

.hero-stat span {
  color: rgba(255, 255, 255, 0.76);
  font-size: 13px;
}

.home-shell {
  margin-top: 28px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: 24px;
  align-items: start;
}

.article-section,
.side-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  box-shadow: var(--shadow-card);
}

.article-section {
  padding: 22px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
  margin-bottom: 18px;
}

.section-eyebrow,
.side-eyebrow {
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.section-head h2 {
  margin: 2px 0 0;
  color: var(--color-text);
  font-size: 26px;
}

.search-box {
  min-width: min(360px, 100%);
  display: flex;
  gap: 8px;
  padding: 6px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: var(--color-surface-soft);
}

.search-box input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: var(--color-text);
  padding: 0 10px;
  outline: none;
}

.search-box button {
  padding: 8px 16px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  color: #fff;
}

.loading,
.empty {
  text-align: center;
  padding: 48px;
  color: var(--color-muted);
}

.article-card {
  display: grid;
  grid-template-columns: 210px minmax(0, 1fr);
  gap: 18px;
  padding: 18px 0;
  border-top: 1px solid var(--color-border);
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.article-card:first-of-type {
  border-top: none;
}

.article-card:hover {
  transform: translateY(-3px);
}

.cover {
  height: 150px;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  letter-spacing: 0;
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.article-content {
  min-width: 0;
}

.article-topline {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--color-muted);
  font-size: 13px;
  flex-wrap: wrap;
}

.tag {
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  color: var(--color-primary);
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.title {
  margin: 10px 0 8px;
  color: var(--color-text);
  cursor: pointer;
  font-size: 22px;
  line-height: 1.35;
}

.title:hover {
  color: var(--color-primary);
}

.summary {
  color: var(--color-muted);
  margin: 0;
  line-height: 1.7;
}

.meta {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  color: var(--color-muted);
  font-size: 13px;
}

.author-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

.sidebar {
  display: grid;
  gap: 18px;
  position: sticky;
  top: 92px;
}

.side-card {
  padding: 20px;
}

.community-card {
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--color-primary) 8%, transparent), transparent),
    var(--color-surface);
}

.side-card h3 {
  margin: 4px 0 8px;
  color: var(--color-text);
}

.side-card p,
.side-empty,
.side-title span {
  color: var(--color-muted);
  font-size: 14px;
}

.community-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 16px;
}

.community-grid div {
  padding: 12px;
  border-radius: 14px;
  background: var(--color-surface-soft);
}

.community-grid strong {
  display: block;
  color: var(--color-text);
  font-size: 22px;
}

.community-grid span {
  color: var(--color-muted);
  font-size: 12px;
}

.side-title {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}

.hot-item {
  width: 100%;
  padding: 12px 0;
  border: none;
  border-top: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
}

.hot-item strong,
.hot-item span {
  display: block;
}

.hot-item strong {
  line-height: 1.45;
}

.hot-item span {
  margin-top: 4px;
  color: var(--color-muted);
  font-size: 12px;
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-cloud button {
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding: 6px 10px;
  background: var(--color-surface-soft);
  color: var(--color-muted);
  cursor: pointer;
}

.tag-cloud button:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.promo-card {
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  color: #fff;
  border: none;
}

.promo-card span,
.promo-card p {
  color: rgba(255, 255, 255, 0.78);
}

.promo-card h3 {
  color: #fff;
}

.promo-card button {
  margin-top: 14px;
  padding: 9px 14px;
  background: #fff;
  color: #3154d4;
}

.pagination {
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}

.pagination-info {
  color: var(--color-muted);
  font-size: 14px;
}

.pagination-controls,
.page-numbers,
.pagination-jump {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.page-btn,
.page-number,
.jump-btn {
  min-height: 38px;
  padding: 0 14px;
  background: var(--color-surface);
  color: var(--color-muted);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  cursor: pointer;
}

.page-number {
  min-width: 38px;
}

.page-btn:hover:not(:disabled),
.page-number:hover,
.jump-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.page-number.active,
.jump-btn {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-ellipsis {
  color: var(--color-muted);
}

.pagination-jump {
  color: var(--color-muted);
  font-size: 14px;
}

.jump-input {
  width: 64px;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  text-align: center;
  background: var(--color-surface);
  color: var(--color-text);
}

@media (max-width: 1024px) {
  .hero,
  .home-shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
  }
}

@media (max-width: 720px) {
  .home-page {
    padding: 18px 12px 40px;
  }

  .hero {
    padding: 28px 22px;
    border-radius: 18px;
  }

  .article-section {
    padding: 16px;
  }

  .section-head {
    align-items: stretch;
    flex-direction: column;
  }

  .search-box {
    min-width: 0;
  }

  .article-card {
    grid-template-columns: 1fr;
  }

  .cover {
    height: 180px;
  }

  .page-numbers {
    display: none;
  }
}
</style>
