import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authAPI } from '../api'

const TOKEN_KEY = 'nano-banana-token'
const USERNAME_KEY = 'nano-banana-username'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || '')
  const username = ref(localStorage.getItem(USERNAME_KEY) || '')

  const isLoggedIn = computed(() => !!token.value && !!username.value)

  const setAuth = ({ token: t, username: u }) => {
    token.value = t || ''
    username.value = u || ''
    if (token.value) localStorage.setItem(TOKEN_KEY, token.value)
    else localStorage.removeItem(TOKEN_KEY)
    if (username.value) localStorage.setItem(USERNAME_KEY, username.value)
    else localStorage.removeItem(USERNAME_KEY)
  }

  const login = async ({ username: u, password }) => {
    const data = await authAPI.login({ username: u, password })
    setAuth({ token: data.token, username: data.user.username })
  }

  const register = async ({ username: u, password }) => {
    const data = await authAPI.register({ username: u, password })
    setAuth({ token: data.token, username: data.user.username })
  }

  const logout = () => {
    setAuth({ token: '', username: '' })
  }

  return { token, username, isLoggedIn, login, register, logout }
})

