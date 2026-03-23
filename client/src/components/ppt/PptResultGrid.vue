<template>
  <div class="ppt-result-grid">
    <div v-if="slides.length === 0" class="empty-state">
      <p>暂无结果</p>
    </div>
    <div v-else class="grid">
      <div
        v-for="slide in sortedSlides"
        :key="slide.index"
        class="result-item"
        :style="{ aspectRatio: cssAspectRatio }"
        @click="handleView(slide)"
      >
        <div class="slide-badge">第 {{ slide.index + 1 }} 页</div>
        <div v-if="slide.status === 'succeeded' && slide.imageUrl" class="image-wrapper">
          <img :src="slide.imageUrl" :alt="`第 ${slide.index + 1} 页`" loading="lazy" />
          <div class="image-overlay">
            <button class="regen-btn" @click.stop="handleRegenerate(slide)" title="重新生成">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
            </button>
          </div>
        </div>
        <div v-else-if="slide.status === 'running'" class="loading-state">
          <div class="spinner"></div>
          <span>生成中...</span>
        </div>
        <div v-else-if="slide.status === 'failed'" class="error-state">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span class="error-title">生成失败</span>
          <span v-if="slide.error" class="error-detail">{{ slide.error }}</span>
          <button class="regen-inline-btn" @click.stop="handleRegenerate(slide)">重新生成</button>
        </div>
        <div v-else class="pending-state">
          <span>等待中...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  slides: { type: Array, default: () => [] },
  aspectRatio: { type: String, default: '16:9' }
})

const emit = defineEmits(['view', 'regenerate'])

const sortedSlides = computed(() => {
  return [...props.slides].sort((a, b) => a.index - b.index)
})

const cssAspectRatio = computed(() => {
  if (props.aspectRatio === '21:9') return '21/9'
  if (props.aspectRatio === '9:16') return '9/16'
  return '16/9'
})

const handleView = (slide) => {
  if (slide.status === 'succeeded' && slide.imageUrl) {
    emit('view', slide)
  }
}

const handleRegenerate = (slide) => {
  emit('regenerate', slide.index)
}
</script>

<style scoped>
.ppt-result-grid {
  width: 100%;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
  background: #f8fafc;
  border-radius: 12px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.result-item {
  position: relative;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.result-item:hover {
  border-color: var(--color-primary);
  box-shadow: 0 8px 24px rgba(8, 131, 80, 0.2);
  transform: translateY(-4px);
}

.slide-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.5) 100%);
  backdrop-filter: blur(8px);
  color: #fff;
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  z-index: 1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.image-wrapper {
  width: 100%;
  height: 100%;
}

.image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.result-item:hover .image-wrapper img {
  transform: scale(1.05);
}

.image-overlay {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 12px;
  opacity: 0;
  background: linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.3) 100%);
  transition: opacity 0.3s;
}

.result-item:hover .image-overlay {
  opacity: 1;
}

.regen-btn {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border: none;
  border-radius: 10px;
  padding: 8px 12px;
  cursor: pointer;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.2s;
}

.regen-btn:hover {
  background: #fff;
  color: var(--color-primary);
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(8, 131, 80, 0.25);
}

.regen-inline-btn {
  margin-top: 10px;
  padding: 8px 18px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.regen-inline-btn:hover {
  background: linear-gradient(135deg, #f0fdf7 0%, #e8f5f0 100%);
  border-color: var(--color-primary);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(8, 131, 80, 0.2);
}

.loading-state,
.error-state,
.pending-state {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #64748b;
  font-size: 14px;
  padding: 20px;
}

.loading-state {
  color: var(--color-primary);
}

.error-state {
  color: #ef4444;
  padding: 16px;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}

.error-title {
  font-weight: 600;
  font-size: 14px;
}

.error-detail {
  font-size: 11px;
  opacity: 0.9;
  text-align: center;
  max-width: 100%;
  word-break: break-word;
  line-height: 1.4;
  margin-top: 6px;
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e8f5f0;
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  box-shadow: 0 2px 8px rgba(8, 131, 80, 0.3);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
