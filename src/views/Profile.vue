<template>
  <Layout>
    <div class="profile-container">
      <div class="container">
        <div v-if="loading" class="loading">加载中...</div>
        <div v-else-if="user" class="profile">
          <div class="profile-header">
            <div class="avatar-container">
              <img :src="user.avatar || '/default-avatar.png'" alt="avatar" class="avatar" @error="handleAvatarError" />
              <div v-if="isOwnProfile" class="avatar-overlay">
                <input
                  ref="avatarInput"
                  type="file"
                  accept="image/*"
                  @change="handleAvatarSelect"
                  class="avatar-input"
                />
                <button @click="triggerAvatarUpload" class="avatar-upload-btn" title="更换头像">
                  📷
                </button>
              </div>
            </div>
            <div class="user-info">
              <h2>{{ user.userName }}</h2>
              <p class="email">{{ user.email }}</p>
              <p v-if="user.signature" class="signature">{{ user.signature }}</p>
            </div>
            <div class="actions">
              <template v-if="isOwnProfile">
                <button @click="showEditModal = true" class="edit-btn">编辑资料</button>
                <button @click="showPasswordModal = true" class="password-btn">修改密码</button>
              </template>
              <button
                v-else-if="userStore.isLoggedIn && !isOwnProfile"
                @click="handleToggleFollow"
                :class="['follow-btn', { 'following': isFollowing }]"
              >
                {{ isFollowing ? '取消关注' : '关注' }}
              </button>
            </div>
          </div>

          <div class="profile-content">
            <div class="tabs">
              <button
                @click="activeTab = 'articles'"
                :class="['tab', { active: activeTab === 'articles' }]"
              >
                文章
              </button>
              <button
                v-if="isOwnProfile"
                @click="activeTab = 'drafts'"
                :class="['tab', { active: activeTab === 'drafts' }]"
              >
                草稿箱
              </button>
              <button
                @click="activeTab = 'followers'"
                :class="['tab', { active: activeTab === 'followers' }]"
              >
                粉丝
              </button>
              <button
                @click="activeTab = 'following'"
                :class="['tab', { active: activeTab === 'following' }]"
              >
                关注
              </button>
            </div>

            <div class="tab-content">
              <div v-if="activeTab === 'articles'" class="articles-list">
                <div v-for="article in userArticles" :key="article.articleId" class="article-item">
                  <div class="article-header">
                    <h3 @click="goToDetail(article.articleId)" class="article-title">
                      {{ article.title }}
                    </h3>
                    <div v-if="isOwnProfile" class="article-actions">
                      <button @click="editArticle(article.articleId)" class="edit-article-btn">
                        编辑
                      </button>
                      <button
                        @click="deleteArticle(article.articleId)"
                        class="delete-article-btn"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                  <div class="article-meta">
                    <span>{{ formatDate(article.publishedAt || article.createdAt) }}</span>
                    <span>阅读 {{ article.viewCount || 0 }}</span>
                    <span>点赞 {{ article.likeCount || 0 }}</span>
                  </div>
                </div>
              </div>

              <div v-if="activeTab === 'drafts'" class="articles-list">
                <div v-if="draftLoading" class="loading">加载中...</div>
                <div v-else-if="draftArticles.length === 0" class="empty-drafts">
                  <p>暂无草稿</p>
                  <button @click="$router.push('/article/edit')" class="write-btn">写一篇文章</button>
                </div>
                <div v-for="article in draftArticles" :key="article.articleId" class="article-item draft-item">
                  <div class="article-header">
                    <h3 @click="editArticle(article.articleId)" class="article-title">
                      {{ article.title || '无标题' }}
                    </h3>
                    <div class="article-actions">
                      <button @click="editArticle(article.articleId)" class="edit-article-btn">
                        编辑
                      </button>
                      <button
                        @click="deleteArticle(article.articleId)"
                        class="delete-article-btn"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                  <div class="article-meta">
                    <span>创建于 {{ formatDate(article.createdAt) }}</span>
                  </div>
                </div>
              </div>

              <div v-if="activeTab === 'followers'" class="users-list">
                <div v-for="follower in followers" :key="follower.userId" class="user-item">
                  <img
                    :src="follower.avatar"
                    alt="avatar"
                    class="user-avatar"
                    @click="goToProfile(follower.userId)"
                  />
                  <div class="user-details" @click="goToProfile(follower.userId)">
                    <h4>{{ follower.userName }}</h4>
                    <p>{{ follower.email }}</p>
                  </div>
                </div>
              </div>

              <div v-if="activeTab === 'following'" class="users-list">
                <div v-for="followingUser in following" :key="followingUser.userId" class="user-item">
                  <img
                    :src="followingUser.avatar"
                    alt="avatar"
                    class="user-avatar"
                    @click="goToProfile(followingUser.userId)"
                  />
                  <div
                    class="user-details"
                    @click="goToProfile(followingUser.userId)"
                    style="flex: 1; cursor: pointer;"
                  >
                    <h4>{{ followingUser.userName }}</h4>
                    <p>{{ followingUser.email }}</p>
                  </div>
                  <div v-if="isOwnProfile" class="user-actions">
                    <button
                      @click.stop="unfollowUser(followingUser.userId)"
                      class="unfollow-btn"
                    >
                      取消关注
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 编辑资料模态框 -->
        <div v-if="showEditModal" class="modal" @click.self="showEditModal = false">
          <div class="modal-content">
            <h3>编辑资料</h3>
            <form @submit.prevent="handleUpdateProfile">
              <div class="form-group">
                <label>头像</label>
                <div class="avatar-upload-section">
                  <img
                    :src="editForm.avatar || user.avatar || '/default-avatar.png'"
                    alt="avatar preview"
                    class="avatar-preview"
                    @error="handleAvatarError"
                  />
                  <div class="avatar-upload-controls">
                    <input
                      ref="editAvatarInput"
                      type="file"
                      accept="image/*"
                      @change="handleEditAvatarSelect"
                      class="avatar-input"
                    />
                    <button type="button" @click="triggerEditAvatarUpload" class="upload-avatar-btn">
                      选择图片
                    </button>
                    <span v-if="uploadingAvatar" class="upload-status">上传中...</span>
                  </div>
                </div>
              </div>
              <div class="form-group">
                <label>用户名</label>
                <input v-model="editForm.userName" type="text" required />
              </div>
              <div class="form-group">
                <label>签名</label>
                <textarea v-model="editForm.signature" rows="3"></textarea>
              </div>
              <div class="form-group">
                <label>性别</label>
                <select v-model="editForm.gender">
                  <option :value="0">保密</option>
                  <option :value="1">男</option>
                  <option :value="2">女</option>
                </select>
              </div>
              <div class="form-group">
                <label>生日</label>
                <input v-model="editForm.birthday" type="date" />
              </div>
              <div class="form-actions">
                <button type="submit" class="submit-btn">保存</button>
                <button type="button" @click="showEditModal = false" class="cancel-btn">取消</button>
              </div>
            </form>
          </div>
        </div>

        <!-- 修改密码模态框 -->
        <div v-if="showPasswordModal" class="modal" @click.self="showPasswordModal = false">
          <div class="modal-content">
            <h3>修改密码</h3>
            <form @submit.prevent="handleUpdatePassword">
              <div class="form-group">
                <label>旧密码</label>
                <input
                  v-model="passwordForm.oldPassword"
                  type="password"
                  required
                  placeholder="请输入旧密码"
                />
              </div>
              <div class="form-group">
                <label>新密码</label>
                <input
                  v-model="passwordForm.newPassword"
                  type="password"
                  required
                  placeholder="请输入新密码（至少6位）"
                />
              </div>
              <div class="form-group">
                <label>确认新密码</label>
                <input
                  v-model="passwordForm.confirmPassword"
                  type="password"
                  required
                  placeholder="请再次输入新密码"
                />
              </div>
              <div class="form-actions">
                <button type="submit" class="submit-btn">保存</button>
                <button type="button" @click="showPasswordModal = false" class="cancel-btn">
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getUserById, updateUser, updatePassword } from '@/api/user'
import { getArticleList, deleteArticles } from '@/api/article'
import { getFollowerList, getFollowingList, toggleFollow } from '@/api/follow'
import { uploadImage } from '@/api/upload'
import Layout from '@/components/Layout.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const userId = computed(() => route.params.id || userStore.userInfo?.userId)
const isOwnProfile = computed(() => userId.value == userStore.userInfo?.userId)

const user = ref(null)
const loading = ref(false)
const activeTab = ref('articles')
const showEditModal = ref(false)
const showPasswordModal = ref(false)
const userArticles = ref([])
const draftArticles = ref([])
const draftLoading = ref(false)
const followers = ref([])
const following = ref([])
const isFollowing = ref(false)
const uploadingAvatar = ref(false)
const avatarInput = ref(null)
const editAvatarInput = ref(null)

const editForm = ref({
  userName: '',
  signature: '',
  gender: 0,
  birthday: '',
  avatar: '',
})

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const loadUser = async () => {
  loading.value = true
  try {
    const res = await getUserById(userId.value)
    if (res.code === 1) {
      user.value = res.data
      editForm.value = {
        userName: res.data.userName || '',
        signature: res.data.signature || '',
        gender: res.data.gender || 0,
        birthday: res.data.birthday || '',
        avatar: res.data.avatar || '',
      }
    }
  } catch (error) {
    console.error('加载用户信息失败:', error)
  } finally {
    loading.value = false
  }
}

const loadUserArticles = async () => {
  try {
    const res = await getArticleList({
      userId: userId.value,
      status: 1,
      page: 1,
      pageSize: 20,
    })
    if (res.code === 1) {
      userArticles.value = res.data.rows || []
    }
  } catch (error) {
    console.error('加载文章失败:', error)
  }
}

const loadDrafts = async () => {
  draftLoading.value = true
  try {
    const res = await getArticleList({
      userId: userId.value,
      status: 0,
      page: 1,
      pageSize: 20,
    })
    if (res.code === 1) {
      draftArticles.value = res.data.rows || []
    }
  } catch (error) {
    console.error('加载草稿失败:', error)
  } finally {
    draftLoading.value = false
  }
}

const loadFollowers = async () => {
  try {
    const res = await getFollowerList({
      followingId: userId.value,
      page: 1,
      pageSize: 20,
    })
    if (res.code === 1) {
      followers.value = res.data.rows || []
    }
  } catch (error) {
    console.error('加载粉丝失败:', error)
  }
}

const loadFollowing = async () => {
  try {
    const res = await getFollowingList({
      followerId: userId.value,
      page: 1,
      pageSize: 20,
    })
    if (res.code === 1) {
      following.value = res.data.rows || []
    }
  } catch (error) {
    console.error('加载关注失败:', error)
  }
}

// 检查当前用户是否关注了目标用户
const checkFollowStatus = async () => {
  if (!userStore.isLoggedIn || isOwnProfile.value) {
    isFollowing.value = false
    return
  }
  try {
    // 查询当前用户的关注列表，检查是否包含目标用户
    const res = await getFollowingList({
      followerId: userStore.userInfo.userId,
      page: 1,
      pageSize: 1000, // 获取所有关注，用于检查
    })
    if (res.code === 1) {
      const followingList = res.data.rows || []
      isFollowing.value = followingList.some((u) => u.userId == userId.value)
    }
  } catch (error) {
    console.error('检查关注状态失败:', error)
    isFollowing.value = false
  }
}

// 关注/取消关注
const handleToggleFollow = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  try {
    const res = await toggleFollow({
      followerId: userStore.userInfo.userId,
      followingId: userId.value,
    })
    if (res.code === 1) {
      // 重新检查关注状态
      await checkFollowStatus()
      // 如果查看的是自己的资料，重新加载粉丝列表
      if (isOwnProfile.value) {
        await loadFollowers()
      }
    }
  } catch (error) {
    console.error('关注/取消关注失败:', error)
  }
}

// 编辑文章
const editArticle = (articleId) => {
  router.push(`/article/edit/${articleId}`)
}

// 删除文章
const deleteArticle = async (articleId) => {
  if (!confirm('确定要删除这篇文章吗？删除后无法恢复。')) {
    return
  }
  try {
    const res = await deleteArticles(articleId)
    if (res.code === 1) {
      // 重新加载文章列表，确保数据一致性
      await loadUserArticles()
    }
  } catch (error) {
    console.error('删除文章失败:', error)
    alert('删除文章失败，请重试')
  }
}

// 跳转到用户资料页
const goToProfile = (id) => {
  router.push(`/profile/${id}`)
}

// 取消关注
const unfollowUser = async (targetUserId) => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  try {
    const res = await toggleFollow({
      followerId: userStore.userInfo.userId,
      followingId: targetUserId,
    })
    if (res.code === 1) {
      // 重新加载关注列表
      await loadFollowing()
    }
  } catch (error) {
    console.error('取消关注失败:', error)
  }
}

// 触发头像上传（主页头像）
const triggerAvatarUpload = () => {
  avatarInput.value?.click()
}

// 处理主页头像选择
const handleAvatarSelect = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    alert('请选择图片文件')
    return
  }

  // 验证文件大小（限制为 5MB）
  if (file.size > 5 * 1024 * 1024) {
    alert('图片大小不能超过 5MB')
    return
  }

  await uploadAvatarFile(file)
  // 清空 input，以便可以重复选择同一文件
  event.target.value = ''
}

// 触发编辑模态框中的头像上传
const triggerEditAvatarUpload = () => {
  editAvatarInput.value?.click()
}

// 处理编辑模态框中的头像选择
const handleEditAvatarSelect = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    alert('请选择图片文件')
    return
  }

  // 验证文件大小（限制为 5MB）
  if (file.size > 5 * 1024 * 1024) {
    alert('图片大小不能超过 5MB')
    return
  }

  // 先预览
  const reader = new FileReader()
  reader.onload = (e) => {
    editForm.value.avatar = e.target.result
  }
  reader.readAsDataURL(file)

  // 上传文件
  await uploadAvatarFile(file)
  // 清空 input，以便可以重复选择同一文件
  event.target.value = ''
}

// 上传头像文件
const uploadAvatarFile = async (file) => {
  uploadingAvatar.value = true
  try {
    const res = await uploadImage(file)

    if (res.code === 1 && res.data) {
      const avatarUrl = typeof res.data === 'string' ? res.data : res.data.url || res.data
      // 更新用户信息
      const updateRes = await updateUser({
        userId: user.value.userId,
        avatar: avatarUrl,
      })
      if (updateRes.code === 1) {
        // 更新本地数据
        user.value.avatar = avatarUrl
        editForm.value.avatar = avatarUrl
        // 如果是自己的资料，更新 store
        if (isOwnProfile.value) {
          userStore.updateUserInfo({ ...user.value, avatar: avatarUrl })
        }
        alert('头像更新成功')
      }
    } else {
      alert('头像上传失败，请重试')
    }
  } catch (error) {
    console.error('上传头像失败:', error)
    // 显示更详细的错误信息
    const errorMsg = error.message || error.response?.data?.msg || '上传头像失败，请重试'
    alert(errorMsg)
  } finally {
    uploadingAvatar.value = false
  }
}

// 处理头像加载错误
const handleAvatarError = (event) => {
  event.target.src = '/default-avatar.png'
}

const handleUpdateProfile = async () => {
  try {
    const res = await updateUser({
      userId: user.value.userId,
      userName: editForm.value.userName,
      signature: editForm.value.signature,
      gender: editForm.value.gender,
      birthday: editForm.value.birthday,
      avatar: editForm.value.avatar || user.value.avatar,
    })
    if (res.code === 1) {
      await loadUser()
      if (isOwnProfile.value) {
        userStore.updateUserInfo({ ...user.value, ...editForm.value })
      }
      showEditModal.value = false
    }
  } catch (error) {
    console.error('更新资料失败:', error)
    alert('更新资料失败，请重试')
  }
}

// 修改密码
const handleUpdatePassword = async () => {
  // 验证新密码和确认密码是否一致
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    alert('新密码和确认密码不一致')
    return
  }
  // 验证密码长度
  if (passwordForm.value.newPassword.length < 6) {
    alert('新密码长度至少为6位')
    return
  }
  try {
    const res = await updatePassword({
      userId: user.value.userId,
      oldPassword: passwordForm.value.oldPassword,
      newPassword: passwordForm.value.newPassword,
    })
    if (res.code === 1) {
      alert('密码修改成功')
      showPasswordModal.value = false
      passwordForm.value = {
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      }
    }
  } catch (error) {
    console.error('修改密码失败:', error)
    alert(error.response?.data?.msg || '修改密码失败，请检查旧密码是否正确')
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
  loadUser()
  loadUserArticles()
  checkFollowStatus()
})

// 监听 userId 变化
watch(userId, () => {
  loadUser()
  loadUserArticles()
  checkFollowStatus()
})

// 监听 tab 切换
watch(activeTab, (newTab) => {
  if (newTab === 'drafts') {
    loadDrafts()
  } else if (newTab === 'followers') {
    loadFollowers()
  } else if (newTab === 'following') {
    loadFollowing()
  }
})
</script>

<style scoped>
.profile-container {
  min-height: calc(100vh - 200px);
  padding: 40px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #999;
}

.profile {
  background: #fff;
  border-radius: 8px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 30px;
  padding-bottom: 30px;
  border-bottom: 1px solid #eee;
  margin-bottom: 30px;
}

.avatar-container {
  position: relative;
  display: inline-block;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  cursor: pointer;
}

.avatar-container:hover .avatar-overlay {
  opacity: 1;
}

.avatar-input {
  display: none;
}

.avatar-upload-btn {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.avatar-upload-btn:hover {
  background: #fff;
  transform: scale(1.1);
}

.user-info {
  flex: 1;
}

.user-info h2 {
  margin: 0 0 10px 0;
  color: #333;
}

.email {
  color: #999;
  margin: 0 0 10px 0;
}

.signature {
  color: #666;
  margin: 0;
}

.edit-btn {
  padding: 10px 20px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.edit-btn:hover {
  background: #66b1ff;
}

.password-btn {
  padding: 10px 20px;
  background: #67c23a;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-left: 10px;
}

.password-btn:hover {
  background: #85ce61;
}

.follow-btn {
  padding: 10px 20px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
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

.tabs {
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

.article-item {
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.article-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.article-title {
  font-size: 18px;
  color: #333;
  cursor: pointer;
  margin: 0;
  flex: 1;
}

.article-title:hover {
  color: #409eff;
}

.empty-drafts {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-drafts p {
  margin: 0 0 16px;
  font-size: 15px;
}

.write-btn {
  padding: 8px 20px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.write-btn:hover {
  background: #66b1ff;
}

.draft-item {
  border-left: 3px solid #e6a23c;
}

.article-actions {
  display: flex;
  gap: 10px;
}

.edit-article-btn {
  padding: 6px 12px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.edit-article-btn:hover {
  background: #66b1ff;
}

.delete-article-btn {
  padding: 6px 12px;
  background: #f56c6c;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-left: 8px;
}

.delete-article-btn:hover {
  background: #f78989;
}

.article-meta {
  display: flex;
  gap: 15px;
  font-size: 14px;
  color: #999;
}

.users-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
  transition: background 0.3s;
}

.user-item:hover {
  background: #ebebeb;
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
}

.user-details {
  flex: 1;
}

.user-details h4 {
  margin: 0 0 5px 0;
  color: #333;
  cursor: pointer;
}

.user-details h4:hover {
  color: #409eff;
}

.user-details p {
  margin: 0;
  color: #999;
  font-size: 14px;
}

.user-actions {
  display: flex;
  gap: 10px;
}

.unfollow-btn {
  padding: 6px 12px;
  background: #909399;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.unfollow-btn:hover {
  background: #a6a9ad;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  padding: 30px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
}

.modal-content h3 {
  margin: 0 0 20px 0;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.avatar-upload-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar-preview {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ddd;
}

.avatar-upload-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.upload-avatar-btn {
  padding: 8px 16px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.upload-avatar-btn:hover {
  background: #66b1ff;
}

.upload-status {
  color: #409eff;
  font-size: 12px;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.submit-btn {
  padding: 10px 20px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn {
  padding: 10px 20px;
  background: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}
</style>

