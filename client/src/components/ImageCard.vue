<template>
  <div class="image-card">
    <div class="image-wrapper">
      <img v-if="!loadFailed" :src="imageUrl" :alt="image.prompt" class="image" loading="lazy" decoding="async" @error="handleImageError" />
      <div v-else class="image-placeholder">
        <span class="placeholder-icon">🖼️</span>
        <span class="placeholder-text">图片已过期</span>
      </div>
      <div class="overlay">
        <button class="action-btn view" @click="handleView" title="查看大图">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>
        <button class="action-btn regenerate" @click="handleRegenerate" title="重新生成">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
        </button>
        <button class="action-btn delete" @click="handleDelete" title="删除">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </div>
    </div>
    <div class="card-info">
      <p class="prompt">{{ image.prompt }}</p>
      <div class="meta-row">
        <p class="user">{{ image.username || '匿名' }}</p>
        <p class="time">{{ formatTime(image.createdAt) }}</p>
        <p class="specs">{{ image.aspectRatio }} · {{ image.imageSize }}</p>
        <span v-if="image.apiType" class="api-badge" :class="image.apiType">
          {{ image.apiType === 'primary' ? '主' : '备' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, computed } from 'vue'

const props = defineProps({
  image: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['view', 'delete', 'regenerate'])

const useFallback = ref(false)
const loadFailed = ref(false)

const imageUrl = computed(() => {
  if (useFallback.value && props.image.remoteUrl) {
    return props.image.remoteUrl
  }
  return props.image.url || props.image.remoteUrl
})

const handleImageError = () => {
  if (!useFallback.value && props.image.remoteUrl && props.image.remoteUrl !== props.image.url) {
    useFallback.value = true
  } else {
    loadFailed.value = true
  }
}

const handleView = () => {
  emit('view', { ...props.image, url: imageUrl.value })
}

const handleDelete = () => {
  emit('delete', props.image.id)
}

const handleRegenerate = () => {
  // 使用原始参考图，而不是生成的图片
  emit('regenerate', {
    prompt: props.image.prompt,
    aspectRatio: props.image.aspectRatio,
    imageSize: props.image.imageSize,
    urls: props.image.referenceUrls || []
  })
}

const formatTime = (timestamp) => {
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
.image-card {
  background: #fff;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.2s, transform 0.2s;
  border: 1px solid #eee;
}

.image-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.image-wrapper {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  background: var(--color-bg-container);
}

.image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  color: #999;
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 8px;
  opacity: 0.5;
}

.placeholder-text {
  font-size: 12px;
  color: #aaa;
}

.overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.6));
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  opacity: 0;
  transition: opacity 0.3s;
  backdrop-filter: blur(2px);
}

.image-wrapper:hover .overlay {
  opacity: 1;
}

.action-btn {
  width: 48px;
  height: 48px;
  padding: 0;
  background: rgba(255, 255, 255, 0.95);
  color: #333;
  border-radius: 50%;
  font-size: 14px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
}

.action-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.action-btn.view:hover {
  background: var(--color-primary);
  color: white;
}

.action-btn.regenerate:hover {
  background: #10b981;
  color: white;
}

.action-btn.delete:hover {
  background: var(--color-error);
  color: white;
}

.action-btn svg {
  width: 20px;
  height: 20px;
}

.card-info {
  padding: var(--spacing-lg);
  background: var(--color-bg-card);
}

.prompt {
  font-size: 14px;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
  min-height: 42px;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.user {
  font-size: 12px;
  color: var(--color-text-tertiary);
  font-weight: 600;
}

.time,
.specs {
  font-size: 12px;
  color: var(--color-text-tertiary);
  font-weight: 400;
}

.api-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.api-badge.primary {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.api-badge.fallback {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}
</style>

