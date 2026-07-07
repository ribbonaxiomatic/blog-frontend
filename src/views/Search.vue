<template>
  <Layout>
    <div class="search-page">
      <section class="search-hero">
        <span>Search</span>
        <h1>探索社区内容</h1>
        <p>搜索文章、作者和技术主题，快速找到你需要的经验与灵感。</p>
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
      </section>

      <section class="search-results">
        <div class="result-tabs">
          <button @click="activeTab = 'all'" :class="['tab', { active: activeTab === 'all' }]">全部</button>
          <button @click="activeTab = 'articles'" :class="['tab', { active: activeTab === 'articles' }]">文章</button>
          <button @click="activeTab = 'users'" :class="['tab', { active: activeTab === 'users' }]">用户</button>
        </div>

        <div v-if="loading" class="loading">搜索中...</div>

        <div v-else-if="hasResults" class="results-content">
          <div v-if="activeTab === 'all'" class="all-results">
            <div v-if="userResults.length > 0" class="result-section">
              <h3 class="section-title">用户</h3>
              <div class="users-grid">
                <div
                  v-for="user in userResults.slice(0, 3)"
                  :key="user.userId"
                  class="user-card"
                  @click="goToProfile(user.userId)"
                >
                  <div class="user-avatar">{{ getInitial(user.userName) }}</div>
                  <div class="user-info">
                    <h4 class="username">{{ user.userName }}</h4>
                    <p class="user-email">{{ user.email }}</p>
                    <p v-if="user.signature" class="user-signature">{{ user.signature }}</p>
                  </div>
                </div>
              </div>
              <button v-if="userResults.length > 3" @click="activeTab = 'users'" class="view-more-btn">
                查看全部 {{ userResults.length }} 个用户
              </button>
            </div>

            <div v-if="articleResults.length > 0" class="result-section">
              <h3 class="section-title">文章</h3>
              <div class="articles-list">
                <article
                  v-for="article in articleResults.slice(0, 5)"
                  :key="article.articleId"
                  class="article-card"
                >
                  <div class="cover-image" :style="getCoverStyle(article)">
                    <img v-if="article.coverImage" :src="article.coverImage" alt="cover" />
                    <span v-else>{{ article.tagName || '技术' }}</span>
                  </div>
                  <div class="article-content">
                    <h3 @click="goToArticle(article.articleId)" class="title">{{ article.title }}</h3>
                    <p class="summary">{{ getSummary(article, 100) }}</p>
                    <div class="meta">
                      <span>作者: {{ article.authorName || article.userId }}</span>
                      <span>{{ formatDate(article.publishedAt) }}</span>
                      <span>阅读 {{ article.viewCount || 0 }}</span>
                    </div>
                  </div>
                </article>
              </div>
              <button v-if="articleResults.length > 5" @click="activeTab = 'articles'" class="view-more-btn">
                查看全部 {{ articleResults.length }} 篇文章
              </button>
            </div>
          </div>

          <div v-if="activeTab === 'articles'" class="articles-results">
            <h3 class="results-count">找到 {{ articleResults.length }} 篇相关文章</h3>
            <div class="articles-list">
              <article v-for="article in articleResults" :key="article.articleId" class="article-card">
                <div class="cover-image" :style="getCoverStyle(article)">
                  <img v-if="article.coverImage" :src="article.coverImage" alt="cover" />
                  <span v-else>{{ article.tagName || '技术' }}</span>
                </div>
                <div class="article-content">
                  <h3 @click="goToArticle(article.articleId)" class="title">{{ article.title }}</h3>
                  <p class="summary">{{ getSummary(article, 150) }}</p>
                  <div class="meta">
                    <span>作者: {{ article.authorName || article.userId }}</span>
                    <span>{{ formatDate(article.publishedAt) }}</span>
                    <span>阅读 {{ article.viewCount || 0 }}</span>
                    <span>点赞 {{ article.likeCount || 0 }}</span>
                  </div>
                </div>
              </article>
            </div>
          </div>

          <div v-if="activeTab === 'users'" class="users-results">
            <h3 class="results-count">找到 {{ userResults.length }} 位相关用户</h3>
            <div class="users-grid">
              <div v-for="user in userResults" :key="user.userId" class="user-card">
                <div class="user-avatar">{{ getInitial(user.userName) }}</div>
                <div class="user-info">
                  <h4 @click="goToProfile(user.userId)" class="username">{{ user.userName }}</h4>
                  <p class="user-email">{{ user.email }}</p>
                  <p v-if="user.signature" class="user-signature">{{ user.signature }}</p>
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

        <div v-else-if="searchQuery" class="no-results">
          <p>没有找到相关结果</p>
          <p class="suggestion">尝试使用不同的关键词或更具体的搜索条件</p>
        </div>

        <div v-else class="search-tips">
          <h3>搜索提示</h3>
          <ul>
            <li>输入文章标题、内容关键词进行搜索</li>
            <li>输入用户名或邮箱搜索用户</li>
            <li>支持中英文混合搜索</li>
          </ul>
        </div>
      </section>
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

const hasResults = computed(() => {
  return articleResults.value.length > 0 || userResults.value.length > 0
})

const handleSearch = async () => {
  if (!searchQuery.value.trim()) return

  loading.value = true
  try {
    await Promise.all([searchArticles(), searchUsers()])
  } catch (error) {
    console.error('搜索失败:', error)
  } finally {
    loading.value = false
  }
}

const searchArticles = async () => {
  try {
    const res = await getArticleList({
      query: searchQuery.value,
      status: 1,
      isDeleted: 0,
      page: 1,
      pageSize: 50,
    })
    if (res.code === 1) {
      articleResults.value = res.data.rows || []
    }
  } catch (error) {
    console.error('搜索文章失败:', error)
    articleResults.value = []
  }
}

const searchUsers = async () => {
  try {
    const res = await getUserList({
      query: searchQuery.value,
      page: 1,
      pageSize: 50,
      status: 0,
    })
    if (res.code === 1) {
      const users = res.data.rows || []
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

const checkFollowStatus = async (users) => {
  try {
    const res = await getFollowingList({
      followerId: userStore.userInfo.userId,
      page: 1,
      pageSize: 1000,
    })
    if (res.code === 1) {
      const followingList = res.data.rows || []
      const followingIds = new Set(followingList.map((u) => u.userId))
      users.forEach((user) => {
        user.isFollowing = followingIds.has(user.userId)
      })
    }
  } catch (error) {
    console.error('检查关注状态失败:', error)
  }
}

const handleToggleFollow = async (user) => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }

  try {
    const res = await toggleFollow({
      followerId: userStore.userInfo.userId,
      followingId: user.userId,
    })
    if (res.code === 1) {
      user.isFollowing = !user.isFollowing
    }
  } catch (error) {
    console.error('关注操作失败:', error)
  }
}

const goToArticle = (articleId) => {
  router.push(`/article/${articleId}`)
}

const goToProfile = (userId) => {
  router.push(`/profile/${userId}`)
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return String(dateStr).split(' ')[0]
}

const getSummary = (article, length) => {
  return (article.summary || article.content || '')
    .replace(/[#>*_`[\]()]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, length)
}

const getInitial = (name = '') => {
  return (name || '用').slice(0, 1).toUpperCase()
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
  if (route.query.q) {
    searchQuery.value = route.query.q
    handleSearch()
  }
})
</script>

<style scoped>
.search-page {
  max-width: 1180px;
  margin: 0 auto;
  padding: 42px 20px 56px;
}

.search-hero,
.search-results {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 24px;
  box-shadow: var(--shadow-card);
}

.search-hero {
  margin-bottom: 24px;
  padding: 36px;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 18%, transparent), color-mix(in srgb, var(--color-accent) 14%, transparent)),
    var(--color-surface);
}

.search-hero span {
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.search-hero h1 {
  margin: 6px 0 8px;
  color: var(--color-text);
  font-size: clamp(30px, 4vw, 46px);
}

.search-hero p {
  margin: 0 0 22px;
  color: var(--color-muted);
}

.search-input-wrapper {
  display: flex;
  max-width: 760px;
  padding: 6px;
  border-radius: 999px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.search-input {
  flex: 1;
  min-width: 0;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: var(--color-text);
  font-size: 16px;
  outline: none;
}

.search-btn,
.follow-btn {
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  color: #fff;
  border: none;
  cursor: pointer;
}

.search-btn {
  padding: 12px 24px;
  border-radius: 999px;
  font-size: 16px;
}

.search-results {
  padding: 24px;
}

.result-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--color-border);
  flex-wrap: wrap;
}

.tab {
  padding: 10px 20px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  color: var(--color-muted);
  font-size: 16px;
}

.tab.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.loading,
.no-results,
.search-tips {
  text-align: center;
  padding: 46px 20px;
  color: var(--color-muted);
}

.section-title,
.results-count,
.search-tips h3 {
  color: var(--color-text);
}

.section-title {
  margin: 30px 0 15px;
  font-size: 18px;
}

.results-count {
  margin-bottom: 20px;
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;
  margin-bottom: 26px;
}

.user-card,
.article-card {
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  cursor: pointer;
}

.user-card:hover,
.article-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.user-avatar {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  flex-shrink: 0;
}

.username {
  margin: 0 0 5px;
  color: var(--color-text);
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}

.user-email,
.user-signature,
.user-stats,
.meta,
.summary,
.suggestion {
  color: var(--color-muted);
}

.user-email,
.user-signature {
  margin: 0 0 6px;
  font-size: 14px;
}

.user-stats,
.meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 12px;
}

.follow-btn {
  margin-top: 10px;
  padding: 7px 13px;
  border-radius: 999px;
  font-size: 12px;
}

.follow-btn.following {
  background: #909399;
}

.articles-list {
  display: grid;
  gap: 18px;
}

.article-card {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  gap: 18px;
  padding: 18px;
}

.cover-image {
  height: 96px;
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
}

.cover-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.title {
  margin: 0 0 8px;
  font-size: 19px;
  color: var(--color-text);
  cursor: pointer;
}

.title:hover {
  color: var(--color-primary);
}

.summary {
  margin: 0 0 12px;
  line-height: 1.6;
}

.view-more-btn {
  display: block;
  margin: 20px auto;
  padding: 10px 18px;
  background: var(--color-surface-soft);
  color: var(--color-muted);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  cursor: pointer;
}

.view-more-btn:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.search-tips ul {
  list-style: none;
  padding: 0;
  margin: 12px 0 0;
}

.search-tips li {
  margin-bottom: 8px;
}

@media (max-width: 720px) {
  .search-page {
    padding: 22px 12px 40px;
  }

  .search-hero,
  .search-results {
    padding: 18px;
    border-radius: 18px;
  }

  .article-card {
    grid-template-columns: 1fr;
  }

  .cover-image {
    height: 150px;
  }
}
</style>
