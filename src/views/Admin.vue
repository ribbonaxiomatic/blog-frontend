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
            <button @click="loadArticles">搜索</button>
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
              <tr v-for="article in adminArticles" :key="article.articleId">
                <td>{{ article.articleId }}</td>
                <td>{{ article.title }}</td>
                <td>{{ article.userId }}</td>
                <td>{{ article.tagName }}</td>
                <td>{{ article.status === 1 ? '已发布' : '草稿' }}</td>
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
import { getArticleList, deleteArticles } from '@/api/article'
import { getTagList, addTag, deleteTags, updateTag } from '@/api/tag'
import Layout from '@/components/Layout.vue'

const activeTab = ref('users')
const users = ref([])
const adminArticles = ref([])
const tags = ref([])
const userSearchQuery = ref('')
const articleSearchQuery = ref('')
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
      status: 0,
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
    const res = await getArticleList({
      query: articleSearchQuery.value || undefined,
      page: 1,
      pageSize: 100,
      status: 1,
    })
    if (res.code === 1) {
      adminArticles.value = res.data.rows || []
    }
  } catch (error) {
    console.error('加载文章失败:', error)
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
  padding: 40px 0;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

h2 {
  margin-bottom: 30px;
  color: #333;
}

.admin-tabs {
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

.admin-content {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.toolbar input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.toolbar button {
  padding: 10px 20px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.toolbar button:hover {
  background: #66b1ff;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.data-table th {
  background: #f5f5f5;
  font-weight: 600;
}

.btn-edit,
.btn-delete {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 5px;
}

.btn-edit {
  background: #409eff;
  color: #fff;
}

.btn-delete {
  background: #f56c6c;
  color: #fff;
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

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
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

