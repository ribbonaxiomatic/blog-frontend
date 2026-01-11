<template>
  <Layout>
    <div class="search-container">
      <div class="container">
        <!-- 搜索框 -->
        <div class="search-header">
          <div class="search-input-wrapper">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索文章、用户..."
              @keyup.enter="handleSearch"
              class="search-input"
            />
            <button @click="handleSearch" class="search-btn">搜索</button>
          </div>
        </div>

        <!-- 搜索结果 -->
        <div class="search-results">
          <!-- 标签切换 -->
          <div class="result-tabs">
            <button
              @click="activeTab = 'all'"
              :class="['tab', { active: activeTab === 'all' }]"
            >
              全部
            </button>
            <button
              @click="activeTab = 'articles'"
              :class="['tab', { active: activeTab === 'articles' }]"
            >
              文章
            </button>
            <button
              @click="activeTab = 'users'"
              :class="['tab', { active: activeTab === 'users' }]"
            >
              用户
            </button>
          </div>

          <!-- 加载状态 -->
          <div v-if="loading" class="loading">搜索中...</div>

          <!-- 搜索结果内容 -->
          <div v-else-if="hasResults" class="results-content">
            <!-- 全部结果 -->
            <div v-if="activeTab === 'all'" class="all-results">
              <!-- 用户结果 -->
              <div v-if="userResults.length > 0" class="result-section">
                <h3 class="section-title">用户</h3>
                <div class="users-grid">
                  <div
                    v-for="user in userResults.slice(0, 3)"
                    :key="user.userId"
                    class="user-card"
                    @click="goToProfile(user.userId)"
                  >
                    
                    <div class="user-info">
                      <h4 class="username">{{ user.userName }}</h4>
                      <p class="user-email">{{ user.email }}</p>
                      <p v-if="user.signature" class="user-signature">
                        {{ user.signature }}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  v-if="userResults.length > 3"
                  @click="activeTab = 'users'"
                  class="view-more-btn"
                >
                  查看全部 {{ userResults.length }} 个用户
                </button>
              </div>

              <!-- 文章结果 -->
              <div v-if="articleResults.length > 0" class="result-section">
                <h3 class="section-title">文章</h3>
                <div class="articles-list">
                  <article
                    v-for="article in articleResults.slice(0, 5)"
                    :key="article.articleId"
                    class="article-card"
                  >
                    <div v-if="article.coverImage" class="cover-image">
                      
                    </div>
                    <div class="article-content">
                      <h3
                        @click="goToArticle(article.articleId)"
                        class="title"
                      >
                        {{ article.title }}
                      </h3>
                      <p class="summary">
                        {{ article.summary || article.content?.substring(0, 100) }}
                      </p>
                      <div class="meta">
                        <span class="author">作者: {{ article.authorName || article.userId }}</span>
                        <span class="date">{{ formatDate(article.publishedAt) }}</span>
                        <span class="views">阅读 {{ article.viewCount || 0 }}</span>
                      </div>
                    </div>
                  </article>
                </div>
                <button
                  v-if="articleResults.length > 5"
                  @click="activeTab = 'articles'"
                  class="view-more-btn"
                >
                  查看全部 {{ articleResults.length }} 篇文章
                </button>
              </div>
            </div>

            <!-- 文章结果 -->
            <div v-if="activeTab === 'articles'" class="articles-results">
              <h3 class="results-count">
                找到 {{ articleResults.length }} 篇相关文章
              </h3>
              <div class="articles-list">
                <article
                  v-for="article in articleResults"
                  :key="article.articleId"
                  class="article-card"
                >
                  <div v-if="article.coverImage" class="cover-image">
                    
                  </div>
                  <div class="article-content">
                    <h3 @click="goToArticle(article.articleId)" class="title">
                      {{ article.title }}
                    </h3>
                    <p class="summary">
                      {{ article.summary || article.content?.substring(0, 150) }}
                    </p>
                    <div class="meta">
                      <span class="author">作者: {{ article.authorName || article.userId }}</span>
                      <span class="date">{{ formatDate(article.publishedAt) }}</span>
                      <span class="views">阅读 {{ article.viewCount || 0 }}</span>
                      <span class="likes">点赞 {{ article.likeCount || 0 }}</span>
                    </div>
                  </div>
                </article>
              </div>
            </div>

            <!-- 用户结果 -->
            <div v-if="activeTab === 'users'" class="users-results">
              <h3 class="results-count">
                找到 {{ userResults.length }} 位相关用户
              </h3>
              <div class="users-grid">
                <div
                  v-for="user in userResults"
                  :key="user.userId"
                  class="user-card"
                >
                  
                  <div class="user-info">
                    <h4
                      @click="goToProfile(user.userId)"
                      class="username"
                    >
                      {{ user.userName }}
                    </h4>
                    <p class="user-email">{{ user.email }}</p>
                    <p v-if="user.signature" class="user-signature">
                      {{ user.signature }}
                    </p>
                    <div class="user-stats">
                      <span>文章 {{ user.articleCount || 0 }}</span>
                      <span>粉丝 {{ user.followerCount || 0 }}</span>
                      <span>关注 {{ user.followingCount || 0 }}</span>
                    </div>
                    <button
                      v-if="userStore.isLoggedIn && user.userId !== userStore.userInfo?.userId"
                      @click.stop="handleToggleFollow(user)"
                      :class="['follow-btn', { following: user.isFollowing }]"
                    >
                      {{ user.isFollowing ? '已关注' : '关注' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 无结果 -->
          <div v-else-if="searchQuery" class="no-results">
            <p>没有找到相关结果</p>
            <p class="suggestion">尝试使用不同的关键词或更具体的搜索条件</p>
          </div>

          <!-- 搜索提示 -->
          <div v-else class="search-tips">
            <h3>搜索提示</h3>
            <ul>
              <li>输入文章标题、内容关键词进行搜索</li>
              <li>输入用户名或邮箱搜索用户</li>
              <li>支持中英文混合搜索</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getArticleList } from '@/api/article'
import { getUserList } from '@/api/user'
import { toggleFollow, getFollowingList } from '@/api/follow'
import Layout from '@/components/Layout.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const searchQuery = ref('')
const loading = ref(false)
const activeTab = ref('all')
const articleResults = ref([])
const userResults = ref([])

// 计算属性
const hasResults = computed(() => {
  return articleResults.value.length > 0 || userResults.value.length > 0
})

// 搜索处理
const handleSearch = async () => {
  if (!searchQuery.value.trim()) return

  loading.value = true
  try {
    // 并行搜索文章和用户
    await Promise.all([searchArticles(), searchUsers()])
  } catch (error) {
    console.error('搜索失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索文章
const searchArticles = async () => {
  try {
    const res = await getArticleList({
      query: searchQuery.value,
      status: 1,
      isDeleted: 0,
      page: 1,
      pageSize: 50 // 搜索结果显示更多
    })
    if (res.code === 1) {
      articleResults.value = res.data.rows || []
    }
  } catch (error) {
    console.error('搜索文章失败:', error)
    articleResults.value = []
  }
}

// 搜索用户
const searchUsers = async () => {
  try {
    const res = await getUserList({
      query: searchQuery.value,
      page: 1,
      pageSize: 50,
      status: 0
    })
    if (res.code === 1) {
      const users = res.data.rows || []
      // 检查关注状态
      if (userStore.isLoggedIn) {
        await checkFollowStatus(users)
      }
      userResults.value = users
    }
  } catch (error) {
    console.error('搜索用户失败:', error)
    userResults.value = []
  }
}

// 检查关注状态
const checkFollowStatus = async (users) => {
  try {
    const res = await getFollowingList({
      followerId: userStore.userInfo.userId,
      page: 1,
      pageSize: 1000
    })
    if (res.code === 1) {
      const followingList = res.data.rows || []
      const followingIds = new Set(followingList.map(u => u.userId))
      
      users.forEach(user => {
        user.isFollowing = followingIds.has(user.userId)
      })
    }
  } catch (error) {
    console.error('检查关注状态失败:', error)
  }
}

// 关注/取消关注
const handleToggleFollow = async (user) => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }

  try {
    const res = await toggleFollow({
      followerId: userStore.userInfo.userId,
      followingId: user.userId
    })
    if (res.code === 1) {
      // 更新关注状态
      user.isFollowing = !user.isFollowing
    }
  } catch (error) {
    console.error('关注操作失败:', error)
  }
}

// 跳转到文章详情
const goToArticle = (articleId) => {
  router.push(`/article/${articleId}`)
}

// 跳转到用户主页
const goToProfile = (userId) => {
  router.push(`/profile/${userId}`)
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return dateStr.split(' ')[0]
}

// 从路由参数获取搜索关键词
onMounted(() => {
  if (route.query.q) {
    searchQuery.value = route.query.q
    handleSearch()
  }
})
</script>

<style scoped>
.search-container {
  min-height: calc(100vh - 200px);
  padding: 40px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.search-header {
  margin-bottom: 30px;
}

.search-input-wrapper {
  display: flex;
  max-width: 600px;
  margin: 0 auto;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #409eff;
  border-right: none;
  border-radius: 8px 0 0 8px;
  font-size: 16px;
  outline: none;
}

.search-btn {
  padding: 12px 24px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 0 8px 8px 0;
  cursor: pointer;
  font-size: 16px;
}

.search-btn:hover {
  background: #66b1ff;
}

.result-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  border-bottom: 1px solid #eee;
}

.tab {
  padding: 10px 20px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  color: #666;
  font-size: 16px;
}

.tab.active {
  color: #409eff;
  border-bottom-color: #409eff;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #999;
}

.section-title {
  margin: 30px 0 15px 0;
  color: #333;
  font-size: 18px;
}

.results-count {
  margin-bottom: 20px;
  color: #666;
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
}

.user-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
}

.username {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.user-email {
  margin: 0 0 5px 0;
  color: #999;
  font-size: 14px;
}

.user-signature {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 14px;
}

.user-stats {
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
  font-size: 12px;
  color: #999;
}

.follow-btn {
  padding: 6px 12px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.follow-btn:hover {
  background: #66b1ff;
}

.follow-btn.following {
  background: #909399;
}

.follow-btn.following:hover {
  background: #a6a9ad;
}

.articles-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.article-card {
  display: flex;
  gap: 20px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.article-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.cover-image {
  width: 120px;
  height: 80px;
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
}

.title {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #333;
  cursor: pointer;
  transition: color 0.3s;
}

.title:hover {
  color: #409eff;
}

.summary {
  margin: 0 0 10px 0;
  color: #666;
  line-height: 1.5;
}

.meta {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #999;
}

.view-more-btn {
  display: block;
  margin: 20px auto;
  padding: 10px 20px;
  background: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.view-more-btn:hover {
  background: #ebebeb;
}

.no-results {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.suggestion {
  margin-top: 10px;
  font-size: 14px;
}

.search-tips {
  padding: 40px;
  text-align: center;
  color: #999;
}

.search-tips h3 {
  margin-bottom: 15px;
  color: #666;
}

.search-tips ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.search-tips li {
  margin-bottom: 8px;
}
</style>