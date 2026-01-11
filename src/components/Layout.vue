<template>
  <div class="layout">
    <header class="header">
      <div class="container">
        <div class="logo" @click="$router.push('/')">
          <h1>博客系统</h1>
        </div>
        <nav class="nav">
          <router-link to="/" class="nav-item">首页</router-link>
          <template v-if="userStore.isLoggedIn">
            <!-- 在导航栏中添加搜索链接 -->
            <router-link to="/search" class="nav-item">搜索</router-link>
            <router-link to="/article/edit" class="nav-item">写文章</router-link>
            <router-link to="/favorites" class="nav-item">我的收藏</router-link>
            <router-link :to="`/profile/${userStore.userInfo?.userId}`" class="nav-item">个人中心</router-link>
            <template v-if="userStore.isAdmin">
              <router-link to="/admin" class="nav-item">管理后台</router-link>
            </template>
            <div class="user-info">
              <img :src="userStore.userInfo?.avatar" alt="avatar" class="avatar" />
              <span class="username">{{ userStore.userInfo?.userName }}</span>
              <button @click="handleLogout" class="logout-btn">退出</button>
            </div>
          </template>
          <template v-else>
            <router-link to="/login" class="nav-item">登录</router-link>
            <router-link to="/register" class="nav-item">注册</router-link>
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

const userStore = useUserStore()
const router = useRouter()

const handleLogout = () => {
  userStore.logout()
  router.push('/')
}
</script>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
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
  height: 60px;
}

.logo {
  cursor: pointer;
}

.logo h1 {
  margin: 0;
  font-size: 24px;
  color: #409eff;
}

.nav {
  display: flex;
  align-items: center;
  gap: 20px;
}

.nav-item {
  text-decoration: none;
  color: #333;
  padding: 8px 16px;
  border-radius: 4px;
  transition: background 0.3s;
}

.nav-item:hover {
  background: #f5f5f5;
}

.nav-item.router-link-active {
  color: #409eff;
  background: #ecf5ff;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: 20px;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.username {
  font-size: 14px;
  color: #333;
}

.logout-btn {
  padding: 6px 12px;
  background: #f56c6c;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.logout-btn:hover {
  background: #f78989;
}

.main {
  flex: 1;
  padding: 20px 0;
}

.footer {
  background: #f5f5f5;
  padding: 20px 0;
  text-align: center;
  color: #666;
}
</style>
