<template>
  <Layout>
    <div class="admin-container">
      <div class="container">
        <h2>管理后台</h2>
        <div class="admin-tabs">
          <button
            @click="activeTab = 'users'"
            :class="['tab', { active: activeTab === 'users' }]"
          >
            用户管理
          </button>
          <button
            @click="activeTab = 'articles'"
            :class="['tab', { active: activeTab === 'articles' }]"
          >
            文章管理
          </button>
          <button
            @click="activeTab = 'tags'"
            :class="['tab', { active: activeTab === 'tags' }]"
          >
            标签管理
          </button>
        </div>

        <!-- 用户管理 -->
        <div v-if="activeTab === 'users'" class="admin-content">
          <div class="toolbar">
            <input
              v-model="userSearchQuery"
              type="text"
              placeholder="搜索用户..."
              @keyup.enter="loadUsers"
            />
            <button @click="loadUsers">搜索</button>
            <button @click="showAddUserModal = true">添加用户</button>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>用户名</th>
                <th>邮箱</th>
                <th>角色</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.userId">
                <td>{{ user.userId }}</td>
                <td>{{ user.userName }}</td>
                <td>{{ user.email }}</td>
                <td>{{ user.role === 1 ? '管理员' : '普通用户' }}</td>
                <td>{{ user.status === 0 ? '正常' : '禁用' }}</td>
                <td>
                  <button @click="editUser(user)" class="btn-edit">编辑</button>
                  <button @click="deleteUser(user.userId)" class="btn-delete">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 文章管理 -->
        <div v-if="activeTab === 'articles'" class="admin-content">
          <div class="toolbar">
            <input
              v-model="articleSearchQuery"
              type="text"
              placeholder="搜索文章..."
              @keyup.enter="loadArticles"
            />
            <select v-model="articleStatusFilter" @change="loadArticles">
              <option value="all">全部状态</option>
              <option value="published">已发布</option>
              <option value="draft">草稿</option>
            </select>
            <button @click="loadArticles">搜索</button>
            <button @click="loadVectorStatus" :disabled="vectorLoading">查看向量库状态</button>
            <button @click="handleSyncVectors" :disabled="vectorSyncing">
              {{ vectorSyncing ? '同步中...' : '同步文章到向量库' }}
            </button>
          </div>
          <div v-if="vectorStatusMessage" class="vector-status">
            {{ vectorStatusMessage }}
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>标题</th>
                <th>作者</th>
                <th>标签</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="adminArticles.length === 0">
                <td colspan="6" class="empty-table">暂无文章</td>
              </tr>
              <tr v-for="article in adminArticles" :key="article.articleId">
                <td>{{ article.articleId }}</td>
                <td>{{ article.title }}</td>
                <td>{{ article.userId }}</td>
                <td>{{ article.tagName }}</td>
                <td>
                  <span :class="['status-badge', article.status === 1 ? 'published' : 'draft']">
                    {{ article.status === 1 ? '已发布' : '草稿' }}
                  </span>
                </td>
                <td>
                  <button @click="deleteArticle(article.articleId)" class="btn-delete">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 标签管理 -->
        <div v-if="activeTab === 'tags'" class="admin-content">
          <div class="toolbar">
            <button @click="showAddTagModal = true">添加标签</button>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>标签名</th>
                <th>使用数量</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tag in tags" :key="tag.tagId">
                <td>{{ tag.tagId }}</td>
                <td>{{ tag.tagName }}</td>
                <td>{{ tag.useCount }}</td>
                <td>{{ tag.status === 1 ? '启用' : '禁用' }}</td>
                <td>
                  <button @click="editTag(tag)" class="btn-edit">编辑</button>
                  <button @click="deleteTag(tag.tagId)" class="btn-delete">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 添加用户模态框 -->
      <div v-if="showAddUserModal" class="modal" @click.self="showAddUserModal = false">
        <div class="modal-content">
          <h3>添加用户</h3>
          <form @submit.prevent="handleAddUser">
            <div class="form-group">
              <label>用户名</label>
              <input v-model="userForm.userName" type="text" required />
            </div>
            <div class="form-group">
              <label>邮箱</label>
              <input v-model="userForm.email" type="email" required />
            </div>
            <div class="form-group">
              <label>密码</label>
              <input v-model="userForm.password" type="password" required />
            </div>
            <div class="form-actions">
              <button type="submit" class="submit-btn">添加</button>
              <button type="button" @click="showAddUserModal = false" class="cancel-btn">
                取消
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 编辑用户模态框 -->
      <div v-if="showEditUserModal" class="modal" @click.self="showEditUserModal = false">
        <div class="modal-content">
          <h3>编辑用户</h3>
          <form @submit.prevent="handleUpdateUser">
            <div class="form-group">
              <label>用户名</label>
              <input v-model="userForm.userName" type="text" required />
            </div>
            <div class="form-group">
              <label>邮箱</label>
              <input v-model="userForm.email" type="email" required disabled />
              <small style="color: #999; font-size: 12px;">邮箱不可修改</small>
            </div>
            <div class="form-group">
              <label>角色</label>
              <select v-model.number="userForm.role">
                <option :value="0">普通用户</option>
                <option :value="1">管理员</option>
              </select>
            </div>
            <div class="form-group">
              <label>状态</label>
              <select v-model.number="userForm.status">
                <option :value="0">正常</option>
                <option :value="1">禁用</option>
              </select>
            </div>
            <div style="padding: 10px; background: #f5f5f5; border-radius: 4px; margin-bottom: 15px; font-size: 12px; color: #666;">
              <strong>注意：</strong>密码修改需要使用专门的密码修改功能（/users/password 接口）
            </div>
            <div class="form-actions">
              <button type="submit" class="submit-btn">保存</button>
              <button type="button" @click="showEditUserModal = false" class="cancel-btn">
                取消
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 添加标签模态框 -->
      <div v-if="showAddTagModal" class="modal" @click.self="showAddTagModal = false">
        <div class="modal-content">
          <h3>添加标签</h3>
          <form @submit.prevent="handleAddTag">
            <div class="form-group">
              <label>标签名</label>
              <input v-model="tagForm.tagName" type="text" required />
            </div>
            <div class="form-group">
              <label>状态</label>
              <select v-model.number="tagForm.status">
                <option :value="0">禁用</option>
                <option :value="1">启用</option>
              </select>
            </div>
            <div class="form-actions">
              <button type="submit" class="submit-btn">添加</button>
              <button type="button" @click="showAddTagModal = false" class="cancel-btn">
                取消
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 编辑标签模态框 -->
      <div v-if="showEditTagModal" class="modal" @click.self="showEditTagModal = false">
        <div class="modal-content">
          <h3>编辑标签</h3>
          <form @submit.prevent="handleUpdateTag">
            <div class="form-group">
              <label>标签名</label>
              <input v-model="tagForm.tagName" type="text" required />
            </div>
            <div class="form-group">
              <label>状态</label>
              <select v-model.number="tagForm.status">
                <option :value="0">禁用</option>
                <option :value="1">启用</option>
              </select>
            </div>
            <div class="form-actions">
              <button type="submit" class="submit-btn">保存</button>
              <button type="button" @click="showEditTagModal = false" class="cancel-btn">
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { getUserList, addUser, deleteUsers, updateUser } from '@/api/user'
import { getArticleList, deleteArticles, getArticleVectorStatus, syncArticleVectors } from '@/api/article'
import { getTagList, addTag, deleteTags, updateTag } from '@/api/tag'
import Layout from '@/components/Layout.vue'

const activeTab = ref('users')
const users = ref([])
const adminArticles = ref([])
const tags = ref([])
const userSearchQuery = ref('')
const articleSearchQuery = ref('')
const articleStatusFilter = ref('all')
const vectorLoading = ref(false)
const vectorSyncing = ref(false)
const vectorStatusMessage = ref('')
const showAddUserModal = ref(false)
const showEditUserModal = ref(false)
const showAddTagModal = ref(false)
const showEditTagModal = ref(false)

const userForm = ref({
  userId: null,
  userName: '',
  email: '',
  password: '',
  role: 0,
  status: 0,
})

const tagForm = ref({
  tagId: null,
  tagName: '',
  status: 1,
})

const loadUsers = async () => {
  try {
    const res = await getUserList({
      query: userSearchQuery.value || undefined,
      page: 1,
      pageSize: 100,
    })
    if (res.code === 1) {
      users.value = res.data.rows || []
    }
  } catch (error) {
    console.error('加载用户失败:', error)
  }
}

const loadArticles = async () => {
  try {
    const statuses = getArticleStatuses()
    const results = await Promise.all(statuses.map((status) => fetchArticles(status)))
    adminArticles.value = results
      .flat()
      .sort((a, b) => getArticleTime(b) - getArticleTime(a))
  } catch (error) {
    console.error('加载文章失败:', error)
  }
}

const getArticleStatuses = () => {
  if (articleStatusFilter.value === 'published') return [1]
  if (articleStatusFilter.value === 'draft') return [0]
  return [1, 0]
}

const fetchArticles = async (status) => {
  const res = await getArticleList({
    query: articleSearchQuery.value || undefined,
    page: 1,
    pageSize: 100,
    status,
  })
  if (res.code === 1) {
    return res.data.rows || []
  }
  return []
}

const getArticleTime = (article) => {
  const value = article.updatedAt || article.publishedAt || article.createdAt || ''
  return value ? new Date(String(value).replace(' ', 'T')).getTime() : 0
}

const loadVectorStatus = async () => {
  vectorLoading.value = true
  try {
    const res = await getArticleVectorStatus()
    if (res.code === 1) {
      const data = res.data || {}
      vectorStatusMessage.value = data.isEmpty
        ? '向量库暂无可用文章，请先同步已发布文章。'
        : `向量库当前可检索文档约 ${data.docCount || 0} 条。`
    }
  } catch (error) {
    console.error('加载向量库状态失败:', error)
    vectorStatusMessage.value = '向量库状态获取失败，请确认后端、ES 和 embedding 配置正常。'
  } finally {
    vectorLoading.value = false
  }
}

const handleSyncVectors = async () => {
  if (!confirm('确定要将所有已发布文章同步到向量库吗？')) return

  vectorSyncing.value = true
  vectorStatusMessage.value = '正在同步已发布文章到向量库...'
  try {
    const res = await syncArticleVectors()
    if (res.code === 1) {
      vectorStatusMessage.value = res.data || '文章向量同步完成。'
      await loadVectorStatus()
    }
  } catch (error) {
    console.error('同步向量库失败:', error)
    vectorStatusMessage.value = '同步失败，请确认 Elasticsearch 和通义千问 embedding 服务可用。'
  } finally {
    vectorSyncing.value = false
  }
}

const loadTags = async () => {
  try {
    const res = await getTagList({ page: 1, pageSize: 100 })
    if (res.code === 1) {
      tags.value = res.data.rows || []
    }
  } catch (error) {
    console.error('加载标签失败:', error)
  }
}

const handleAddUser = async () => {
  try {
    const res = await addUser(userForm.value)
    if (res.code === 1) {
      showAddUserModal.value = false
      userForm.value = { userId: null, userName: '', email: '', password: '', role: 0, status: 0 }
      loadUsers()
    }
  } catch (error) {
    console.error('添加用户失败:', error)
  }
}

const handleUpdateUser = async () => {
  try {
    // 构建更新数据，不包含密码字段（如果密码为空则不修改）
    const updateData = {
      userId: userForm.value.userId,
      userName: userForm.value.userName,
      role: userForm.value.role,
      status: userForm.value.status,
      // 注意：根据接口文档，修改用户信息时不包含密码字段
      // 密码修改需要使用专门的密码修改接口
    }
    const res = await updateUser(updateData)
    if (res.code === 1) {
      showEditUserModal.value = false
      userForm.value = { userId: null, userName: '', email: '', password: '', role: 0, status: 0 }
      // 重新获取用户列表，确保数据一致性
      await loadUsers()
    }
  } catch (error) {
    console.error('更新用户失败:', error)
  }
}

const handleAddTag = async () => {
  try {
    const res = await addTag({ tagName: tagForm.value.tagName, status: 1 })
    if (res.code === 1) {
      showAddTagModal.value = false
      tagForm.value = { tagId: null, tagName: '', status: 1 }
      loadTags()
    }
  } catch (error) {
    console.error('添加标签失败:', error)
  }
}

const handleUpdateTag = async () => {
  try {
    const res = await updateTag(tagForm.value)
    if (res.code === 1) {
      showEditTagModal.value = false
      tagForm.value = { tagId: null, tagName: '', status: 1 }
      loadTags()
    }
  } catch (error) {
    console.error('更新标签失败:', error)
  }
}

const editUser = (user) => {
  // 填充表单数据
  userForm.value = {
    userId: user.userId,
    userName: user.userName || '',
    email: user.email || '',
    password: '', // 编辑时密码留空，不修改则不更新
    role: user.role || 0,
    status: user.status || 0,
  }
  showEditUserModal.value = true
}

const editTag = (tag) => {
  // 填充表单数据
  tagForm.value = {
    tagId: tag.tagId,
    tagName: tag.tagName || '',
    status: tag.status !== undefined ? tag.status : 1,
  }
  showEditTagModal.value = true
}

const deleteUser = async (id) => {
  if (confirm('确定要删除该用户吗？')) {
    try {
      const res = await deleteUsers(id)
      if (res.code === 1) {
        loadUsers()
      }
    } catch (error) {
      console.error('删除用户失败:', error)
    }
  }
}

const deleteArticle = async (id) => {
  if (confirm('确定要删除该文章吗？')) {
    try {
      const res = await deleteArticles(id)
      if (res.code === 1) {
        loadArticles()
      }
    } catch (error) {
      console.error('删除文章失败:', error)
    }
  }
}

const deleteTag = async (id) => {
  if (confirm('确定要删除该标签吗？')) {
    try {
      const res = await deleteTags(id)
      if (res.code === 1) {
        loadTags()
      }
    } catch (error) {
      console.error('删除标签失败:', error)
    }
  }
}

onMounted(() => {
  loadUsers()
  loadTags()
})

// 监听 tab 切换
watch(activeTab, (newTab) => {
  if (newTab === 'articles') {
    loadArticles()
  } else if (newTab === 'tags') {
    loadTags()
  } else if (newTab === 'users') {
    loadUsers()
  }
})
</script>

<style scoped>
.admin-container {
  min-height: calc(100vh - 200px);
  padding: 40px 0 64px;
  background: var(--color-bg);
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

h2 {
  margin: 0 0 24px;
  color: var(--color-text);
  font-size: 30px;
  letter-spacing: 0;
}

.admin-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  padding: 6px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
  width: fit-content;
  box-shadow: var(--shadow-sm);
}

.tab {
  padding: 10px 18px;
  background: none;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  color: var(--color-text-muted);
  font-size: 15px;
  font-weight: 800;
  transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.tab.active {
  color: #fff;
  background: linear-gradient(135deg, var(--color-primary, #4f8ef7), var(--color-accent, #7c5cfc));
  box-shadow: 0 10px 22px rgba(79, 142, 247, 0.22);
}

.admin-content {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 22px;
  padding: 22px;
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.toolbar input,
.toolbar select {
  flex: 1;
  min-width: 180px;
  padding: 11px 13px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-surface-soft);
  color: var(--color-text);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.toolbar input:focus,
.toolbar select:focus {
  border-color: var(--color-primary);
  background: var(--color-surface);
  box-shadow: 0 0 0 4px rgba(79, 142, 247, 0.12);
}

.toolbar select {
  flex: 0 0 140px;
}

.toolbar button {
  padding: 10px 18px;
  background: linear-gradient(135deg, var(--color-primary, #4f8ef7), var(--color-accent, #7c5cfc));
  color: #fff;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 800;
  box-shadow: 0 10px 20px rgba(79, 142, 247, 0.18);
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.toolbar button:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 26px rgba(79, 142, 247, 0.26);
}

.toolbar button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.vector-status {
  margin-bottom: 16px;
  padding: 11px 14px;
  border-radius: 12px;
  background: rgba(79, 142, 247, 0.10);
  border: 1px solid rgba(79, 142, 247, 0.20);
  color: var(--color-primary);
  font-size: 14px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  color: var(--color-text);
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.data-table th {
  background: var(--color-surface-soft);
  color: var(--color-text);
  font-weight: 800;
  white-space: nowrap;
}

.data-table tbody tr {
  transition: background 0.2s ease;
}

.data-table tbody tr:hover {
  background: rgba(79, 142, 247, 0.05);
}

.empty-table {
  text-align: center;
  color: var(--color-text-muted);
  padding: 32px 12px;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
}

.status-badge.published {
  background: rgba(34, 197, 94, 0.12);
  color: #16a34a;
}

.status-badge.draft {
  background: rgba(245, 158, 11, 0.14);
  color: #d97706;
}

.btn-edit,
.btn-delete {
  padding: 7px 12px;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  margin-right: 5px;
  font-weight: 800;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.btn-edit:hover,
.btn-delete:hover {
  transform: translateY(-1px);
}

.btn-edit {
  background: rgba(79, 142, 247, 0.14);
  color: var(--color-primary);
}

.btn-delete {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}

:global(.dark) .btn-edit {
  background: rgba(96, 165, 250, 0.18);
  color: #93c5fd;
}

:global(.dark) .btn-delete {
  background: rgba(248, 113, 113, 0.18);
  color: #fca5a5;
}

:global(.dark) .status-badge.published {
  color: #86efac;
}

:global(.dark) .status-badge.draft {
  color: #fcd34d;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.58);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(8px);
}

.modal-content {
  background: var(--color-surface);
  color: var(--color-text);
  padding: 28px;
  border: 1px solid var(--color-border);
  border-radius: 22px;
  width: 90%;
  max-width: 500px;
  box-shadow: var(--shadow-lg);
}

.modal-content h3 {
  margin: 0 0 20px 0;
  font-size: 22px;
  letter-spacing: 0;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: var(--color-text);
  font-weight: 800;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 11px 13px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-sizing: border-box;
  background: var(--color-surface-soft);
  color: var(--color-text);
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(79, 142, 247, 0.12);
}

.form-group input:disabled {
  color: var(--color-text-muted);
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.submit-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, var(--color-primary, #4f8ef7), var(--color-accent, #7c5cfc));
  color: #fff;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 800;
}

.cancel-btn {
  padding: 10px 20px;
  background: var(--color-surface-soft);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  cursor: pointer;
  font-weight: 800;
}

@media (max-width: 900px) {
  .admin-tabs {
    width: 100%;
    overflow-x: auto;
  }

  .admin-content {
    padding: 16px;
    overflow-x: auto;
  }

  .data-table {
    min-width: 760px;
  }
}

@media (max-width: 640px) {
  h2 {
    font-size: 24px;
  }

  .toolbar {
    flex-direction: column;
  }

  .toolbar input,
  .toolbar select,
  .toolbar button {
    width: 100%;
    flex: none;
  }

  .form-actions {
    flex-direction: column;
  }

  .submit-btn,
  .cancel-btn {
    width: 100%;
  }
}
</style>

