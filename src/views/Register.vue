<template>
  <Layout>
    <div class="register-container">
      <div class="register-box">
        <h2>注册</h2>
        <form @submit.prevent="handleRegister">
          <div class="form-group">
            <label>邮箱</label>
            <input v-model="form.email" type="email" required placeholder="请输入邮箱" />
          </div>
          <div class="form-group">
            <label>密码</label>
            <input v-model="form.password" type="password" required placeholder="请输入密码" />
          </div>
          <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
          <button type="submit" class="submit-btn" :disabled="loading">
            {{ loading ? '注册中...' : '注册' }}
          </button>
          <div class="link-text">
            已有账号？
            <router-link to="/login">立即登录</router-link>
          </div>
        </form>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import Layout from '@/components/Layout.vue'

const router = useRouter()
const userStore = useUserStore()

const form = ref({
  email: '',
  password: '',
})

const loading = ref(false)
const errorMessage = ref('')

const handleRegister = async () => {
  loading.value = true
  errorMessage.value = ''

  const result = await userStore.registerAction(form.value)

  if (result.success) {
    router.push('/')
  } else {
    errorMessage.value = result.message || '注册失败，该邮箱可能已被使用'
  }

  loading.value = false
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 160px);
  padding: 56px 20px;
  background:
    linear-gradient(135deg, rgba(79, 142, 247, 0.10), rgba(124, 92, 252, 0.08)),
    var(--color-bg);
}

.register-box {
  width: 100%;
  max-width: 420px;
  background: var(--color-surface);
  padding: 36px;
  border: 1px solid var(--color-border);
  border-radius: 22px;
  box-shadow: var(--shadow-lg);
}

h2 {
  text-align: center;
  margin-bottom: 28px;
  color: var(--color-text);
  font-size: 28px;
  letter-spacing: 0;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: var(--color-text);
  font-weight: 700;
}

.form-group input {
  width: 100%;
  padding: 13px 14px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  font-size: 14px;
  box-sizing: border-box;
  background: var(--color-surface-soft);
  color: var(--color-text);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary);
  background: var(--color-surface);
  box-shadow: 0 0 0 4px rgba(79, 142, 247, 0.14);
}

.error-message {
  color: #ef4444;
  font-size: 14px;
  margin-bottom: 15px;
  text-align: center;
}

.submit-btn {
  width: 100%;
  padding: 13px 18px;
  background: var(--gradient-primary);
  color: #fff;
  border: none;
  border-radius: 999px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 14px 28px rgba(79, 142, 247, 0.24);
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 18px 34px rgba(79, 142, 247, 0.30);
}

.submit-btn:disabled {
  opacity: 0.58;
  cursor: not-allowed;
  box-shadow: none;
}

.link-text {
  text-align: center;
  margin-top: 20px;
  color: var(--color-text-muted);
  font-size: 14px;
}

.link-text a {
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 700;
}

.link-text a:hover {
  color: var(--color-accent);
}

@media (max-width: 640px) {
  .register-container {
    padding: 32px 16px;
  }

  .register-box {
    padding: 28px 22px;
    border-radius: 18px;
  }
}
</style>

