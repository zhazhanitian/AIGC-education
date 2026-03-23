<template>
  <div class="home-view">
    <main class="main-content">
      <div class="split-layout">
        <!-- 左侧：生成面板 -->
        <div class="left-panel">
          <GeneratePanel @generate="handleGenerate" />
        </div>
        
        <!-- 右侧：任务 + 最近生成 -->
        <div class="right-panel">
          <!-- 任务队列（紧凑样式） -->
          <section v-if="store.tasks.length > 0" class="tasks-section">
            <div class="section-header">
              <h3 class="section-title">生成任务</h3>
              <span class="task-count">{{ store.tasks.length }}</span>
            </div>
            <div class="tasks-list">
              <TransitionGroup name="list">
                <TaskCard 
                  v-for="task in visibleTasks" 
                  :key="task.id"
                  :task="task"
                  compact
                  @remove="store.removeTask"
                  @retry="store.retryTask"
                  @cancel="store.cancelTask"
                />
              </TransitionGroup>
            </div>
            <button v-if="showExpandButton" class="expand-btn" @click="toggleTasksExpand">
              {{ tasksExpanded ? '收起' : `展开全部 (${store.tasks.length})` }}
            </button>
          </section>
          
          <!-- 最近生成 -->
          <section v-if="store.images.length > 0" class="recent-section">
            <div class="section-header">
              <h3 class="section-title">最近生成</h3>
              <router-link to="/gallery" class="view-all">查看全部</router-link>
            </div>
            <div class="image-grid">
              <TransitionGroup name="list">
                <ImageCard 
                  v-for="image in recentImages" 
                  :key="image.id"
                  :image="image"
                  @view="handleView"
                  @delete="handleDelete"
                  @regenerate="handleRegenerate"
                />
              </TransitionGroup>
            </div>
          </section>
          
          <!-- 空状态 -->
          <div v-if="store.tasks.length === 0 && store.images.length === 0" class="empty-state">
            <div class="empty-icon">✨</div>
            <p class="empty-text">开始创作你的第一张图片吧</p>
          </div>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useImageStore } from '../stores/image'
import { useAuthStore } from '../stores/auth'
import GeneratePanel from '../components/GeneratePanel.vue'
import ImageCard from '../components/ImageCard.vue'
import ImageModal from '../components/ImageModal.vue'
import TaskCard from '../components/TaskCard.vue'

const store = useImageStore()
const auth = useAuthStore()
const router = useRouter()

const modalVisible = ref(false)
const selectedImage = ref(null)
const tasksExpanded = ref(false)

const MAX_COLLAPSED_TASKS = 4

const visibleTasks = computed(() => {
  if (tasksExpanded.value || store.tasks.length <= MAX_COLLAPSED_TASKS) {
    return store.tasks
  }
  return store.tasks.slice(0, MAX_COLLAPSED_TASKS)
})

const showExpandButton = computed(() => store.tasks.length > MAX_COLLAPSED_TASKS)

const toggleTasksExpand = () => {
  tasksExpanded.value = !tasksExpanded.value
}

const recentImages = computed(() => store.images.slice(0, 8))

const handleGenerate = async (params) => {
  if (!auth.isLoggedIn) {
    router.push('/login')
    return
  }
  store.createTask(params)
}

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

const handleRegenerate = (params) => {
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
}

onMounted(() => {
  store.init()
})

onUnmounted(() => {
  store.stopPolling()
})
</script>

<style scoped>
.home-view {
  height: 100vh;
  padding-top: 60px; /* 为固定导航栏留出空间 */
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 防止整体页面出现滚动条 */
}

.main-content {
  flex: 1;
  /* 确保内容区域也能正确截断溢出 */
  overflow: hidden; 
  max-width: 1600px;
  width: 100%;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

/* 左右分栏布局 - 独立滚动 */
.split-layout {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: var(--spacing-xl);
  height: 100%;
}

.left-panel {
  height: 100%;
  overflow-y: auto;
  padding: var(--spacing-lg) var(--spacing-sm) var(--spacing-lg) 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.15) transparent;
  -webkit-overflow-scrolling: touch;
  will-change: scroll-position;
  contain: strict;
}

.left-panel::-webkit-scrollbar {
  width: 6px;
}

.left-panel::-webkit-scrollbar-track {
  background: transparent;
}

.left-panel::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.15);
  border-radius: 3px;
}

.left-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(0,0,0,0.25);
}

.right-panel {
  height: 100%;
  overflow-y: auto;
  padding: var(--spacing-lg) 0 var(--spacing-lg) var(--spacing-sm);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.15) transparent;
}

.right-panel::-webkit-scrollbar {
  width: 6px;
}

.right-panel::-webkit-scrollbar-track {
  background: transparent;
}

.right-panel::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.15);
  border-radius: 3px;
}

.right-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(0,0,0,0.25);
}

/* 任务区 */
.tasks-section {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: var(--radius-xl);
  padding: var(--spacing-md);
  border: 1px solid #e2e8f0;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
}

.tasks-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-primary), #0a9960, var(--color-primary));
  background-size: 200% 100%;
  animation: shimmer 3s linear infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-title);
  margin: 0;
  position: relative;
  padding-left: 12px;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 16px;
  background: linear-gradient(180deg, var(--color-primary) 0%, #0a9960 100%);
  border-radius: 2px;
}

.task-count {
  font-size: 12px;
  color: white;
  background: linear-gradient(135deg, var(--color-primary) 0%, #0a9960 100%);
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(8, 131, 80, 0.25);
}

.tasks-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
}

.expand-btn {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  margin-top: var(--spacing-md);
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.expand-btn:hover {
  background: linear-gradient(135deg, #f0fdf7 0%, #e8f5f0 100%);
  color: var(--color-primary);
  border-color: #a8d5c2;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(8, 131, 80, 0.1);
}

/* 最近生成区 */
.recent-section {
  flex: 1;
}

.recent-section .section-header {
  margin-bottom: var(--spacing-lg);
}

.view-all {
  font-size: 13px;
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: var(--radius-md);
  transition: all 0.25s;
  position: relative;
}

.view-all:hover {
  background: var(--color-primary-soft);
  text-decoration: none;
}

.view-all::after {
  content: '→';
  margin-left: 4px;
  display: inline-block;
  transition: transform 0.25s;
}

.view-all:hover::after {
  transform: translateX(3px);
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
}

/* 空状态 */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  color: var(--color-text-tertiary);
  position: relative;
}

.empty-state::before {
  content: '';
  position: absolute;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(8, 131, 80, 0.08) 0%, transparent 70%);
  border-radius: 50%;
  animation: emptyPulse 4s ease-in-out infinite;
}

@keyframes emptyPulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

.empty-icon {
  font-size: 64px;
  margin-bottom: var(--spacing-lg);
  opacity: 0.8;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
  animation: float 3s ease-in-out infinite;
  position: relative;
  z-index: 1;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.empty-text {
  font-size: 16px;
  color: #64748b;
  font-weight: 500;
  position: relative;
  z-index: 1;
}

/* 响应式：小屏幕改为上下布局 */
@media (max-width: 1024px) {
  .home-view {
    height: auto;
    overflow: auto;
  }
  
  .main-content {
    height: auto;
  }
  
  .split-layout {
    grid-template-columns: 1fr;
    height: auto;
  }
  
  .left-panel,
  .right-panel {
    height: auto;
    overflow: visible;
    padding: var(--spacing-lg) 0;
  }
  
  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}

/* 列表过渡动画 */
.list-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.list-leave-active {
  /* 离开动画如果不想破坏布局，最好只做透明度变化，或者不做位移 */
  transition: opacity 0.2s ease;
  display: none; /* 直接隐藏离开的元素，让 list-move 接管布局调整 */
}

.list-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

/* 专门针对 Grid 布局的移动动画 */
.list-move {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
