<template>
  <div class="chat-view">
    <div class="chat-container">
      <!-- 侧边栏 -->
      <aside class="chat-sidebar">
        <div class="sidebar-header">
          <button class="new-chat-btn" @click="newChat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            新对话
          </button>
        </div>
        <div class="model-selector">
          <label>模型选择</label>
          <div class="select-wrapper">
            <select v-model="selectedModel">
              <option value="gemini-3-pro">Gemini 3 Pro</option>
              <option value="gemini-3-flash">Gemini 3 Flash</option>
            </select>
            <svg class="select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
        <div class="chat-history">
          <div class="history-label">历史对话</div>
          <div 
            v-for="(chat, index) in chatHistory" 
            :key="index"
            class="history-item"
            :class="{ active: currentChatIndex === index }"
            @click="switchChat(index)"
          >
            <svg class="history-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span class="history-title">{{ chat.title || '新对话' }}</span>
            <button class="delete-btn" @click.stop="deleteChat(index)" title="删除">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
        <div class="sidebar-footer">
          <button class="clear-all-btn" @click="clearAllHistory" title="清除所有历史记录">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            清除所有历史
          </button>
        </div>
      </aside>

      <!-- 主聊天区域 -->
      <main class="chat-main">
        <div class="messages-container" ref="messagesContainer">
          <div v-if="currentMessages.length === 0" class="empty-state">
            <div class="empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                <line x1="9" y1="9" x2="9.01" y2="9"></line>
                <line x1="15" y1="9" x2="15.01" y2="9"></line>
              </svg>
            </div>
            <h2>开启智能对话</h2>
            <p>基于 Gemini 3 Pro 的深度推理模型</p>
          </div>
          
          <template v-for="(msg, index) in currentMessages" :key="index">
            <div class="message-row" :class="msg.role">
              <div class="message-avatar">
                <template v-if="msg.role === 'user'">
                  <div class="avatar-icon user">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                </template>
                <template v-else>
                  <div class="avatar-icon assistant">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A1.5 1.5 0 0 0 6 14.5 1.5 1.5 0 0 0 7.5 16 1.5 1.5 0 0 0 9 14.5 1.5 1.5 0 0 0 7.5 13m9 0a1.5 1.5 0 0 0-1.5 1.5 1.5 1.5 0 0 0 1.5 1.5 1.5 1.5 0 0 0 1.5-1.5 1.5 1.5 0 0 0-1.5-1.5z"></path>
                    </svg>
                  </div>
                </template>
              </div>
              
              <div class="message-content-wrapper">
                <!-- 附件展示 -->
                <div v-if="msg.attachments && msg.attachments.length > 0" class="attachment-grid">
                  <div v-for="(att, i) in msg.attachments" :key="i">
                    <img v-if="att.type === 'image'" :src="att.preview" class="msg-image" />
                    <div v-else class="msg-file">
                      <span>📄</span> {{ att.name }}
                    </div>
                  </div>
                </div>

                <div class="message-bubble">
                  <!-- 初始加载状态 -->
                  <div v-if="msg.role === 'assistant' && !msg.displayThinking && !msg.displayContent" class="initial-loading">
                    <div class="typing-indicator">
                      <span></span><span></span><span></span>
                    </div>
                    <span class="loading-text">正在思考...</span>
                  </div>

                  <!-- 深度思考区块 -->
                  <div v-if="msg.thinking || msg.thinkingTyping" class="thinking-module">
                    <div class="thinking-header" @click="msg.thinkingExpanded = !msg.thinkingExpanded">
                      <div class="thinking-status">
                        <svg class="status-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="16" x2="12" y2="12"></line>
                          <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                        <span>深度思考过程</span>
                        <span v-if="!msg.thinkingFinished" class="thinking-dots">...</span>
                        <span v-else class="thinking-duration">{{ msg.thinkingDuration }}s</span>
                      </div>
                      <svg class="chevron" :class="{ expanded: msg.thinkingExpanded }" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                    <div class="thinking-body" :class="{ expanded: msg.thinkingExpanded }">
                      <div class="thinking-content-inner">
                        {{ msg.displayThinking }}<span v-if="!msg.thinkingFinished" class="cursor">_</span>
                      </div>
                    </div>
                  </div>
                  
                  <!-- 正文内容 -->
                  <div v-if="msg.displayContent || msg.content || msg.contentTyping" class="markdown-body">
                    <div v-html="renderMarkdown(msg.displayContent || msg.content)"></div>
                    <span v-if="!msg.finished && msg.role === 'assistant'" class="cursor block-cursor"></span>
                  </div>
                  
                  <!-- 联网搜索来源 -->
                  <div v-if="msg.hasWebSearch && msg.searchResults && msg.finished" class="search-sources">
                    <div class="sources-header" @click="msg.sourcesExpanded = !msg.sourcesExpanded">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                      </svg>
                      <span>搜索来源 ({{ msg.searchResults.length }})</span>
                      <svg class="expand-icon" :class="{ expanded: msg.sourcesExpanded }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </div>
                    <div v-if="msg.sourcesExpanded" class="sources-list">
                      <a v-for="(source, i) in msg.searchResults" :key="i" :href="source.link" target="_blank" class="source-item">
                        <span class="source-num">{{ i + 1 }}</span>
                        <span class="source-title">{{ source.title }}</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- 输入区域 -->
        <div class="input-container">
          <!-- 文件预览区 -->
          <div v-if="attachments.length > 0" class="attachment-preview">
            <div v-for="(file, index) in attachments" :key="index" class="attachment-item">
              <div v-if="file.type.startsWith('image/')" class="image-preview">
                <img :src="file.preview" alt="preview" />
              </div>
              <div v-else class="file-preview">
                <div class="file-icon">📄</div>
                <span class="file-name">{{ file.name }}</span>
              </div>
              <button class="remove-btn" @click="removeAttachment(index)">×</button>
            </div>
          </div>

          <div class="input-wrapper">
            <button class="upload-btn" @click="triggerUpload" title="上传图片或文件">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
              </svg>
            </button>
            <input 
              type="file" 
              ref="fileInput" 
              class="hidden-input" 
              multiple 
              accept="image/*,text/*,.pdf,.json,.js,.py,.html,.css,.md,.txt" 
              @change="handleFileSelect"
            />
            
            <textarea 
              v-model="inputText"
              @keydown.enter.exact="handleEnter"
              @input="autoResize"
              @paste="handlePaste"
              placeholder="输入问题... (Enter 发送)"
              rows="1"
              ref="inputArea"
            ></textarea>
            <button 
              class="send-btn" 
              @click="sendMessage"
              :disabled="(!inputText.trim() && attachments.length === 0) || isLoading"
              :title="isLoading ? '生成中...' : '发送消息'"
            >
              <svg v-if="!isLoading" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
              <div v-else class="loading-spinner"></div>
            </button>
          </div>
          <div class="input-actions">
            <button 
              class="web-search-toggle" 
              :class="{ active: webSearchEnabled }"
              @click="webSearchEnabled = !webSearchEnabled"
              :title="webSearchEnabled ? '关闭联网搜索' : '开启联网搜索'"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              <span>联网搜索</span>
              <span v-if="webSearchEnabled" class="status-dot"></span>
            </button>
            <div class="input-hint">
              <span class="model-badge">{{ selectedModel }}</span>
              <span>AI 生成内容仅供参考</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, computed, watch } from 'vue'
import { chatAPI, searchAPI } from '../api'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="hljs code-block-wrapper"><code>' +
               hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
               '</code></pre>';
      } catch (__) {}
    }
    return '<pre class="hljs code-block-wrapper"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
  }
})

// ======= 历史记录持久化 =======
const CHAT_STORAGE_KEY = 'lutanano_chat_history'
const CHAT_INDEX_KEY = 'lutanano_chat_index'

// 保存聊天历史到 localStorage
function saveHistoryToStorage() {
  try {
    // 清理消息中的临时状态，只保存必要数据
    const cleanHistory = chatHistory.value.map(chat => ({
      title: chat.title,
      messages: chat.messages.map(msg => {
        // 用户消息
        if (msg.role === 'user') {
          return {
            role: msg.role,
            content: msg.content,
            attachments: msg.attachments?.map(att => ({
              type: att.type,
              name: att.name,
              // 对于图片，保留 base64（可能较大），文本保留 content
              content: att.content,
              preview: att.type === 'image' ? att.content : null
            })) || []
          }
        }
        // 助手消息：只保存最终内容
        return {
          role: msg.role,
          content: msg.content || msg.displayContent || '',
          thinking: msg.thinking || msg.displayThinking || '',
          // 保存搜索相关信息
          hasWebSearch: msg.hasWebSearch || false,
          searchResults: msg.searchResults || null
        }
      })
    }))
    
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(cleanHistory))
    localStorage.setItem(CHAT_INDEX_KEY, String(currentChatIndex.value))
  } catch (e) {
    console.warn('保存聊天历史失败:', e)
    // 如果存储空间不足，尝试清理旧的对话
    if (e.name === 'QuotaExceededError') {
      trimOldChats()
    }
  }
}

// 清理旧对话以节省存储空间
function trimOldChats() {
  if (chatHistory.value.length > 10) {
    // 保留最近10个对话
    chatHistory.value = chatHistory.value.slice(0, 10)
    saveHistoryToStorage()
  }
}

// 从 localStorage 加载聊天历史
function loadHistoryFromStorage() {
  try {
    const saved = localStorage.getItem(CHAT_STORAGE_KEY)
    const savedIndex = localStorage.getItem(CHAT_INDEX_KEY)
    
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        // 恢复消息的显示状态
        chatHistory.value = parsed.map(chat => ({
          title: chat.title,
          messages: chat.messages.map(msg => {
            if (msg.role === 'user') {
              return {
                role: msg.role,
                content: msg.content,
                attachments: msg.attachments || []
              }
            }
            // 助手消息：恢复显示状态
            return {
              role: msg.role,
              content: msg.content || '',
              displayContent: msg.content || '',
              thinking: msg.thinking || '',
              displayThinking: msg.thinking || '',
              thinkingExpanded: false, // 默认折叠
              finished: true,
              thinkingFinished: true,
              thinkingDuration: null,
              // 恢复搜索相关信息
              hasWebSearch: msg.hasWebSearch || false,
              searchResults: msg.searchResults || null,
              sourcesExpanded: false
            }
          })
        }))
        
        // 恢复当前对话索引
        if (savedIndex !== null) {
          const idx = parseInt(savedIndex, 10)
          if (idx >= 0 && idx < chatHistory.value.length) {
            currentChatIndex.value = idx
          }
        }
        
        return true
      }
    }
  } catch (e) {
    console.warn('加载聊天历史失败:', e)
  }
  return false
}

const selectedModel = ref('gemini-3-pro')
const inputText = ref('')
const isLoading = ref(false)
const messagesContainer = ref(null)
const inputArea = ref(null)
const fileInput = ref(null)
const attachments = ref([]) // { type, name, content, preview }

// 联网搜索
const webSearchEnabled = ref(false)
const isSearching = ref(false)
const lastSearchResults = ref(null)

const chatHistory = ref([{ title: '新对话', messages: [] }])
const currentChatIndex = ref(0)

const currentMessages = computed(() => {
  return chatHistory.value[currentChatIndex.value]?.messages || []
})

function newChat() {
  chatHistory.value.unshift({ title: '新对话', messages: [] })
  currentChatIndex.value = 0
  attachments.value = []
}

function switchChat(index) {
  currentChatIndex.value = index
  attachments.value = []
}

function deleteChat(index) {
  if (chatHistory.value.length === 1) {
    chatHistory.value[0] = { title: '新对话', messages: [] }
  } else {
    chatHistory.value.splice(index, 1)
    if (currentChatIndex.value >= chatHistory.value.length) {
      currentChatIndex.value = chatHistory.value.length - 1
    }
  }
}

function clearAllHistory() {
  if (confirm('确定要清除所有历史记录吗？此操作不可恢复。')) {
    chatHistory.value = [{ title: '新对话', messages: [] }]
    currentChatIndex.value = 0
    localStorage.removeItem(CHAT_STORAGE_KEY)
    localStorage.removeItem(CHAT_INDEX_KEY)
  }
}

function handleEnter(e) {
  if (!e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

function autoResize() {
  const textarea = inputArea.value
  if (textarea) {
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'
  }
}

// 文件处理逻辑
const triggerUpload = () => fileInput.value?.click()

const handleFileSelect = async (e) => {
  const files = Array.from(e.target.files)
  if (!files.length) return
  await processFiles(files)
  e.target.value = '' // 重置输入框
}

const handlePaste = async (e) => {
  const items = e.clipboardData?.items
  if (!items) return

  const files = []
  for (const item of items) {
    if (item.kind === 'file') {
      files.push(item.getAsFile())
    }
  }
  
  if (files.length > 0) {
    await processFiles(files)
  }
}

const processFiles = async (files) => {
  for (const file of files) {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        attachments.value.push({
          type: 'image',
          name: file.name,
          preview: e.target.result,
          content: e.target.result // Base64
        })
      }
      reader.readAsDataURL(file)
    } else if (file.type.startsWith('text/') || file.name.match(/\.(json|js|py|html|css|md|vue|ts)$/i)) {
      const reader = new FileReader()
      reader.onload = (e) => {
        attachments.value.push({
          type: 'text',
          name: file.name,
          preview: null,
          content: e.target.result // Text content
        })
      }
      reader.readAsText(file)
    } else {
      // 尝试作为文本读取其他未知类型
      const reader = new FileReader()
      reader.onload = (e) => {
        attachments.value.push({
          type: 'text',
          name: file.name,
          preview: null,
          content: e.target.result
        })
      }
      reader.readAsText(file)
    }
  }
}

const removeAttachment = (index) => {
  attachments.value.splice(index, 1)
}

function parseThinking(text) {
  const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/i)
  if (thinkMatch) {
    const thinking = thinkMatch[1].trim()
    const content = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
    return { thinking, content }
  }
  
  // 处理未闭合的 thinking 标签 (流式传输中)
  const openThinkMatch = text.match(/<think>([\s\S]*)/i)
  if (openThinkMatch) {
    return { thinking: openThinkMatch[1].trim(), content: '' }
  }

  return { thinking: null, content: text }
}

async function sendMessage() {
  const text = inputText.value.trim()
  if ((!text && attachments.value.length === 0) || isLoading.value) return

  const currentChat = chatHistory.value[currentChatIndex.value]
  
  // 构建当前消息内容（用于显示）
  const displayContent = text
  const messageAttachments = [...attachments.value]
  
  currentChat.messages.push({ 
    role: 'user', 
    content: displayContent,
    attachments: messageAttachments 
  })
  
  if (currentChat.messages.length === 1) {
    currentChat.title = text.slice(0, 20) + (text.length > 20 ? '...' : '') || '文件分析'
  }

  // 清空输入
  inputText.value = ''
  attachments.value = []
  if (inputArea.value) inputArea.value.style.height = 'auto'
  
  isLoading.value = true
  scrollToBottom()

  // 添加一个空的 assistant 消息用于流式更新
  const assistantMsgIndex = currentChat.messages.push({ 
    role: 'assistant', 
    content: '',
    displayContent: '', 
    thinking: '',
    displayThinking: '',
    thinkingExpanded: true, 
    finished: false,
    thinkingFinished: false,
    contentTyping: false,
    thinkingTyping: false,
    startTime: Date.now(),
    thinkingDuration: 0,
    // 联网搜索相关
    hasWebSearch: false,
    searchResults: null,
    sourcesExpanded: false
  }) - 1
  const assistantMsg = currentChat.messages[assistantMsgIndex]

  // 打字机队列状态
  let thinkingQueue = ''
  let contentQueue = ''
  let animationFrameId = null
  let lastUpdateTime = Date.now()

  // 启动打字机循环
  const startTypewriter = () => {
    const processQueue = () => {
      const now = Date.now()
      // 动态调整打字速度
      const baseSpeed = 16 
      const timeDiff = now - lastUpdateTime
      
      if (timeDiff >= baseSpeed) {
        lastUpdateTime = now
        
        // 1. 处理思考内容
        if (thinkingQueue.length > 0) {
          assistantMsg.thinkingTyping = true
          const chunk = Math.ceil(thinkingQueue.length / 10) || 1
          const nextChars = thinkingQueue.slice(0, chunk)
          assistantMsg.displayThinking += nextChars
          thinkingQueue = thinkingQueue.slice(chunk)
          scrollToBottom()
        }

        // 2. 处理正文内容
        if (contentQueue.length > 0) {
          assistantMsg.contentTyping = true
          const chunk = Math.ceil(contentQueue.length / 5) || 1
          const nextChars = contentQueue.slice(0, chunk)
          assistantMsg.displayContent += nextChars
          contentQueue = contentQueue.slice(chunk)
          scrollToBottom()
        } else {
          assistantMsg.contentTyping = false
        }
      }

      if (!assistantMsg.finished || thinkingQueue.length > 0 || contentQueue.length > 0) {
        animationFrameId = requestAnimationFrame(processQueue)
      } else {
        assistantMsg.contentTyping = false
        assistantMsg.thinkingTyping = false
      }
    }
    animationFrameId = requestAnimationFrame(processQueue)
  }

  startTypewriter()

  try {
    // ======= 联网搜索 =======
    let searchContext = null
    console.log('WebSearch status:', webSearchEnabled.value, 'Input:', text)
    
    if (webSearchEnabled.value && text) {
      isSearching.value = true
      assistantMsg.displayThinking = '正在联网搜索...\n'
      
      try {
        console.log('Starting search for:', text)
        const searchResult = await searchAPI.search(text, 5)
        console.log('Search result:', searchResult)
        
        if (searchResult.success && searchResult.results?.length > 0) {
          lastSearchResults.value = searchResult.results
          
          // 格式化搜索结果为上下文
          const formattedResults = searchResult.results.map((r, i) => 
            `${i + 1}. [${r.title}](${r.link})\n   ${r.snippet}`
          ).join('\n\n')
          
          searchContext = `【联网搜索结果】（搜索用时 ${searchResult.searchTime}ms）\n\n${formattedResults}\n\n请参考以上搜索结果回答用户问题。如果搜索结果与问题无关，请基于你的知识回答。在回答中适当引用来源。`
          
          assistantMsg.displayThinking = `已搜索到 ${searchResult.results.length} 条结果...\n`
        } else {
          assistantMsg.displayThinking = '未找到相关搜索结果，将直接回答...\n'
        }
      } catch (searchError) {
        console.warn('Search failed:', searchError)
        assistantMsg.displayThinking = '搜索服务暂不可用，将直接回答...\n'
      }
      
      isSearching.value = false
    }
    
    // 构造 API 请求消息历史
    const apiMessages = currentChat.messages.slice(0, -1).map(m => {
      // 助手消息：直接使用文本内容
      if (m.role === 'assistant') {
        const text = m.content || m.displayContent || ''
        return { role: 'assistant', content: text }
      }
      
      // 用户消息：可能包含多模态内容
      let content = []
      
      // 添加文本部分
      if (m.content) {
        content.push({ type: "text", text: m.content })
      }
      
      // 添加附件部分
      if (m.attachments && m.attachments.length > 0) {
        m.attachments.forEach(att => {
          if (att.type === 'image') {
            content.push({
              type: "image_url",
              image_url: { url: att.content } // Base64
            })
          } else if (att.type === 'text') {
            // 文本文件内容附加到文本中
            content.push({
              type: "text",
              text: `\n\nFile: ${att.name}\nContent:\n${att.content}\n`
            })
          }
        })
      }

      // 如果只有纯文本，简化为字符串（兼容性更好）
      if (content.length === 1 && content[0].type === 'text') {
        return { role: 'user', content: content[0].text }
      }

      return { role: 'user', content }
    }).filter(m => m.content && (typeof m.content === 'string' ? m.content.trim() : m.content.length > 0))

    // 调试：打印发送给 API 的消息历史
    console.log('apiMessages count:', apiMessages.length, 'messages:', apiMessages.map(m => ({ role: m.role, contentLength: typeof m.content === 'string' ? m.content.length : 'array' })))

    // 如果有搜索结果，在消息开头插入 system message
    if (searchContext) {
      apiMessages.unshift({
        role: 'system',
        content: searchContext
      })
      // 标记该消息使用了联网搜索
      assistantMsg.hasWebSearch = true
      assistantMsg.searchResults = lastSearchResults.value
    }

    const response = await chatAPI.sendMessage(apiMessages, selectedModel.value, true)
    
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6)
          if (dataStr === '[DONE]') continue
          
          try {
            const data = JSON.parse(dataStr)
            const delta = data.choices?.[0]?.delta?.content || ''
            fullText += delta
            
            // 实时解析目标状态
            const { thinking: targetThinking, content: targetContent } = parseThinking(fullText)
            
            // 更新思考队列
            if (targetThinking) {
              const currentTotalThinking = assistantMsg.displayThinking + thinkingQueue
              if (targetThinking.length > currentTotalThinking.length) {
                const newThinking = targetThinking.slice(currentTotalThinking.length)
                thinkingQueue += newThinking
                assistantMsg.thinking = targetThinking 
              }
            }

            // 更新正文队列
            if (targetContent) {
              const currentTotalContent = assistantMsg.displayContent + contentQueue
              if (targetContent.length > currentTotalContent.length) {
                const newContent = targetContent.slice(currentTotalContent.length)
                contentQueue += newContent
                assistantMsg.content = targetContent
              }
            }
            
            // 状态判断
            if (targetContent && targetContent.length > 0 && !assistantMsg.thinkingFinished) {
              assistantMsg.thinkingFinished = true
              assistantMsg.thinkingDuration = ((Date.now() - assistantMsg.startTime) / 1000).toFixed(1)
              setTimeout(() => {
                if (assistantMsg.thinkingExpanded) assistantMsg.thinkingExpanded = false
              }, 800)
            }

          } catch (e) {
            console.warn('Error parsing SSE data', e)
          }
        }
      }
    }
    
    assistantMsg.finished = true
    if (!assistantMsg.thinkingFinished && assistantMsg.thinking) {
        assistantMsg.thinkingFinished = true
        assistantMsg.thinkingDuration = ((Date.now() - assistantMsg.startTime) / 1000).toFixed(1)
    }

  } catch (error) {
    console.error('Chat error:', error)
    assistantMsg.displayContent += `\n\n**[系统错误]**: ${error.message}`
    assistantMsg.finished = true
  } finally {
    isLoading.value = false
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      const container = messagesContainer.value
      // 只有当用户接近底部时才自动滚动
      const threshold = 100
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold
      
      if (isNearBottom || isLoading.value) {
        container.scrollTop = container.scrollHeight
      }
    }
  })
}

function renderMarkdown(text) {
  if (!text) return ''
  return md.render(text)
}

onMounted(() => {
  // 从 localStorage 加载历史记录
  loadHistoryFromStorage()
  inputArea.value?.focus()
})

// 监听聊天历史变化，自动保存
watch(
  chatHistory,
  () => {
    saveHistoryToStorage()
  },
  { deep: true }
)

// 监听当前对话索引变化
watch(currentChatIndex, () => {
  localStorage.setItem(CHAT_INDEX_KEY, String(currentChatIndex.value))
})
</script>

<style scoped>
.chat-view {
  height: 100vh;
  padding-top: 60px; /* 为固定导航栏留出空间 */
  background: #f8fafc;
  color-scheme: light;
}

.chat-container {
  display: flex;
  height: 100%;
  max-width: 1600px;
  margin: 0 auto;
  background: #fff;
  box-shadow: 0 0 40px rgba(0,0,0,0.05);
}

/* 侧边栏 */
.chat-sidebar {
  width: 280px;
  background: #f1f5f9;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px;
}

.new-chat-btn {
  width: 100%;
  padding: 12px;
  background: #fff;
  color: #334155;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}

.new-chat-btn:hover {
  background: #fff;
  border-color: #cbd5e1;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(0,0,0,0.04);
}

.model-selector {
  padding: 0 20px 20px;
  border-bottom: 1px solid #e2e8f0;
}

.model-selector label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.select-wrapper {
  position: relative;
}

.select-wrapper select {
  width: 100%;
  padding: 10px 32px 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  color: #1e293b;
  cursor: pointer;
  appearance: none;
  color-scheme: light;
}

.select-wrapper select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(8, 131, 80, 0.1);
}

.select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #64748b;
}

.chat-history {
  flex: 1;
  overflow-y: auto;
  padding: 16px 12px;
}

.history-label {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  padding: 0 8px 8px;
  text-transform: uppercase;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 4px;
  color: #475569;
  transition: all 0.15s;
}

.history-item:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.history-item.active {
  background: #fff;
  color: var(--color-primary);
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}

.history-item.active .history-icon {
  color: var(--color-primary);
}

.history-title {
  flex: 1;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-btn {
  opacity: 0;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.history-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: #fee2e2;
  color: #ef4444;
}

.sidebar-footer {
  padding: 12px;
  border-top: 1px solid #e2e8f0;
}

.clear-all-btn {
  width: 100%;
  padding: 10px;
  background: transparent;
  color: #94a3b8;
  border: 1px dashed #e2e8f0;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
}

.clear-all-btn:hover {
  color: #ef4444;
  border-color: #fecaca;
  background: #fef2f2;
}

/* 主聊天区域 */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  background: #fff;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 40px;
  scroll-behavior: smooth;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #94a3b8;
}

.empty-icon {
  color: #e2e8f0;
  margin-bottom: 24px;
}

.empty-state h2 {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
}

.empty-state p {
  font-size: 15px;
  color: #64748b;
}

/* 消息流样式 */
.message-row {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  width: 100%;
}

.message-row.user {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
  margin-top: 2px;
}

.avatar-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-icon.user {
  background: #f1f5f9;
  color: #475569;
}

.avatar-icon.assistant {
  background: linear-gradient(135deg, var(--color-primary) 0%, #0a9d5f 100%);
  color: white;
  box-shadow: 0 4px 6px rgba(8, 131, 80, 0.2);
}

.message-content-wrapper {
  flex: 1;
  min-width: 0;
  max-width: clamp(320px, 75vw, 800px);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.message-row.user .message-content-wrapper {
  align-items: flex-end;
}

.message-bubble {
  position: relative;
}

/* 深度思考模块 */
.thinking-module {
  margin-bottom: 16px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  max-width: clamp(320px, 72vw, 760px);
}

.thinking-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  cursor: pointer;
  user-select: none;
  background: #f8fafc;
  transition: background 0.2s;
}

.thinking-header:hover {
  background: #f1f5f9;
}

.thinking-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
}

.thinking-dots {
  animation: pulse 1.5s infinite;
  color: var(--color-primary);
}

.thinking-duration {
  background: #e2e8f0;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  color: #64748b;
  font-weight: 500;
}

.thinking-body {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #fff;
}

.thinking-body.expanded {
  max-height: 1000px; /* 足够大的值以便展开 */
  border-top: 1px solid #e2e8f0;
}

.thinking-content-inner {
  padding: 16px;
  font-size: 13px;
  line-height: 1.6;
  color: #475569;
  font-family: 'JetBrains Mono', monospace;
  white-space: pre-wrap;
  background: #fff;
}

.cursor {
  display: inline-block;
  width: 6px;
  height: 14px;
  background: var(--color-primary);
  margin-left: 2px;
  vertical-align: middle;
  animation: blink 1s step-end infinite;
}

.block-cursor {
  width: 8px;
  height: 1.2em;
  background: #1e293b;
  opacity: 0.6;
  margin-left: 4px;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.chevron {
  color: #94a3b8;
  transition: transform 0.3s;
}

.chevron.expanded {
  transform: rotate(180deg);
}

/* Markdown 内容 - GitHub 风格优化 */
.markdown-body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
  font-size: 15px;
  line-height: 1.7;
  letter-spacing: 0.01em;
  word-wrap: break-word;
  color: #24292f;
  padding: 12px 16px;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.06);
}

.message-row.user .markdown-body {
  display: inline-block;
  width: fit-content;
  max-width: clamp(320px, 72vw, 760px);
  background: #f1f5f9;
  border-color: #e2e8f0;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04);
  border-top-right-radius: 2px;
  color: #1e293b;
}

/* 标题 */
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
  color: #1e293b;
}

.markdown-body :deep(h1) { font-size: 2em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
.markdown-body :deep(h2) { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
.markdown-body :deep(h3) { font-size: 1.25em; }
.markdown-body :deep(h4) { font-size: 1em; }

/* 段落 */
.markdown-body :deep(p) {
  margin-top: 0;
  margin-bottom: 16px;
}

/* 列表 */
.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin-top: 0;
  margin-bottom: 16px;
  padding-left: 2em;
}

.markdown-body :deep(li) {
  word-wrap: break-all;
}

.markdown-body :deep(li > p) {
  margin-top: 16px;
}

.markdown-body :deep(li + li) {
  margin-top: 0.25em;
}

/* 引用 */
.markdown-body :deep(blockquote) {
  margin: 0 0 16px;
  padding: 0 1em;
  color: #57606a;
  border-left: 0.25em solid #d0d7de;
}

/* 链接 */
.markdown-body :deep(a) {
  color: #0969da;
  text-decoration: none;
}

.markdown-body :deep(a:hover) {
  text-decoration: underline;
}

/* 代码块 - 配合 highlight.js Atom One Dark */
.markdown-body :deep(pre) {
  background-color: #282c34;
  border-radius: 6px;
  font-size: 85%;
  line-height: 1.45;
  overflow: auto;
  padding: 16px;
  margin-bottom: 16px;
}

.markdown-body :deep(pre code) {
  background-color: transparent;
  padding: 0;
  border-radius: 0;
  color: #abb2bf; /* One Dark foreground */
  font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
}

/* 行内代码 */
.markdown-body :deep(code) {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  background-color: rgba(175, 184, 193, 0.2);
  border-radius: 6px;
  font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
}

.message-row.user .markdown-body :deep(code) {
  background-color: rgba(255, 255, 255, 0.5);
}

/* 表格 */
.markdown-body :deep(table) {
  border-spacing: 0;
  border-collapse: collapse;
  margin-bottom: 16px;
  width: 100%;
  overflow: auto;
  display: block;
}

.markdown-body :deep(table tr) {
  background-color: #ffffff;
  border-top: 1px solid #d0d7de;
}

.markdown-body :deep(table tr:nth-child(2n)) {
  background-color: #f6f8fa;
}

.markdown-body :deep(table th),
.markdown-body :deep(table td) {
  padding: 6px 13px;
  border: 1px solid #d0d7de;
}

.markdown-body :deep(table th) {
  font-weight: 600;
  background-color: #f6f8fa;
}

/* 分隔线 */
.markdown-body :deep(hr) {
  height: 0.25em;
  padding: 0;
  margin: 24px 0;
  background-color: #d0d7de;
  border: 0;
}

/* 图片 */
.markdown-body :deep(img) {
  max-width: 100%;
  box-sizing: content-box;
  background-color: #ffffff;
  border-radius: 6px;
}

/* 消息样式优化 */
.attachment-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.msg-image {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  cursor: pointer;
}

.msg-file {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fff;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  border: 1px solid #e2e8f0;
  color: #475569;
}

/* 输入区域增强 */
.input-container {
  padding: 20px 40px;
  background: #fff;
  border-top: 1px solid #f1f5f9;
}

.attachment-preview {
  display: flex;
  gap: 10px;
  padding: 0 4px 12px;
  overflow-x: auto;
}

.attachment-item {
  position: relative;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  background: #f8fafc;
  flex-shrink: 0;
}

.image-preview img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  display: block;
}

.file-preview {
  width: 100px;
  height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px;
}

.file-icon {
  font-size: 20px;
}

.file-name {
  font-size: 10px;
  color: #64748b;
  width: 100%;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 2px;
}

.remove-btn {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
  background: rgba(0,0,0,0.5);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.input-wrapper {
  max-width: 900px;
  margin: 0 auto;
  position: relative;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #fff;
  padding: 12px 16px 12px 12px; /* 左侧留出按钮空间 */
  transition: all 0.2s;
  box-shadow: 0 2px 6px rgba(0,0,0,0.02);
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.upload-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
  margin-bottom: 2px;
}

.upload-btn:hover {
  background: #f1f5f9;
  color: #334155;
}

.hidden-input {
  display: none;
}

.input-wrapper textarea {
  width: 100%;
  border: none;
  resize: none;
  font-size: 15px;
  line-height: 1.5;
  max-height: 200px;
  padding: 6px 0;
  color: #1e293b;
  background: transparent;
  color-scheme: light;
  outline: none;
  padding-right: 40px; /* 留出发送按钮空间 */
}

.input-wrapper textarea::placeholder {
  color: #94a3b8;
}

.send-btn {
  position: absolute;
  right: 8px;
  bottom: 8px;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--color-primary);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.send-btn:hover:not(:disabled) {
  background: #066a3e;
  transform: scale(1.05);
}

.send-btn:disabled {
  background: #e2e8f0;
  cursor: not-allowed;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.input-hint {
  max-width: 900px;
  margin: 12px auto 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 12px;
  color: #94a3b8;
}

.model-badge {
  background: #f1f5f9;
  padding: 2px 8px;
  border-radius: 4px;
  color: #64748b;
  font-weight: 500;
}

/* 加载动画 */
.initial-loading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.initial-loading .typing-indicator {
  padding: 0;
  background: transparent;
  box-shadow: none;
}

.loading-text {
  font-size: 14px;
  color: #64748b;
  animation: pulse 2s infinite;
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 16px 20px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.typing-indicator span:not(.typing-text) {
  width: 8px;
  height: 8px;
  background: var(--color-primary);
  border-radius: 50%;
  animation: typing 1.4s infinite both;
}

.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

.typing-text {
  margin-left: 8px;
  font-size: 13px;
  color: #64748b;
}

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-6px); opacity: 1; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 联网搜索开关 */
.input-actions {
  max-width: 900px;
  margin: 12px auto 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.web-search-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  font-size: 12px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.web-search-toggle:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.web-search-toggle.active {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.web-search-toggle .status-dot {
  width: 6px;
  height: 6px;
  background: var(--color-primary);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

/* 搜索来源展示 */
.search-sources {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}

.sources-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
  cursor: pointer;
  padding: 4px 0;
  transition: color 0.15s;
}

.sources-header:hover {
  color: var(--color-primary);
}

.sources-header .expand-icon {
  margin-left: auto;
  transition: transform 0.2s;
}

.sources-header .expand-icon.expanded {
  transform: rotate(180deg);
}

.sources-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}

.source-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: #f8fafc;
  border-radius: 8px;
  text-decoration: none;
  color: #334155;
  font-size: 13px;
  transition: all 0.15s;
}

.source-item:hover {
  background: #f1f5f9;
  color: var(--color-primary);
}

.source-num {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e2e8f0;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  flex-shrink: 0;
}

.source-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 响应式 */
@media (max-width: 768px) {
  .chat-sidebar {
    display: none;
  }
  .messages-container {
    padding: 20px;
  }
  .input-container {
    padding: 16px;
  }
  .input-actions {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
