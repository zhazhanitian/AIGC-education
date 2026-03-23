<template>
  <div class="login-view">
    <div class="card">
      <div class="title">{{ mode === 'login' ? '登录' : '注册' }}</div>
      <div class="form">
        <input v-model="username" class="input" placeholder="用户名" autocomplete="username" />
        <input v-model="password" class="input" type="password" placeholder="密码" autocomplete="current-password" />
        <button class="btn" :disabled="loading || !username || !password" @click="submit">
          {{ loading ? '处理中...' : (mode === 'login' ? '登录' : '注册') }}
        </button>
        <button class="link" :disabled="loading" @click="toggle">
          {{ mode === 'login' ? '没有账号？去注册' : '已有账号？去登录' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const mode = ref('login')
const username = ref('')
const password = ref('')
const loading = ref(false)

const toggle = () => {
  mode.value = mode.value === 'login' ? 'register' : 'login'
}

const submit = async () => {
  if (!username.value || !password.value || loading.value) return
  loading.value = true
  try {
    if (mode.value === 'login') {
      await auth.login({ username: username.value, password: password.value })
    } else {
      await auth.register({ username: username.value, password: password.value })
    }
    router.push('/')
  } catch (e) {
    alert(e?.response?.data?.error || '操作失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-view {
  min-height: 100vh;
  padding-top: 60px; /* 为固定导航栏留出空间 */
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-page);
}
.card {
  width: 360px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);
}
.title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-title);
  margin-bottom: 16px;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.input {
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: #fff;
  outline: none;
}
.btn {
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.link {
  height: 36px;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
}
.link:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

