<template>
  <Layout>
    <div class="article-detail-container">
      <div class="container">
        <div v-if="loading" class="loading">加载中...</div>
        <div v-else-if="article" class="article-detail">
          <h1 class="title">{{ article.title }}</h1>
          <div class="meta">
            <span class="tag">{{ article.tagName }}</span>
            <div class="author-info">
              <router-link :to="`/profile/${article.userId}`" class="author-link">
                <img
                  :src="authorInfo.avatar"
                  :alt="authorName || `用户 ${article.userId}`"
                  class="author-avatar"
                  @error="handleAvatarError"
                />
                <span class="author">作者: {{ authorName || `用户 ${article.userId}` }}</span>
              </router-link>
            </div>
            <span class="date">{{ formatDate(article.publishedAt || article.createdAt) }}</span>
            <span class="views">阅读 {{ article.viewCount || 0 }}</span>
          </div>
          <div v-if="article.coverImage" class="cover-image">
            <img :src="article.coverImage" alt="cover" />
          </div>
          <div class="content" v-html="formatContent(article.content)"></div>
          <div class="actions">
            <button
              @click="handleLike"
              :class="['action-btn', { active: isLiked }]"
            >
              👍 点赞 ({{ article.likeCount || 0 }})
            </button>
            <button
              v-if="userStore.isLoggedIn"
              @click="handleFavorite"
              :class="['action-btn', { active: isFavorited }]"
            >
              ⭐ 收藏 ({{ article.favoriteCount || 0 }})
            </button>
          </div>

          <!-- 评论区域 -->
          <div class="comments-section">
            <h3>评论 ({{ commentTotal }})</h3>
            <div v-if="userStore.isLoggedIn" class="comment-form">
              <textarea
                v-model="commentContent"
                placeholder="写下你的评论..."
                rows="4"
              ></textarea>
              <button @click="handleSubmitComment" class="submit-comment-btn">发表评论</button>
            </div>
            <div v-else class="login-tip">
              请先<router-link to="/login">登录</router-link>后再评论
            </div>
            <div class="comments-list">
              <div v-for="comment in comments" :key="comment.commentId" class="comment-item">
                <div class="comment-header">
                  <span class="comment-user">{{ comment.userName || `用户 ${comment.userId}` }}</span>
                  <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
                  <div class="comment-actions">
                    <button
                      v-if="userStore.isLoggedIn && (comment.userId === userStore.userInfo?.userId || userStore.isAdmin)"
                      @click="deleteComment(comment.commentId)"
                      class="delete-comment-btn"
                      title="删除评论"
                    >
                      删除
                    </button>
                  </div>
                </div>
                <div class="comment-content">{{ comment.content }}</div>
              </div>
            </div>
            <div v-if="commentTotal > commentPageSize" class="comment-pagination">
              <button @click="prevCommentPage" :disabled="commentPage === 1">上一页</button>
              <span>第 {{ commentPage }} 页</span>
              <button
                @click="nextCommentPage"
                :disabled="commentPage >= Math.ceil(commentTotal / commentPageSize)"
              >
                下一页
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getArticleById } from '@/api/article'
import { getCommentList, addComment, deleteComments } from '@/api/comment'
import { toggleArticleLike } from '@/api/like'
import { toggleArticleFavorite } from '@/api/favorite'
import { getUserById } from '@/api/user'
import Layout from '@/components/Layout.vue'

const route = useRoute()
const userStore = useUserStore()

const article = ref(null)
const loading = ref(false)
const comments = ref([])
const commentContent = ref('')
const commentPage = ref(1)
const commentPageSize = ref(10)
const commentTotal = ref(0)
const isLiked = ref(false)
const isFavorited = ref(false)
const authorName = ref('')
const authorInfo = ref({}) // 保存作者完整信息
const commentUserNames = ref({}) // 缓存评论用户的userName

const loadArticle = async () => {
  loading.value = true
  try {
    // 获取文章数据
    // 注意：根据接口文档，后端在返回文章详情时可能会自动增加阅读量
    // 所以这里直接获取数据，使用后端返回的实际阅读量
    const res = await getArticleById(route.params.id)
    if (res.code === 1) {
      article.value = res.data
      // 加载作者信息
      if (article.value?.userId) {
        loadAuthorInfo(article.value.userId)
      }
    }
  } catch (error) {
    console.error('加载文章失败:', error)
  } finally {
    loading.value = false
  }
}

const loadAuthorInfo = async (userId) => {
  try {
    const res = await getUserById(userId)
    if (res.code === 1 && res.data) {
      authorInfo.value = res.data
      authorName.value = res.data.userName || `用户 ${userId}`
    }
  } catch (error) {
    console.warn('加载作者信息失败:', error)
    authorName.value = `用户 ${userId}`
    authorInfo.value = {}
  }
}

// 处理头像加载错误
const handleAvatarError = (event) => {
  // 如果头像加载失败，使用默认头像或隐藏
  event.target.src = '/default-avatar.png'
}

const loadComments = async () => {
  try {
    const res = await getCommentList({
      articleId: route.params.id,
      page: commentPage.value,
      pageSize: commentPageSize.value,
    })
    if (res.code === 1) {
      comments.value = res.data.rows || []
      commentTotal.value = res.data.total || 0
    }
  } catch (error) {
    console.error('加载评论失败:', error)
  }
}

const handleLike = async () => {
  if (!userStore.isLoggedIn) {
    alert('请先登录')
    return
  }
  try {
    await toggleArticleLike({
      articleId: article.value.articleId,
      userId: userStore.userInfo.userId,
    })
    // 重新获取文章数据，确保数据一致性，避免多次点赞问题
    await loadArticle()
    // 注意：isLiked 状态需要从后端获取，这里暂时使用乐观更新
    // 如果后端返回点赞状态，应该使用后端的数据
    isLiked.value = !isLiked.value
  } catch (error) {
    console.error('点赞失败:', error)
  }
}

const handleFavorite = async () => {
  if (!userStore.isLoggedIn) {
    alert('请先登录')
    return
  }
  try {
    await toggleArticleFavorite({
      articleId: article.value.articleId,
      userId: userStore.userInfo.userId,
    })
    // 重新获取文章数据，确保数据一致性
    await loadArticle()
    // 注意：isFavorited 状态需要从后端获取，这里暂时使用乐观更新
    // 如果后端返回收藏状态，应该使用后端的数据
    isFavorited.value = !isFavorited.value
  } catch (error) {
    console.error('收藏失败:', error)
  }
}

const handleSubmitComment = async () => {
  if (!commentContent.value.trim()) {
    alert('请输入评论内容')
    return
  }
  try {
    await addComment({
      articleId: article.value.articleId,
      userId: userStore.userInfo.userId,
      content: commentContent.value,
    })
    commentContent.value = ''
    commentPage.value = 1
    // 重新加载评论列表
    await loadComments()
    // 重新获取文章数据，确保评论数准确
    await loadArticle()
  } catch (error) {
    console.error('发表评论失败:', error)
  }
}

// 删除评论
const deleteComment = async (commentId) => {
  if (!confirm('确定要删除这条评论吗？')) {
    return
  }
  try {
    const res = await deleteComments(commentId)
    if (res.code === 1) {
      // 重新加载评论列表，确保数据一致性
      await loadComments()
      // 重新获取文章数据，确保评论数准确
      await loadArticle()
    }
  } catch (error) {
    console.error('删除评论失败:', error)
    alert('删除评论失败，请重试')
  }
}

const prevCommentPage = () => {
  if (commentPage.value > 1) {
    commentPage.value--
    loadComments()
  }
}

const nextCommentPage = () => {
  if (commentPage.value < Math.ceil(commentTotal.value / commentPageSize.value)) {
    commentPage.value++
    loadComments()
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return dateStr
}

const formatContent = (content) => {
  if (!content) return ''
  return content.replace(/\n/g, '<br>')
}

onMounted(() => {
  loadArticle() // 加载文章（后端会自动增加阅读量）
  loadComments()
})
</script>

<style scoped>
.article-detail-container {
  min-height: calc(100vh - 200px);
  padding: 20px 0;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 20px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #999;
}

.article-detail {
  background: #fff;
  border-radius: 8px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.title {
  font-size: 32px;
  font-weight: 600;
  margin: 0 0 20px 0;
  color: #333;
}

.meta {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
  font-size: 14px;
  color: #999;
  flex-wrap: wrap;
}

.author-info {
  display: flex;
  align-items: center;
}

.author-link {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: inherit;
  transition: opacity 0.3s;
}

.author-link:hover {
  opacity: 0.8;
}

.author-link:hover .author {
  color: #409eff;
}

.author-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #eee;
  cursor: pointer;
  transition: all 0.3s;
}

.author-link:hover .author-avatar {
  border-color: #409eff;
  transform: scale(1.1);
}

.tag {
  background: #ecf5ff;
  color: #409eff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.cover-image {
  margin-bottom: 30px;
  border-radius: 8px;
  overflow: hidden;
}

.cover-image img {
  width: 100%;
  height: auto;
  display: block;
}

.content {
  line-height: 1.8;
  color: #333;
  margin-bottom: 30px;
  font-size: 16px;
}

.actions {
  display: flex;
  gap: 15px;
  padding: 20px 0;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
  margin-bottom: 30px;
}

.action-btn {
  padding: 10px 20px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn:hover {
  background: #e6e6e6;
}

.action-btn.active {
  background: #409eff;
  color: #fff;
  border-color: #409eff;
}

.comments-section {
  margin-top: 40px;
}

.comments-section h3 {
  margin-bottom: 20px;
  color: #333;
}

.comment-form {
  margin-bottom: 30px;
}

.comment-form textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
  box-sizing: border-box;
  margin-bottom: 10px;
}

.comment-form textarea:focus {
  outline: none;
  border-color: #409eff;
}

.submit-comment-btn {
  padding: 10px 20px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.submit-comment-btn:hover {
  background: #66b1ff;
}

.login-tip {
  margin-bottom: 20px;
  color: #999;
}

.login-tip a {
  color: #409eff;
  text-decoration: none;
}

.comments-list {
  margin-bottom: 20px;
}

.comment-item {
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 14px;
  color: #999;
}

.comment-actions {
  display: flex;
  gap: 10px;
}

.delete-comment-btn {
  padding: 4px 8px;
  background: #f56c6c;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.delete-comment-btn:hover {
  background: #f78989;
}

.comment-content {
  color: #333;
  line-height: 1.6;
}

.comment-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
}

.comment-pagination button {
  padding: 8px 16px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.comment-pagination button:disabled {
  background: #c0c4cc;
  cursor: not-allowed;
}
</style>

