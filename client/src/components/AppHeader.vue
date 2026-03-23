<template>
  <header class="app-header">
    <div class="header-container">
      <div class="logo">
        <span class="logo-icon">🍌</span>
        <span class="logo-text">Nano Banana Pro</span>
      </div>
      <nav class="nav">
        <router-link to="/" class="nav-item" active-class="active">生图</router-link>
        <router-link to="/ppt" class="nav-item" active-class="active">AI PPT</router-link>
        <router-link to="/chat" class="nav-item" active-class="active">文字</router-link>
        <router-link to="/gallery" class="nav-item" active-class="active">作品集</router-link>
      </nav>
      <div class="auth">
        <span v-if="auth.isLoggedIn" class="user">{{ auth.username }}</span>
        <button v-if="!auth.isLoggedIn" class="auth-btn" @click="goLogin">登录</button>
        <button v-else class="auth-btn" @click="doLogout">退出</button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const goLogin = () => router.push('/login')
const doLogout = () => {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.app-header {
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border-light);
  padding: var(--spacing-md) 0;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: 600;
  font-size: 18px;
  color: var(--color-text-title);
}

.logo-icon {
  font-size: 24px;
}

.nav {
  display: flex;
  gap: var(--spacing-lg);
}

.nav-item {
  color: var(--color-text-secondary);
  font-size: 15px;
  padding: 8px 16px; /* 增加点击区域 */
  border-radius: var(--radius-sm);
  transition: all 0.2s;
  cursor: pointer;
  text-decoration: none;
  font-weight: 500;
}

.nav-item:hover {
  color: var(--color-primary);
  background: var(--color-primary-soft);
}

.nav-item.active,
.nav-item.router-link-active {
  color: var(--color-primary);
  background: var(--color-primary-subtle);
  font-weight: 600;
}

.auth {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.user {
  font-size: 14px;
  color: var(--color-text-secondary);
  background: var(--color-bg-container);
  padding: 6px 10px;
  border-radius: var(--radius-md);
}

.auth-btn {
  height: 34px;
  padding: 0 12px;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: #fff;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
}
</style>

