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
              <div v-if="replyingTo" class="reply-info">
                正在回复: {{ getCommentUserName(replyingTo.userId) }}
                <button @click="cancelReply" class="cancel-reply-btn">取消</button>
              </div>
              <textarea
                v-model="commentContent"
                :placeholder="replyingTo ? `回复 ${getCommentUserName(replyingTo.userId)}...` : '写下你的评论...'"
                rows="4"
              ></textarea>
              <button @click="handleSubmitComment" class="submit-comment-btn">发表评论</button>
            </div>
            <div v-else class="login-tip">
              请先<router-link to="/login">登录</router-link>后再评论
            </div>
            <div class="comments-list">
              <template v-for="comment in commentTree" :key="comment.commentId">
                <div class="comment-item" :style="{ marginLeft: getIndent(0) + 'px' }">
                  <div class="comment-header">
                    <div class="comment-meta">
                      <span class="comment-user">{{ getCommentUserName(comment.userId) }}</span>
                      <span class="comment-dot">·</span>
                      <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
                    </div>
                    <div class="comment-actions">
                      <button
                        v-if="userStore.isLoggedIn"
                        @click="handleReply(comment)"
                        class="reply-comment-btn"
                        title="回复"
                      >
                        回复
                      </button>
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
                  <div v-if="comment.children && comment.children.length > 0" class="comment-children">
                    <CommentChildrenRecursive
                      :children="comment.children"
                      :depth="1"
                    />
                  </div>
                </div>
              </template>
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
import { ref, onMounted, computed, h, defineComponent } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getArticleById } from '@/api/article'
import { getCommentList, addComment, deleteComments } from '@/api/comment'
import { toggleArticleLike } from '@/api/like'
import { toggleArticleFavorite } from '@/api/favorite'
import { getUserById } from '@/api/user'
import Layout from '@/components/Layout.vue'
import { renderMarkdown } from '@/utils/markdown'

// 计算缩进（最多4层）
const getIndent = (depth) => {
  const maxDepth = 4
  const actualDepth = Math.min(depth, maxDepth)
  return actualDepth * 30 // 每层缩进30px
}

const route = useRoute()
const userStore = useUserStore()

const article = ref(null)
const loading = ref(false)
const comments = ref([])
const commentTree = ref([]) // 树形结构的评论
const commentContent = ref('')
const commentPage = ref(1)
const commentPageSize = ref(10)
const commentTotal = ref(0)
const isLiked = ref(false)
const isFavorited = ref(false)
const authorName = ref('')
const authorInfo = ref({}) // 保存作者完整信息
const commentUserNames = ref({}) // 缓存评论用户的userName
const replyingTo = ref(null) // 当前正在回复的评论

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
      const rawComments = res.data.rows || []
      comments.value = rawComments.filter(comment => comment.isDeleted !== 1)
      commentTotal.value = res.data.total || 0
      // 构建评论树
      buildCommentTree()
      // 加载所有评论用户的用户名
      loadAllCommentUsers(comments.value)
    }
  } catch (error) {
    console.error('加载评论失败:', error)
  }
}

// 构建评论树
const buildCommentTree = () => {
  const commentMap = new Map()
  const rootComments = []

  // 首先创建所有评论的映射
  comments.value.forEach(comment => {
    commentMap.set(comment.commentId, {
      ...comment,
      children: []
    })
  })

  // 构建树形结构
  comments.value.forEach(comment => {
    const commentNode = commentMap.get(comment.commentId)
    if (comment.parentId === null || comment.parentId === undefined) {
      // 根评论
      rootComments.push(commentNode)
    } else {
      // 子评论
      const parent = commentMap.get(comment.parentId)
      if (parent) {
        parent.children.push(commentNode)
      } else {
        // 如果找不到父评论，作为根评论处理
        rootComments.push(commentNode)
      }
    }
  })

  commentTree.value = rootComments
}

// 加载所有评论用户的用户名
const loadAllCommentUsers = async (commentsList) => {
  const userIds = [...new Set(commentsList.map(c => c.userId).filter(Boolean))]
  const promises = userIds
    .filter(userId => !commentUserNames.value[userId])
    .map(userId => loadCommentUser(userId))
  
  await Promise.all(promises)
}

// 加载单个评论用户的用户名
const loadCommentUser = async (userId) => {
  if (!userId || commentUserNames.value[userId]) {
    return
  }
  try {
    const res = await getUserById(userId)
    if (res.code === 1 && res.data) {
      commentUserNames.value[userId] = res.data.userName || `用户 ${userId}`
    } else {
      commentUserNames.value[userId] = `用户 ${userId}`
    }
  } catch (error) {
    console.warn(`加载用户 ${userId} 信息失败:`, error)
    commentUserNames.value[userId] = `用户 ${userId}`
  }
}

// 获取评论用户名
const getCommentUserName = (userId) => {
  return commentUserNames.value[userId] || `用户 ${userId}`
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
    const commentData = {
      articleId: article.value.articleId,
      userId: userStore.userInfo.userId,
      content: commentContent.value,
    }
    // 如果是回复，添加 parentId
    if (replyingTo.value) {
      commentData.parentId = replyingTo.value.commentId
    }
    await addComment(commentData)
    commentContent.value = ''
    replyingTo.value = null
    commentPage.value = 1
    // 重新加载评论列表
    await loadComments()
    // 重新获取文章数据，确保评论数准确
    await loadArticle()
  } catch (error) {
    console.error('发表评论失败:', error)
  }
}

// 处理回复
const handleReply = (comment) => {
  replyingTo.value = comment
  // 滚动到评论输入框
  const commentForm = document.querySelector('.comment-form')
  if (commentForm) {
    commentForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
}

// 取消回复
const cancelReply = () => {
  replyingTo.value = null
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

let CommentChildrenRecursive

CommentChildrenRecursive = defineComponent({
  name: 'CommentChildrenRecursive',
  props: {
    children: {
      type: Array,
      required: true
    },
    depth: {
      type: Number,
      default: 0
    }
  },
  setup(props) {
    // 定义最大缩进层级（达到此层级后，后续评论改为平铺，不再缩进）
    const MAX_DEPTH = 10
    // 定义每一层的固定缩进距离（像素）
    // 注意：因为是嵌套结构，这里必须是固定值，不能随深度增加
    const INDENT_STEP = 20 

    return () => {
      return props.children.map(child => {
        // 1. 如果是根层级 (depth 0)，通常不需要左边距。
        // 2. 如果当前深度早已超过最大深度 (depth > MAX_DEPTH)，则不再缩进 (平铺模式)。
        // 3. 否则，应用固定的相对缩进值。
        
        let currentIndent = 0
        if (props.depth > 0 && props.depth <= MAX_DEPTH) {
            currentIndent = INDENT_STEP
        }
        
        // 必须传递真实的深度 (depth + 1)，不要在这里限制它。
        // 只有知道真实的深度，下一层才能判断自己是否应该停止缩进。
        const nextDepth = props.depth + 1
        
        const hasChildren = child.children && child.children.length > 0
        
        return h('div', {
          key: child.commentId,
          class: 'comment-item',
          // 应用计算好的相对缩进
          style: { marginLeft: `${currentIndent}px` }
        }, [
          // 评论头部
          h('div', { class: 'comment-header' }, [
            h('span', { class: 'comment-user' }, getCommentUserName(child.userId)),
            h('span', { class: 'comment-date' }, formatDate(child.createdAt)),
            h('div', { class: 'comment-actions' }, [
              userStore.isLoggedIn && h('button', {
                class: 'reply-comment-btn',
                title: '回复',
                onClick: () => handleReply(child)
              }, '回复'),
              userStore.isLoggedIn && (child.userId === userStore.userInfo?.userId || userStore.isAdmin) && h('button', {
                class: 'delete-comment-btn',
                title: '删除评论',
                onClick: () => deleteComment(child.commentId)
              }, '删除')
            ])
          ]),
          
          // 评论内容
          h('div', { class: 'comment-content' }, child.content),
          
          // 递归渲染子评论
          hasChildren && h('div', { class: 'comment-children' }, [
            h(CommentChildrenRecursive, {
              children: child.children,
              depth: nextDepth // 传递真实深度
            })
          ])
        ])
      })
    }
  }
})

const formatContent = (content) => {
  if (!content) return ''
  return renderMarkdown(content)
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

.content :deep(h1),
.content :deep(h2),
.content :deep(h3),
.content :deep(h4),
.content :deep(h5),
.content :deep(h6) {
  color: #222;
  line-height: 1.35;
  margin: 28px 0 12px;
}

.content :deep(h1) {
  font-size: 28px;
}

.content :deep(h2) {
  font-size: 24px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.content :deep(h3) {
  font-size: 20px;
}

.content :deep(p) {
  margin: 0 0 16px;
}

.content :deep(ul),
.content :deep(ol) {
  margin: 0 0 18px 22px;
  padding: 0;
}

.content :deep(li) {
  margin: 6px 0;
}

.content :deep(a) {
  color: #409eff;
  text-decoration: none;
}

.content :deep(a:hover) {
  text-decoration: underline;
}

.content :deep(code) {
  padding: 2px 5px;
  border-radius: 4px;
  background: #f5f7fa;
  color: #d14;
  font-family: Consolas, Monaco, monospace;
  font-size: 0.92em;
}

.content :deep(pre) {
  margin: 0 0 18px;
  padding: 14px;
  border-radius: 8px;
  background: #1f2933;
  overflow-x: auto;
}

.content :deep(pre code) {
  padding: 0;
  background: transparent;
  color: #f8fafc;
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
  transition: background-color 0.2s;
}

.comment-item:hover {
  background-color: #f9f9f9;
}

.comment-children {
  margin-top: 10px;
}

:deep(.comment-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 14px;
  color: #999;
  gap: 12px;
  flex-wrap: wrap;
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 1;
  min-width: 0;
}

.comment-user {
  font-weight: 500;
  color: #333;
  white-space: nowrap;
}

.comment-dot {
  color: #ccc;
  margin: 0 4px;
  font-weight: normal;
}

.comment-date {
  color: #999;
  font-size: 12px;
  white-space: nowrap;
  flex: 0;
}

.comment-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
}

:deep(.reply-comment-btn),
:deep(.delete-comment-btn) {
  padding: 4px 8px;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

:deep(.reply-comment-btn) {
  background: #409eff;
}

:deep(.reply-comment-btn:hover) {
  background: #66b1ff;
}

:deep(.delete-comment-btn) {
  background: #f56c6c;
}

:deep(.delete-comment-btn:hover) {
  background: #f78989;
}

.reply-info {
  padding: 10px;
  background: #ecf5ff;
  border-left: 3px solid #409eff;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 4px;
}

.cancel-reply-btn {
  padding: 4px 12px;
  background: #909399;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.cancel-reply-btn:hover {
  background: #a6a9ad;
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

