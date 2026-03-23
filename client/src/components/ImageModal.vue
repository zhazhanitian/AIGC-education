<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="handleClose">
      <div class="modal-content" @click.stop>
        <button class="close-btn" @click="handleClose">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <!-- 左侧：图片展示 -->
        <div class="image-container">
          <img v-if="!loadFailed" :src="imageUrl" :alt="image?.prompt" class="modal-image" @error="handleImageError" />
          <div v-else class="image-placeholder">
            <span class="placeholder-icon">🖼️</span>
            <span class="placeholder-text">图片已过期或加载失败</span>
          </div>
        </div>
        
        <!-- 右侧：信息与操作 -->
        <div class="modal-sidebar">
          <div class="sidebar-header">
            <h3 class="sidebar-title">作品详情</h3>
            <span class="time">{{ formatTime(image?.createdAt) }}</span>
          </div>
          
          <div class="sidebar-scroll">
            <div class="info-group">
              <label class="info-label">提示词</label>
              <div class="prompt-box">
                <p class="prompt-text">{{ image?.prompt }}</p>
              </div>
            </div>
            
            <div class="info-group">
              <label class="info-label">参数信息</label>
              <div class="params-grid">
                <div class="param-item">
                  <span class="param-key">比例</span>
                  <span class="param-value tag">{{ image?.aspectRatio }}</span>
                </div>
                <div class="param-item">
                  <span class="param-key">分辨率</span>
                  <span class="param-value tag">{{ image?.imageSize }}</span>
                </div>
                <div class="param-item">
                  <span class="param-key">模型</span>
                  <span class="param-value">Nano Banana Pro</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="sidebar-footer">
            <div class="action-buttons">
              <a 
                v-if="!loadFailed" 
                :href="imageUrl" 
                download="generated-image.png" 
                class="action-btn primary"
                target="_blank"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                下载图片
              </a>
              <div class="secondary-actions">
                <!-- 预留功能：重新生成（需要父组件支持） -->
                <!-- <button class="action-btn secondary" @click="$emit('regenerate', image)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M23 4v6h-6"></path>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                  </svg>
                </button> -->
                
                <!-- 这里的删除需要父组件传入处理函数，暂时没有直接集成在Modal里，如果需要可以emit事件 -->
                <!-- 目前组件外部逻辑是列表页处理删除，Modal暂只展示。如果需要删除，可添加emit -->
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { defineProps, defineEmits, ref, computed, watch } from 'vue'

const props = defineProps({
  visible: Boolean,
  image: Object
})

const emit = defineEmits(['close'])

const useFallback = ref(false)
const loadFailed = ref(false)

watch(() => props.image, () => {
  useFallback.value = false
  loadFailed.value = false
})

const imageUrl = computed(() => {
  if (useFallback.value && props.image?.remoteUrl) {
    return props.image.remoteUrl
  }
  return props.image?.url || props.image?.remoteUrl
})

const handleImageError = () => {
  if (!useFallback.value && props.image?.remoteUrl && props.image?.remoteUrl !== props.image?.url) {
    useFallback.value = true
  } else {
    loadFailed.value = true
  }
}

const handleClose = () => {
  emit('close')
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-lg);
}

.modal-content {
  background: var(--color-bg-card);
  border-radius: 24px;
  width: 90vw;
  height: 85vh;
  max-width: 1400px;
  overflow: hidden;
  position: relative;
  display: flex;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.close-btn {
  position: absolute;
  top: 20px;
  left: 20px; /* 改到左侧，因为右侧是白色背景，图片在左侧可能是深色 */
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  transition: all 0.2s;
  cursor: pointer;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.8);
  transform: scale(1.05);
}

/* 左侧图片区 */
.image-container {
  flex: 1;
  background: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.modal-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  opacity: 0;
  animation: fadeIn 0.3s forwards;
}

@keyframes fadeIn {
  to { opacity: 1; }
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #475569;
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

/* 右侧侧边栏 */
.modal-sidebar {
  width: 360px;
  background: #fff;
  border-left: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 24px 24px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-title {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.time {
  font-size: 13px;
  color: #94a3b8;
  font-family: monospace;
}

.sidebar-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

/* 滚动条美化 */
.sidebar-scroll::-webkit-scrollbar {
  width: 6px;
}
.sidebar-scroll::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}
.sidebar-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}

.info-group {
  margin-bottom: 32px;
}

.info-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.prompt-box {
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e2e8f0;
}

.prompt-text {
  font-size: 14px;
  line-height: 1.6;
  color: #334155;
  white-space: pre-wrap;
  word-break: break-word;
}

.params-grid {
  display: grid;
  gap: 12px;
}

.param-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #fff;
  border: 1px solid #f1f5f9;
  border-radius: 10px;
}

.param-key {
  font-size: 13px;
  color: #94a3b8;
}

.param-value {
  font-size: 13px;
  color: #1e293b;
  font-weight: 500;
}

.tag {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: monospace;
}

/* 底部操作区 */
.sidebar-footer {
  padding: 20px 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
  background: #fff;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.action-btn {
  flex: 1;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}

.action-btn.primary {
  background: #1e293b;
  color: white;
  border: none;
}

.action-btn.primary:hover {
  background: #334155;
  transform: translateY(-1px);
}

.action-btn.secondary {
  background: #f1f5f9;
  color: #64748b;
  border: none;
  width: 44px;
  flex: 0 0 44px;
}

.action-btn.secondary:hover {
  background: #e2e8f0;
  color: #1e293b;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .modal-content {
    flex-direction: column;
    height: 90vh;
  }
  
  .image-container {
    height: 50%;
  }
  
  .modal-sidebar {
    width: 100%;
    height: 50%;
    border-left: none;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
  }
  
  .close-btn {
    top: 12px;
    left: 12px;
  }
}
</style>