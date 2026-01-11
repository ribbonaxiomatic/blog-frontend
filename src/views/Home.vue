<template>
  <Layout>
    <div class="home-container">
      <div class="container">
        <div class="search-bar">
          <input v-model="searchQuery" type="text" placeholder="搜索文章、用户..." @keyup.enter="goToSearch" />
          <button @click="goToSearch">搜索</button>
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
                  <span class="author">作者: {{ getUserName(article.userId) }}</span>
                  <span class="date">{{ formatDate(article.publishedAt || article.createdAt) }}</span>
                  <span class="views">阅读 {{ article.viewCount || 0 }}</span>
                  <span class="likes">点赞 {{ article.likeCount || 0 }}</span>
                </div>
              </div>
            </article>

            <!-- 优化后的分页条 - 无框设计 -->
            <div v-if="total > 0" class="pagination">
              <div class="pagination-info">
                <span>共 {{ total }} 条，当前显示第 {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, total) }} 条</span>
              </div>
              
              <div class="pagination-controls">
                <button 
                  @click="goToPage(1)" 
                  :disabled="currentPage === 1" 
                  class="page-btn"
                  title="首页"
                >
                  首页
                </button>
                
                <button 
                  @click="prevPage" 
                  :disabled="currentPage === 1" 
                  class="page-btn"
                  title="上一页"
                >
                  上一页
                </button>
                
                <div class="page-numbers">
                  <button
                    v-for="page in visiblePages"
                    :key="page"
                    @click="goToPage(page)"
                    :class="['page-number', { active: page === currentPage }]"
                  >
                    {{ page }}
                  </button>
                  
                  <!-- 省略号 -->
                  <span v-if="visiblePages[visiblePages.length - 1] < totalPages - 1" class="page-ellipsis">...</span>
                  
                  <!-- 显示最后一页 -->
                  <button
                    v-if="visiblePages[visiblePages.length - 1] < totalPages"
                    @click="goToPage(totalPages)"
                    :class="['page-number', { active: totalPages === currentPage }]"
                  >
                    {{ totalPages }}
                  </button>
                </div>
                
                <button 
                  @click="nextPage" 
                  :disabled="currentPage >= totalPages" 
                  class="page-btn"
                  title="下一页"
                >
                  下一页
                </button>
                
                <button 
                  @click="goToPage(totalPages)" 
                  :disabled="currentPage >= totalPages" 
                  class="page-btn"
                  title="末页"
                >
                  末页
                </button>
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
import { getUserById } from '@/api/user'
import Layout from '@/components/Layout.vue'

const router = useRouter()

const articles = ref([])
const loading = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(5)
const total = ref(0)
const jumpPage = ref(1)
const userNames = ref({}) // 缓存用户ID到用户名的映射

// 计算总页数
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

// 计算可见的页码列表
const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5 // 减少显示页码数，使布局更紧凑
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

// 添加搜索跳转方法
const goToSearch = () => {
  if (searchQuery.value.trim()) {
    router.push({
      path: '/search',
      query: { q: searchQuery.value.trim() }
    })
  }
}

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
      // 加载所有文章的作者信息
      loadAuthorNames(articles.value)
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

// 加载作者用户名
const loadAuthorNames = async (articlesList) => {
  // 获取所有唯一的 userId
  const userIds = [...new Set(articlesList.map(article => article.userId).filter(Boolean))]
  
  // 为每个 userId 加载用户信息（如果还没有缓存）
  const promises = userIds
    .filter(userId => !userNames.value[userId]) // 只加载未缓存的
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

// 获取用户名
const getUserName = (userId) => {
  if (!userId) return '未知用户'
  return userNames.value[userId] || `用户 ${userId}`
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

/* 优化后的分页样式 - 无框设计 */
.pagination {
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 0;
  background: transparent;
  box-shadow: none;
  border: none;
}

.pagination-info {
  color: #666;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 0;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.page-btn {
  padding: 10px 16px;
  background: #fff;
  color: #606266;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.page-btn:hover:not(:disabled) {
  background: #f5f7fa;
  border-color: #c0c4cc;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.page-btn:disabled {
  background: #f5f7fa;
  color: #c0c4cc;
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
  box-shadow: none;
}

.page-numbers {
  display: flex;
  gap: 6px;
  margin: 0 8px;
}

.page-number {
  min-width: 40px;
  height: 40px;
  padding: 0 12px;
  background: #fff;
  color: #606266;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.page-number:hover {
  background: #f5f7fa;
  border-color: #409eff;
  color: #409eff;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.page-number.active {
  background: #409eff;
  color: #fff;
  border-color: #409eff;
  font-weight: 600;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.page-ellipsis {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 40px;
  color: #c0c4cc;
  font-weight: 500;
}

.pagination-jump {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
  background: #f8f9fa;
  padding: 10px 16px;
  border-radius: 8px;
}

.jump-input {
  width: 60px;
  padding: 8px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  text-align: center;
  font-size: 14px;
  transition: all 0.2s;
}

.jump-input:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.jump-btn {
  padding: 8px 16px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.jump-btn:hover {
  background: #66b1ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.2);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .pagination-controls {
    gap: 6px;
  }
  
  .page-btn, .page-number {
    padding: 8px 12px;
    min-width: 36px;
    height: 36px;
    font-size: 13px;
  }
  
  .page-numbers {
    margin: 0 4px;
    gap: 4px;
  }
  
  .pagination-jump {
    flex-wrap: wrap;
    justify-content: center;
    padding: 8px 12px;
  }
}

@media (max-width: 480px) {
  .page-numbers {
    display: none;
  }
  
  .pagination-info {
    font-size: 13px;
  }
}
</style>