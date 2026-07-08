<template>
  <div class="layout">
    <header class="header">
      <div class="container">
        <div class="logo" @click="$router.push('/')">
          <span class="logo-mark">N</span>
          <div>
            <h1>Nuoma Blog</h1>
            <small>技术交流社区</small>
          </div>
        </div>
        <nav class="nav">
          <router-link to="/" class="nav-item">
            <HomeFilled />
            首页
          </router-link>
          <template v-if="userStore.isLoggedIn">
            <router-link to="/search" class="nav-item">
              <Search />
              搜索
            </router-link>
            <router-link to="/assistant" class="nav-item">
              <MagicStick />
              AI助手
            </router-link>
            <router-link to="/favorites" class="nav-item">
              <Star />
              收藏
            </router-link>
            <router-link :to="`/profile/${userStore.userInfo?.userId}`" class="nav-item">
              <User />
              个人中心
            </router-link>
            <template v-if="userStore.isAdmin">
              <router-link to="/admin" class="nav-item">管理后台</router-link>
            </template>
            <router-link to="/article/edit" class="write-btn">
              <EditPen />
              写文章
            </router-link>
            <button class="theme-btn" :title="isDark ? '切换浅色模式' : '切换深色模式'" @click="toggleTheme">
              <Sunny v-if="isDark" />
              <Moon v-else />
            </button>
            <div class="user-info">
              <img :src="userStore.userInfo?.avatar || '/default-avatar.png'" alt="avatar" class="avatar" />
              <span class="username">{{ userStore.userInfo?.userName }}</span>
              <button @click="handleLogout" class="logout-btn">退出</button>
            </div>
          </template>
          <template v-else>
            <router-link to="/search" class="nav-item">
              <Search />
              搜索
            </router-link>
            <button class="theme-btn" :title="isDark ? '切换浅色模式' : '切换深色模式'" @click="toggleTheme">
              <Sunny v-if="isDark" />
              <Moon v-else />
            </button>
            <router-link to="/login" class="nav-item">登录</router-link>
            <router-link to="/register" class="write-btn">注册</router-link>
          </template>
        </nav>
      </div>
    </header>
    <main class="main">
      <slot></slot>
    </main>
    <footer class="footer">
      <div class="container">
        <p>&copy; 2025 博客系统. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { onMounted, ref } from 'vue'
import { EditPen, HomeFilled, MagicStick, Moon, Search, Star, Sunny, User } from '@element-plus/icons-vue'

const userStore = useUserStore()
const router = useRouter()
const isDark = ref(false)

const applyTheme = () => {
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  applyTheme()
}

const handleLogout = () => {
  userStore.logout()
  router.push('/')
}

onMounted(() => {
  isDark.value = localStorage.getItem('theme') === 'dark'
  applyTheme()
})
</script>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--gradient-page);
}

.header {
  background: color-mix(in srgb, var(--color-surface) 86%, transparent);
  border-bottom: 1px solid var(--color-border);
  backdrop-filter: blur(18px);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: var(--shadow-sm);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.header .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 68px;
  gap: 18px;
}

.logo {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.logo-mark {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-md);
  background: var(--gradient-primary);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  box-shadow: 0 10px 24px rgba(79, 142, 247, 0.3);
}

.logo h1 {
  margin: 0;
  font-size: 20px;
  color: var(--color-text);
  line-height: 1.1;
}

.logo small {
  color: var(--color-muted);
  font-size: 12px;
}

.nav {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.nav-item {
  text-decoration: none;
  color: var(--color-muted);
  padding: 8px 10px;
  border-radius: 999px;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  border: 1px solid transparent;
}

.nav-item svg,
.write-btn svg,
.theme-btn svg {
  width: 16px;
  height: 16px;
}

.nav-item:hover {
  background: var(--color-surface-soft);
  color: var(--color-primary);
  border-color: var(--color-border);
}

.nav-item.router-link-active {
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  border-color: color-mix(in srgb, var(--color-primary) 22%, transparent);
}

.write-btn,
.theme-btn {
  height: 36px;
  border: none;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.write-btn {
  gap: 6px;
  padding: 0 14px;
  background: var(--gradient-primary);
  color: #fff;
  text-decoration: none;
  font-size: 14px;
  box-shadow: 0 10px 24px rgba(79, 142, 247, 0.22);
}

.theme-btn {
  width: 36px;
  background: var(--color-surface-soft);
  color: var(--color-muted);
  border: 1px solid var(--color-border);
}

.write-btn:hover,
.theme-btn:hover {
  transform: translateY(-1px);
}

.theme-btn:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 6px;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--color-border);
}

.username {
  font-size: 14px;
  color: var(--color-text);
}

.logout-btn {
  padding: 6px 12px;
  background: color-mix(in srgb, #f56c6c 14%, transparent);
  color: #f56c6c;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  font-size: 14px;
}

.logout-btn:hover {
  background: color-mix(in srgb, #f56c6c 22%, transparent);
  transform: translateY(-1px);
}

.main {
  flex: 1;
}

.footer {
  background: color-mix(in srgb, var(--color-surface) 88%, transparent);
  border-top: 1px solid var(--color-border);
  padding: 20px 0;
  text-align: center;
  color: var(--color-muted);
}

@media (max-width: 960px) {
  .header .container {
    align-items: flex-start;
    flex-direction: column;
    padding-top: 12px;
    padding-bottom: 12px;
  }

  .nav {
    justify-content: flex-start;
    width: 100%;
  }

  .user-info {
    width: 100%;
    margin-left: 0;
    padding-top: 4px;
  }
}
</style>
