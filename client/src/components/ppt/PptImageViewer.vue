<template>
  <Teleport to="body">
    <div v-if="visible" class="viewer-overlay" @click="handleClose">
      <div class="viewer-container" @click.stop>
        <!-- 关闭按钮 -->
        <button class="close-btn" @click="handleClose">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <!-- 页码指示 -->
        <div class="page-indicator">{{ currentIndex + 1 }} / {{ succeededSlides.length }}</div>

        <!-- 左箭�?-->
        <button
          v-if="succeededSlides.length > 1"
          class="nav-btn nav-prev"
          :class="{ disabled: currentIndex <= 0 }"
          @click="goPrev"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>

        <!-- 右箭�?-->
        <button
          v-if="succeededSlides.length > 1"
          class="nav-btn nav-next"
          :class="{ disabled: currentIndex >= succeededSlides.length - 1 }"
          @click="goNext"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>

        <!-- 主图区域 -->
        <div class="main-image-area">
          <img
            v-if="currentSlide && currentSlide.imageUrl"
            :src="currentSlide.imageUrl"
            :alt="`�?${currentSlide.index + 1} 页`"
            class="main-image"
            :key="currentSlide.index"
          />
        </div>

        <!-- 底部信息 + 缩略�?-->
        <div class="viewer-bottom">
          <!-- 脚本文字 -->
          <div v-if="currentSlide?.script" class="slide-script">
            {{ currentSlide.script }}
          </div>

          <!-- 缩略图矩�?-->
          <div v-if="succeededSlides.length > 1" class="thumbnails-bar">
            <div
              v-for="(slide, idx) in displayThumbnails"
              :key="slide.index"
              class="thumb-item"
              :class="{ active: idx + thumbOffset === currentIndex }"
              @click="goTo(idx + thumbOffset)"
            >
              <img :src="slide.imageUrl" :alt="`�?${slide.index + 1} 页`" />
              <span class="thumb-page">{{ slide.index + 1 }}</span>
            </div>
          </div>

          <!-- 下载按钮 -->
          <div class="viewer-actions">
            <a
              v-if="currentSlide?.imageUrl"
              :href="currentSlide.imageUrl"
              download
              target="_blank"
              class="download-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              下载
            </a>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  slides: { type: Array, default: () => [] },
  initialSlideIndex: { type: Number, default: 0 }
})

const emit = defineEmits(['close'])

const MAX_THUMBS = 10
const currentIndex = ref(0)

// 只展示成功的 slides
const succeededSlides = computed(() => {
  return [...props.slides]
    .filter(s => s.status === 'succeeded' && s.imageUrl)
    .sort((a, b) => a.index - b.index)
})

const currentSlide = computed(() => {
  return succeededSlides.value[currentIndex.value] || null
})

// 缩略图显示范围（最�?0个，居中当前�?
const thumbOffset = computed(() => {
  const total = succeededSlides.value.length
  if (total <= MAX_THUMBS) return 0
  const half = Math.floor(MAX_THUMBS / 2)
  let start = currentIndex.value - half
  start = Math.max(0, Math.min(start, total - MAX_THUMBS))
  return start
})

const displayThumbnails = computed(() => {
  return succeededSlides.value.slice(thumbOffset.value, thumbOffset.value + MAX_THUMBS)
})

// 打开时定位到指定 slide
watch(() => props.visible, (val) => {
  if (val) {
    const idx = succeededSlides.value.findIndex(s => s.index === props.initialSlideIndex)
    currentIndex.value = idx >= 0 ? idx : 0
  }
})

const goPrev = () => {
  if (currentIndex.value > 0) currentIndex.value--
}

const goNext = () => {
  if (currentIndex.value < succeededSlides.value.length - 1) currentIndex.value++
}

const goTo = (idx) => {
  if (idx >= 0 && idx < succeededSlides.value.length) {
    currentIndex.value = idx
  }
}

const handleClose = () => {
  emit('close')
}

// 键盘导航
const handleKeydown = (e) => {
  if (!props.visible) return
  if (e.key === 'ArrowLeft') goPrev()
  else if (e.key === 'ArrowRight') goNext()
  else if (e.key === 'Escape') handleClose()
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.viewer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.92);
  backdrop-filter: blur(8px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.viewer-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 关闭按钮 */
.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.8);
  transform: scale(1.1);
}

/* 页码指示 */
.page-indicator {
  position: absolute;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.4) 100%);
  backdrop-filter: blur(8px);
  padding: 6px 20px;
  border-radius: 24px;
  letter-spacing: 2px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* 左右导航箭头 */
.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-60%);
  z-index: 10;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-btn:hover:not(.disabled) {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-60%) scale(1.1);
}

.nav-btn.disabled {
  opacity: 0.2;
  cursor: default;
}

.nav-prev {
  left: 24px;
}

.nav-next {
  right: 24px;
}

/* 主图区域 */
.main-image-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 70px 90px 20px;
  min-height: 0;
}

.main-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.5);
  animation: imgFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes imgFadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

/* 底部区域 */
.viewer-bottom {
  flex-shrink: 0;
  padding: 12px 28px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.3) 100%);
}

/* 脚本文字 */
.slide-script {
  max-width: 700px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 6px 16px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 20px;
}

/* 缩略图矩�?*/
.thumbnails-bar {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.thumb-item {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  border: 2px solid transparent;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  opacity: 0.5;
}

.thumb-item:hover {
  opacity: 0.85;
  border-color: rgba(255, 255, 255, 0.4);
  transform: scale(1.08);
}

.thumb-item.active {
  opacity: 1;
  border-color: #fff;
  box-shadow: 0 0 16px rgba(255, 255, 255, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3);
  transform: scale(1.05);
}

.thumb-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-page {
  position: absolute;
  bottom: 4px;
  right: 4px;
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
  line-height: 1;
  background: rgba(0, 0, 0, 0.5);
  padding: 2px 5px;
  border-radius: 4px;
}

/* 下载按钮 */
.viewer-actions {
  display: flex;
  gap: 8px;
}

.download-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
}

.download-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}
</style>
