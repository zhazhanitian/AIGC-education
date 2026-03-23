<template>
  <div class="gallery-view">
    
    <main class="main-content">
      <div class="container">
        <div class="gallery-header">
          <h1 class="title">作品集</h1>
          <div class="header-row">
            <p class="count">共 {{ filteredImages.length }} 张作品</p>
            <div v-if="userOptions.length > 1" class="filter">
              <label class="filter-label">用户</label>
              <select v-model="selectedUser" class="filter-select">
                <option value="">全部</option>
                <option v-for="u in userOptions" :key="u" :value="u">{{ u }}</option>
              </select>
            </div>
          </div>
        </div>

        <div v-if="store.loading" class="loading">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>
        
        <div v-else-if="store.error" class="error-state">
          <p class="error-text">{{ store.error }}</p>
          <button @click="store.fetchImages()" class="retry-btn">重试</button>
        </div>
        
        <div v-else-if="(!store.images || store.images.length === 0)" class="empty">
          <p class="empty-icon">🎨</p>
          <p class="empty-text">还没有作品</p>
          <router-link to="/" class="empty-link">去创作</router-link>
        </div>

        <div v-else class="image-grid">
          <ImageCard 
            v-for="image in filteredImages" 
            :key="image.id"
            :image="image"
            @view="handleView"
            @delete="handleDelete"
            @regenerate="handleRegenerate"
          />
        </div>
      </div>
    </main>

    <ImageModal 
      :visible="modalVisible" 
      :image="selectedImage" 
      @close="modalVisible = false" 
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useImageStore } from '../stores/image'
import ImageCard from '../components/ImageCard.vue'
import ImageModal from '../components/ImageModal.vue'

const store = useImageStore()
const router = useRouter()

const modalVisible = ref(false)
const selectedImage = ref(null)
const selectedUser = ref('')

const userOptions = computed(() => {
  const set = new Set()
  ;(store.images || []).forEach(img => set.add((img.username || '匿名')))
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'zh-CN'))
})

const filteredImages = computed(() => {
  if (!selectedUser.value) return store.images
  return (store.images || []).filter(img => (img.username || '匿名') === selectedUser.value)
})

const handleView = (image) => {
  selectedImage.value = image
  modalVisible.value = true
}

const handleDelete = async (id) => {
  if (confirm('确定要删除这张图片吗？')) {
    try {
      await store.deleteImage(id)
    } catch (error) {
      alert('删除失败')
    }
  }
}

const handleRegenerate = async (params) => {
  // 将参数转换为store可以保存的格式（支持URL和base64）
  const referenceImages = (params.urls || []).map((url, index) => ({
    preview: url,
    base64: url,
    file: null,
    isUrl: !url.startsWith('data:')
  }))
  
  // 更新表单状态
  store.updateFormState({
    prompt: params.prompt,
    aspectRatio: params.aspectRatio,
    imageSize: params.imageSize,
    referenceImages: referenceImages
  })
  store.saveFormState({
    prompt: params.prompt,
    aspectRatio: params.aspectRatio,
    imageSize: params.imageSize
  })
  
  // 跳转到首页
  router.push('/')
}

onMounted(() => {
  store.fetchImages()
})
</script>

<style scoped>
.gallery-view {
  min-height: 100vh;
  padding-top: 60px; /* 为固定导航栏留出空间 */
  background: var(--color-bg-page);
}

.main-content {
  padding: var(--spacing-2xl) 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

.gallery-header {
  margin-bottom: var(--spacing-xl);
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-lg);
}

.title {
  font-size: 32px;
  font-weight: 600;
  color: var(--color-text-title);
  margin-bottom: var(--spacing-xs);
}

.count {
  font-size: 14px;
  color: var(--color-text-tertiary);
}

.filter {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.filter-label {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.filter-select {
  height: 34px;
  padding: 0 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: #fff;
  color: var(--color-text-primary);
}

.loading {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--color-text-secondary);
}

.empty {
  text-align: center;
  padding: var(--spacing-2xl) var(--spacing-lg);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: var(--spacing-md);
}

.empty-text {
  font-size: 16px;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-lg);
}

.empty-link {
  display: inline-block;
  padding: var(--spacing-md) var(--spacing-xl);
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-md);
  transition: all 0.2s;
}

.empty-link:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}
</style>

