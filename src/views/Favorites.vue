<template>
  <Layout>
    <div class="favorites-page">
      <section class="favorites-hero">
        <span>Favorites</span>
        <h1>我的收藏</h1>
        <p>把值得反复阅读的文章留在这里，形成自己的技术资料库。</p>
      </section>

      <section class="favorites-panel">
        <div v-if="loading" class="loading">加载中...</div>
        <div v-else-if="articles.length === 0" class="empty">暂无收藏</div>
        <div v-else class="articles-list">
          <article v-for="article in articles" :key="article.articleId" class="article-card">
            <div class="cover-image" :style="getCoverStyle(article)">
              <img v-if="article.coverImage" :src="article.coverImage" alt="cover" />
              <span v-else>{{ article.tagName || '收藏' }}</span>
            </div>
            <div class="article-content">
              <div class="article-header">
                <div>
                  <span class="tag">{{ article.tagName || '技术笔记' }}</span>
                  <h3 @click="goToDetail(article.articleId)" class="title">
                    {{ article.title || '未命名文章' }}
                  </h3>
                </div>
                <button @click="removeFavorite(article.articleId)" class="remove-btn" title="取消收藏">
                  取消收藏
                </button>
              </div>
              <p class="summary">{{ getSummary(article) }}</p>
              <div class="meta">
                <span>{{ formatDate(article.publishedAt || article.createdAt) }}</span>
                <span>阅读 {{ article.viewCount || 0 }}</span>
                <span>点赞 {{ article.likeCount || 0 }}</span>
              </div>
            </div>
          </article>
        </div>

        <div v-if="total > pageSize" class="pagination">
          <button @click="prevPage" :disabled="currentPage === 1">上一页</button>
          <span>第 {{ currentPage }} 页，共 {{ Math.ceil(total / pageSize) }} 页</span>
          <button @click="nextPage" :disabled="currentPage >= Math.ceil(total / pageSize)">
            下一页
          </button>
        </div>
      </section>
    </div>
  </Layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getFavoriteList, toggleArticleFavorite } from '@/api/favorite'
import Layout from '@/components/Layout.vue'

const router = useRouter()
const userStore = useUserStore()

const articles = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const loadFavorites = async () => {
  loading.value = true
  try {
    const res = await getFavoriteList({
      userId: userStore.userInfo.userId,
      page: currentPage.value,
      pageSize: pageSize.value,
    })
    if (res.code === 1) {
      articles.value = res.data.rows || []
      total.value = res.data.total || 0
    }
  } catch (error) {
    console.error('加载收藏失败:', error)
  } finally {
    loading.value = false
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    loadFavorites()
    window.scrollTo(0, 0)
  }
}

const nextPage = () => {
  if (currentPage.value < Math.ceil(total.value / pageSize.value)) {
    currentPage.value++
    loadFavorites()
    window.scrollTo(0, 0)
  }
}

const goToDetail = (id) => {
  router.push(`/article/${id}`)
}

const removeFavorite = async (articleId) => {
  if (!confirm('确定要取消收藏这篇文章吗？')) {
    return
  }
  try {
    const res = await toggleArticleFavorite({
      articleId,
      userId: userStore.userInfo.userId,
    })
    if (res.code === 1) {
      await loadFavorites()
      if (articles.value.length === 0 && currentPage.value > 1) {
        currentPage.value--
        await loadFavorites()
      }
    }
  } catch (error) {
    console.error('取消收藏失败:', error)
    alert('取消收藏失败，请重试')
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return String(dateStr).split(' ')[0]
}

const getSummary = (article) => {
  return (article.summary || article.content || '')
    .replace(/[#>*_`[\]()]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 130) || '这篇文章还没有摘要。'
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

onMounted(() => {
  loadFavorites()
})
</script>

<style scoped>
.favorites-page {
  max-width: 1120px;
  margin: 0 auto;
  padding: 42px 20px 56px;
}

.favorites-hero,
.favorites-panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 24px;
  box-shadow: var(--shadow-card);
}

.favorites-hero {
  margin-bottom: 24px;
  padding: 36px;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 16%, transparent), color-mix(in srgb, var(--color-accent) 14%, transparent)),
    var(--color-surface);
}

.favorites-hero span {
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.favorites-hero h1 {
  margin: 6px 0 8px;
  color: var(--color-text);
  font-size: clamp(30px, 4vw, 46px);
}

.favorites-hero p {
  margin: 0;
  color: var(--color-muted);
}

.favorites-panel {
  padding: 24px;
}

.loading,
.empty {
  text-align: center;
  padding: 48px;
  color: var(--color-muted);
}

.articles-list {
  display: grid;
  gap: 18px;
}

.article-card {
  display: grid;
  grid-template-columns: 210px minmax(0, 1fr);
  gap: 18px;
  padding: 18px;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
  border-radius: 18px;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.article-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-hover);
}

.cover-image {
  height: 145px;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 800;
}

.cover-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.article-content {
  min-width: 0;
}

.article-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 10px;
}

.tag {
  display: inline-flex;
  margin-bottom: 8px;
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  color: var(--color-primary);
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.title {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  color: var(--color-text);
  cursor: pointer;
  line-height: 1.35;
}

.title:hover {
  color: var(--color-primary);
}

.remove-btn {
  padding: 8px 12px;
  background: color-mix(in srgb, #f56c6c 14%, transparent);
  color: #f56c6c;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
  flex-shrink: 0;
}

.summary {
  color: var(--color-muted);
  line-height: 1.7;
  margin: 0 0 15px;
}

.meta {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  font-size: 14px;
  color: var(--color-muted);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 18px;
  margin-top: 28px;
  color: var(--color-muted);
  flex-wrap: wrap;
}

.pagination button {
  padding: 8px 16px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 999px;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 760px) {
  .favorites-page {
    padding: 22px 12px 40px;
  }

  .favorites-hero,
  .favorites-panel {
    padding: 18px;
    border-radius: 18px;
  }

  .article-card {
    grid-template-columns: 1fr;
  }

  .cover-image {
    height: 170px;
  }
}
</style>
