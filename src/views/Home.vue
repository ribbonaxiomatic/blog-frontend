<template>
  <Layout>
    <div class="home-container">
      <div class="container">
        <div class="search-bar">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索文章..."
            @keyup.enter="handleSearch"
          />
          <button @click="handleSearch">搜索</button>
        </div>

        <div class="content">
          <div class="article-list">
            <div v-if="loading" class="loading">加载中...</div>
            <div v-else-if="articles.length === 0" class="empty">暂无文章</div>
            <article v-for="article in articles" :key="article.articleId" class="article-card">
              <div v-if="article.coverImage" class="cover-image">
                <img :src="article.coverImage" alt="cover" />
              </div>
              <div class="article-content">
                <h3 @click="goToDetail(article.articleId)" class="title">
                  {{ article.title }}
                </h3>
                <p class="summary">{{ article.summary || article.content?.substring(0, 100) }}</p>
                <div class="meta">
                  <span class="tag">{{ article.tagName }}</span>
                  <span class="author">作者: {{ article.userId }}</span>
                  <span class="date">{{ formatDate(article.publishedAt || article.createdAt) }}</span>
                  <span class="views">阅读 {{ article.viewCount || 0 }}</span>
                  <span class="likes">点赞 {{ article.likeCount || 0 }}</span>
                </div>
              </div>
            </article>

            <div v-if="total > 0" class="pagination">
              <div class="pagination-info">
                <span>共 {{ total }} 条，每页 {{ pageSize }} 条</span>
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
                </div>
                
                <button @click="nextPage" :disabled="currentPage >= totalPages" class="page-btn">下一页</button>
                <button @click="goToPage(totalPages)" :disabled="currentPage >= totalPages" class="page-btn">末页</button>
              </div>
              <div class="pagination-jump">
                <span>跳转到</span>
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
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getArticleList } from '@/api/article'
import Layout from '@/components/Layout.vue'

const router = useRouter()

const articles = ref([])
const loading = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const jumpPage = ref(1)

// 计算总页数
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

// 计算可见的页码列表
const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 7 // 最多显示7个页码
  let start = 1
  let end = totalPages.value

  if (totalPages.value > maxVisible) {
    const half = Math.floor(maxVisible / 2)
    start = Math.max(1, currentPage.value - half)
    end = Math.min(totalPages.value, start + maxVisible - 1)
    
    // 如果接近末尾，调整起始位置
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1)
    }
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

const loadArticles = async () => {
  loading.value = true
  try {
    const params = {
      status: 1, // 只查询已发布的文章
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
      // 同步跳转页码
      jumpPage.value = currentPage.value
    }
  } catch (error) {
    console.error('加载文章失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  jumpPage.value = 1
  loadArticles()
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
  return dateStr.split(' ')[0]
}

onMounted(() => {
  loadArticles()
})
</script>

<style scoped>
.home-container {
  min-height: calc(100vh - 200px);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  padding: 20px 0;
}

.search-bar input {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.search-bar input:focus {
  outline: none;
  border-color: #409eff;
}

.search-bar button {
  padding: 12px 24px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.search-bar button:hover {
  background: #66b1ff;
}

.content {
  display: flex;
  gap: 20px;
}

.article-list {
  flex: 1;
}

.loading,
.empty {
  text-align: center;
  padding: 40px;
  color: #999;
}

.article-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 20px;
}

.cover-image {
  width: 200px;
  height: 150px;
  flex-shrink: 0;
  border-radius: 4px;
  overflow: hidden;
}

.cover-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.article-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 10px 0;
  color: #333;
  cursor: pointer;
  transition: color 0.3s;
}

.title:hover {
  color: #409eff;
}

.summary {
  color: #666;
  line-height: 1.6;
  margin: 0 0 15px 0;
  flex: 1;
}

.meta {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 14px;
  color: #999;
}

.tag {
  background: #ecf5ff;
  color: #409eff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.pagination {
  margin-top: 30px;
  padding: 30px 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pagination-info {
  text-align: center;
  margin-bottom: 20px;
  color: #666;
  font-size: 14px;
}

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.page-btn {
  padding: 8px 16px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.page-btn:disabled {
  background: #c0c4cc;
  cursor: not-allowed;
  opacity: 0.6;
}

.page-btn:hover:not(:disabled) {
  background: #66b1ff;
  transform: translateY(-1px);
}

.page-numbers {
  display: flex;
  gap: 5px;
  margin: 0 10px;
}

.page-number {
  min-width: 36px;
  height: 36px;
  padding: 0 12px;
  background: #fff;
  color: #606266;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-number:hover {
  color: #409eff;
  border-color: #409eff;
}

.page-number.active {
  background: #409eff;
  color: #fff;
  border-color: #409eff;
  font-weight: 600;
}

.pagination-jump {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
}

.jump-input {
  width: 60px;
  padding: 6px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
}

.jump-input:focus {
  outline: none;
  border-color: #409eff;
}

.jump-btn {
  padding: 6px 16px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.jump-btn:hover {
  background: #66b1ff;
}
</style>

