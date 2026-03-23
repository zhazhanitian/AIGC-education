<template>
  <div class="ppt-view">
    <main class="main-content">
      <div class="split-layout">
        <!-- 左侧：生成面板 -->
        <div class="left-panel">
          <PptGeneratePanel
            :style-prompt="store.stylePrompt"
            :style-reference-images="store.styleReferenceImages"
            :slides="store.slides"
            :is-generating="isGenerating"
            @update:style-prompt="store.updateStylePrompt"
            @update:style-reference-images="store.updateStyleReferenceImages"
            @update:slides="(newSlides) => { store.slides = newSlides; store.saveFormState() }"
            @generate="handleGenerate"
          />
        </div>

        <!-- 右侧：任务 + 结果 -->
        <div class="right-panel">
          <!-- PPT 任务列表 -->
          <section v-if="store.pptTasks.length > 0" class="tasks-section">
            <div class="section-header">
              <h3 class="section-title">PPT 任务</h3>
              <span class="task-count">{{ store.pptTasks.length }}</span>
            </div>
            <div class="tasks-grid">
              <TransitionGroup name="list">
                <PptTaskCard
                  v-for="task in visibleTasks"
                  :key="task.id"
                  :task="task"
                  :is-active="task.id === store.activePptTaskId"
                  @cancel="handleCancel"
                  @delete="handleDelete"
                  @retry="handleRetry"
                  @click="store.activePptTaskId = task.id"
                />
              </TransitionGroup>
            </div>
            <button v-if="showExpandButton" class="expand-btn" @click="toggleTasksExpand">
              {{ tasksExpanded ? '收起' : `展开全部 (${store.pptTasks.length})` }}
            </button>
          </section>

          <!-- 当前任务结果 -->
          <section v-if="store.activeTask" class="results-section">
            <div class="section-header">
              <h3 class="section-title">生成结果</h3>
              <span class="result-count">{{ succeededCount }} / {{ store.activeTask.slides?.length || 0 }}</span>
            </div>
            <PptResultGrid
              :slides="store.activeTask.slides || []"
              :aspect-ratio="store.activeTask.aspectRatio || '16:9'"
              @view="handleView"
              @regenerate="handleRegenerateSlide"
            />
          </section>

          <!-- 空状态 -->
          <div v-if="store.pptTasks.length === 0" class="empty-state">
            <div class="empty-icon">📊</div>
            <p class="empty-text">开始创建你的第一个 AI PPT 吧</p>
          </div>
        </div>
      </div>
    </main>

    <!-- PPT 图片浏览器 -->
    <PptImageViewer
      :visible="modalVisible"
      :slides="store.activeTask?.slides || []"
      :initial-slide-index="selectedSlideIndex"
      @close="modalVisible = false"
    />

    <!-- Toast 提示 -->
    <Transition name="toast">
      <div v-if="toastVisible" class="toast" :class="toastType">
        {{ toastMessage }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePptStore } from '../stores/ppt'
import { useAuthStore } from '../stores/auth'
import PptGeneratePanel from '../components/ppt/PptGeneratePanel.vue'
import PptTaskCard from '../components/ppt/PptTaskCard.vue'
import PptResultGrid from '../components/ppt/PptResultGrid.vue'
import PptImageViewer from '../components/ppt/PptImageViewer.vue'

const store = usePptStore()
const auth = useAuthStore()
const router = useRouter()

const isGenerating = ref(false)
const modalVisible = ref(false)
const selectedSlideIndex = ref(0)
const tasksExpanded = ref(false)

// Toast 提示
const toastVisible = ref(false)
const toastMessage = ref('')
const toastType = ref('error') // 'error' | 'success' | 'info'
let toastTimer = null

const showToast = (message, type = 'error', duration = 3000) => {
  toastMessage.value = message
  toastType.value = type
  toastVisible.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastVisible.value = false }, duration)
}

const MAX_COLLAPSED_TASKS = 6

const visibleTasks = computed(() => {
  if (tasksExpanded.value || store.pptTasks.length <= MAX_COLLAPSED_TASKS) {
    return store.pptTasks
  }
  return store.pptTasks.slice(0, MAX_COLLAPSED_TASKS)
})

const showExpandButton = computed(() => store.pptTasks.length > MAX_COLLAPSED_TASKS)

const succeededCount = computed(() => {
  if (!store.activeTask) return 0
  return store.activeTask.slides?.filter(s => s.status === 'succeeded').length || 0
})

const toggleTasksExpand = () => {
  tasksExpanded.value = !tasksExpanded.value
}

const handleGenerate = async () => {
  if (!auth.isLoggedIn) {
    router.push('/login')
    return
  }

  try {
    isGenerating.value = true
    await store.createPptTask()
    showToast('PPT 任务已创建', 'success')
  } catch (error) {
    showToast(error.message || '创建 PPT 任务失败', 'error')
  } finally {
    isGenerating.value = false
  }
}

const handleCancel = async (taskId) => {
  try {
    await store.cancelPptTask(taskId)
    showToast('任务已取消', 'info')
  } catch (error) {
    showToast('取消失败', 'error')
  }
}

const handleDelete = async (taskId) => {
  if (confirm('确定要删除这个 PPT 任务吗？')) {
    try {
      await store.deletePptTask(taskId)
      showToast('任务已删除', 'info')
    } catch (error) {
      showToast('删除失败', 'error')
    }
  }
}

const handleRetry = async (taskId) => {
  try {
    await store.retryPptTask(taskId)
    showToast('任务已重新开始', 'success')
  } catch (error) {
    showToast(error.message || '重试失败', 'error')
  }
}

const handleRegenerateSlide = async (slideIndex) => {
  if (!store.activePptTaskId) return
  try {
    await store.regenerateSlide(store.activePptTaskId, slideIndex)
    showToast(`第 ${slideIndex + 1} 页正在重新生成`, 'success')
  } catch (error) {
    showToast(error.message || '重新生成失败', 'error')
  }
}

const handleView = (slide) => {
  selectedSlideIndex.value = slide.index
  modalVisible.value = true
}

onMounted(() => {
  store.init()
})

onUnmounted(() => {
  store.cleanup()
})
</script>

<style scoped>
.ppt-view {
  height: 100vh;
  padding-top: 60px; /* 为固定导航栏留出空间 */
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-content {
  flex: 1;
  overflow: hidden;
  max-width: 1600px;
  width: 100%;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

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
  scrollbar-color: rgba(8, 131, 80, 0.2) transparent;
}

.left-panel::-webkit-scrollbar {
  width: 6px;
}

.left-panel::-webkit-scrollbar-track {
  background: transparent;
}

.left-panel::-webkit-scrollbar-thumb {
  background: rgba(8, 131, 80, 0.2);
  border-radius: 3px;
}

.left-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(8, 131, 80, 0.4);
}

.right-panel {
  height: 100%;
  overflow-y: auto;
  padding: var(--spacing-lg) 0 var(--spacing-lg) var(--spacing-sm);
  scrollbar-width: thin;
  scrollbar-color: rgba(8, 131, 80, 0.2) transparent;
}

.right-panel::-webkit-scrollbar {
  width: 6px;
}

.right-panel::-webkit-scrollbar-track {
  background: transparent;
}

.right-panel::-webkit-scrollbar-thumb {
  background: rgba(8, 131, 80, 0.2);
  border-radius: 3px;
}

.right-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(8, 131, 80, 0.4);
}

.tasks-section {
  margin-bottom: var(--spacing-xl);
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  border: 1px solid #e2e8f0;
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
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  padding-left: 12px;
  position: relative;
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

.task-count,
.result-count {
  font-size: 13px;
  color: white;
  background: linear-gradient(135deg, var(--color-primary) 0%, #0a9960 100%);
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(8, 131, 80, 0.3);
}

.tasks-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.expand-btn {
  width: 100%;
  margin-top: 14px;
  padding: 10px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.expand-btn:hover {
  background: linear-gradient(135deg, #f0fdf7 0%, #e8f5f0 100%);
  border-color: #a8d5c2;
  color: var(--color-primary);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(8, 131, 80, 0.15);
}

.results-section {
  margin-top: var(--spacing-xl);
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  border: 1px solid #e2e8f0;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
}

.results-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #10b981, #34d399, #10b981);
  background-size: 200% 100%;
  animation: shimmerGreen 3s linear infinite;
}

@keyframes shimmerGreen {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.empty-state {
  padding: 80px 20px;
  text-align: center;
  position: relative;
}

.empty-state::before {
  content: '';
  position: absolute;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(8, 131, 80, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  animation: emptyPulse 4s ease-in-out infinite;
}

@keyframes emptyPulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
  50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.8; }
}

.empty-icon {
  font-size: 72px;
  margin-bottom: 20px;
  filter: drop-shadow(0 4px 12px rgba(8, 131, 80, 0.2));
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
  margin: 0;
  font-weight: 500;
  position: relative;
  z-index: 1;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Toast */
.toast {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  padding: 14px 28px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  z-index: 10000;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  pointer-events: none;
  backdrop-filter: blur(8px);
}

.toast.error {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  color: #dc2626;
  border: 1px solid #fca5a5;
  box-shadow: 0 8px 24px rgba(220, 38, 38, 0.2);
}

.toast.success {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  color: #16a34a;
  border: 1px solid #86efac;
  box-shadow: 0 8px 24px rgba(22, 163, 74, 0.2);
}

.toast.info {
  background: linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%);
  color: #0284c7;
  border: 1px solid #7dd3fc;
  box-shadow: 0 8px 24px rgba(2, 132, 199, 0.2);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px) scale(0.95);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px) scale(0.95);
}
</style>
