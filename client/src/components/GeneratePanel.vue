<template>
  <div class="generate-panel">
    <div class="panel-header">
      <div class="header-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      </div>
      <div class="header-text">
        <h2 class="title">创作灵感</h2>
        <p class="subtitle">用文字描述你想要的画面，AI 将为你实现</p>
      </div>
    </div>
    
    <div class="form">
      <!-- 描述输入区 -->
      <div class="form-group prompt-group">
        <div class="textarea-wrapper" :class="{ focused: isTextareaFocused }">
          <textarea 
            ref="textareaRef"
            v-model="prompt" 
            class="textarea"
            placeholder="描述你想要生成的画面，越详细效果越好..."
            @input="autoResize"
            @focus="isTextareaFocused = true"
            @blur="handleTextareaBlur"
          ></textarea>
          
          <!-- 输入框工具栏 -->
          <div class="textarea-tools" :class="{ visible: prompt }">
            <button class="tool-btn clear" v-if="prompt" @click.stop="handleClearPrompt" title="清空">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 参考图上传 -->
      <div class="form-group">
        <div class="label-row">
          <label class="label">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            参考图
          </label>
          <span class="label-hint">可选，最多20张</span>
        </div>
        <div 
          class="upload-area" 
          :class="{ 'has-images': referenceImages.length > 0, 'drag-over': isDragOver }"
          @click="triggerUpload" 
          @dragover.prevent="isDragOver = true"
          @dragleave.prevent="isDragOver = false"
          @drop.prevent="handleDropWithState"
        >
          <input 
            ref="fileInputRef"
            type="file" 
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            class="file-input"
            @change="handleFileSelect"
          />
          <div v-if="referenceImages.length === 0" class="upload-placeholder">
            <div class="upload-icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            <p class="upload-text">点击或拖拽上传参考图</p>
            <p class="upload-hint">支持 JPG、PNG、WEBP，单张不超过 10MB</p>
          </div>
          <div v-else class="preview-grid">
            <div v-for="(img, index) in referenceImages" :key="index" class="preview-item">
              <img :src="img.preview" :alt="'参考图 ' + (index + 1)" />
              <div class="preview-overlay">
                <button class="remove-btn" @click.stop="removeImage(index)" title="移除">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
            <div v-if="referenceImages.length < 20" class="add-more" @click.stop="triggerUpload">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- 参数设置 -->
      <div class="params-section">
        <div class="params-header">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          <span>生成参数</span>
        </div>
        <div class="params-grid">
          <div class="param-item">
            <label class="param-label">画面比例</label>
            <div class="ratios-grid">
              <button 
                v-for="ratio in ratios" 
                :key="ratio.value"
                class="ratio-btn"
                :class="{ active: aspectRatio === ratio.value }"
                @click="aspectRatio = ratio.value"
                :title="ratio.label"
              >
                <div class="ratio-shape" :style="{ aspectRatio: ratio.cssRatio }"></div>
                <span class="ratio-text">{{ ratio.value === 'auto' ? '自动' : ratio.value }}</span>
              </button>
            </div>
          </div>

          <div class="param-item">
            <label class="param-label">输出分辨率</label>
            <div class="select-wrapper">
              <select v-model="imageSize" class="select">
                <option value="1K">1K 标准</option>
                <option value="2K">2K 高清</option>
                <option value="4K">4K 超清</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div class="balance-display" @click="handleRefreshBalance" title="点击刷新余额">
        <span class="balance-icon">💎</span>
        <span class="balance-text">剩余积分: {{ store.balance?.toLocaleString() || 0 }}</span>
        <span class="cost-hint">（每次消耗 1,800）</span>
        <svg v-if="isRefreshingBalance" class="refresh-icon spinning" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 12c0-5.5 4.5-10 10-10 2.8 0 5.3 1.1 7 3M22 12c0 5.5-4.5 10-10 10-2.8 0-5.3-1.1-7-3"/></svg>
      </div>

      <button 
        class="generate-btn" 
        @click="handleGenerate"
        :disabled="!prompt.trim()"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
        <span>开始生成</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useImageStore } from '../stores/image'

const emit = defineEmits(['generate'])
const store = useImageStore()

const prompt = ref('')
const aspectRatio = ref('auto')
const imageSize = ref('4K')
const textareaRef = ref(null)
const fileInputRef = ref(null)
const referenceImages = ref([])
const isTextareaFocused = ref(false)
const isDragOver = ref(false)
const isSelfUpdate = ref(false)
const isRefreshingBalance = ref(false)

const handleClearPrompt = () => {
  prompt.value = ''
  setTimeout(() => recalculateHeight(), 0)
}

const handleRefreshBalance = async () => {
    if (isRefreshingBalance.value) return
    isRefreshingBalance.value = true
    
    // 手动刷新时，我们也想看到最新值，哪怕它没变？
    // 为了强制同步，我们可以临时重置 lastServerBalance，或者相信智能策略
    // 如果用户狂点刷新，说明他对当前值不满意。
    // 这里我们不做特殊处理，fetchBalance 会处理。
    
    await store.fetchBalance()
    setTimeout(() => {
      isRefreshingBalance.value = false
    }, 500)
  }

const ratios = [
  { value: 'auto', label: '自动', cssRatio: '1/1' }, // 自动用正方形代替示意
  { value: '1:1', label: '1:1 正方形', cssRatio: '1/1' },
  { value: '16:9', label: '16:9 横版', cssRatio: '16/9' },
  { value: '9:16', label: '9:16 竖版', cssRatio: '9/16' },
  { value: '4:3', label: '4:3', cssRatio: '4/3' },
  { value: '3:4', label: '3:4', cssRatio: '3/4' },
  { value: '3:2', label: '3:2', cssRatio: '3/2' },
  { value: '2:3', label: '2:3', cssRatio: '2/3' },
  { value: '21:9', label: '21:9 超宽', cssRatio: '21/9' },
]

const MAX_IMAGES = 20

// 组件挂载时恢复表单状态
onMounted(() => {
  store.loadFormState()
  restoreFormFromStore()
  // 确保初始高度正确
  setTimeout(() => {
    recalculateHeight()
  }, 50)
})

// 从store恢复表单数据
const restoreFormFromStore = () => {
  const newState = store.formState
  let promptChanged = false
  
  if (prompt.value !== (newState.prompt || '')) {
    prompt.value = newState.prompt || ''
    promptChanged = true
  }
  
  if (aspectRatio.value !== (newState.aspectRatio || 'auto')) {
    aspectRatio.value = newState.aspectRatio || 'auto'
  }
  
  if (imageSize.value !== (newState.imageSize || '4K')) {
    imageSize.value = newState.imageSize || '4K'
  }
  
  // 参考图比较复杂，这里简化处理，直接赋值（如果有）
  // 注意：store.formState.referenceImages 可能为空，因为saveFormState不保存它
  // 但updateFormState会更新它
  if (newState.referenceImages && newState.referenceImages.length > 0) {
    referenceImages.value = newState.referenceImages || []
  }
  
  // 仅当 prompt 发生变化时才触发高度调整
  if (promptChanged) {
    setTimeout(() => {
      recalculateHeight()
    }, 0)
  }
}

// 监听store.formState变化（重新生成时触发）
watch(() => store.formState, () => {
  if (isSelfUpdate.value) {
    isSelfUpdate.value = false
    return
  }
  // 强制确保在输入状态下不恢复
  if (isTextareaFocused.value) {
    return
  }
  restoreFormFromStore()
}, { deep: true })

// 监听表单变化并保存
watch([prompt, aspectRatio, imageSize], () => {
  isSelfUpdate.value = true
  store.saveFormState({
    prompt: prompt.value,
    aspectRatio: aspectRatio.value,
    imageSize: imageSize.value
  })
}, { deep: true })

// 监听参考图变化
watch(referenceImages, () => {
  store.updateFormState({
    referenceImages: referenceImages.value
  })
}, { deep: true })

const triggerUpload = () => {
  fileInputRef.value?.click()
}

const handleFileSelect = (e) => {
  const files = Array.from(e.target.files || [])
  processFiles(files)
  e.target.value = ''
}

const handleDrop = (e) => {
  const files = Array.from(e.dataTransfer.files || [])
  processFiles(files)
}

const handleDropWithState = (e) => {
  isDragOver.value = false
  handleDrop(e)
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const processFiles = async (files) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const validFiles = files.filter(f => {
    if (!validTypes.includes(f.type)) return false
    if (f.size > MAX_FILE_SIZE) {
      alert(`文件 ${f.name} 超过10MB限制，已跳过`)
      return false
    }
    return true
  })
  
  const remaining = MAX_IMAGES - referenceImages.value.length
  const filesToProcess = validFiles.slice(0, remaining)
  
  for (const file of filesToProcess) {
    const base64 = await fileToBase64(file)
    referenceImages.value.push({
      file,
      preview: URL.createObjectURL(file),
      base64
    })
  }
}

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const removeImage = (index) => {
  URL.revokeObjectURL(referenceImages.value[index].preview)
  referenceImages.value.splice(index, 1)
}

// 只扩展不收缩，避免输入时页面跳动
const autoResize = () => {
  const el = textareaRef.value
  if (!el) return
  
  const minHeight = 80
  const currentHeight = el.offsetHeight
  
  // 只有当内容超出当前高度时才扩展
  if (el.scrollHeight > currentHeight) {
    el.style.height = Math.max(minHeight, el.scrollHeight) + 'px'
  }
}

// 失去焦点时重新计算高度（包括收缩）
const recalculateHeight = () => {
  const el = textareaRef.value
  if (!el) return
  
  el.style.height = 'auto'
  el.style.height = Math.max(80, el.scrollHeight) + 'px'
}

const handleTextareaBlur = () => {
  isTextareaFocused.value = false
  recalculateHeight()
}

const handleGenerate = () => {
  if (!prompt.value.trim()) return
  
  // 支持 base64 和 URL 两种格式
  const urls = referenceImages.value.map(img => img.base64 || img.preview)
  
  emit('generate', {
    prompt: prompt.value,
    aspectRatio: aspectRatio.value,
    imageSize: imageSize.value,
    urls: urls.length > 0 ? urls : undefined
  })
}
</script>

<style scoped>
.generate-panel {
  background: #fff;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid #eee;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 28px;
}

.header-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #0a4d63 0%, #088350 50%, #0a9960 100%);
  background-size: 200% 200%;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(8, 131, 80, 0.35), 0 0 0 1px rgba(255,255,255,0.1) inset;
  animation: iconShine 3s ease-in-out infinite;
  position: relative;
  overflow: hidden;
}

.header-icon::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%);
  animation: iconLight 4s ease-in-out infinite;
}

@keyframes iconShine {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes iconLight {
  0% { transform: translateX(-100%) rotate(45deg); }
  100% { transform: translateX(100%) rotate(45deg); }
}

.header-text {
  flex: 1;
  padding-top: 4px;
}

.title {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #1a1a2e 0%, #2d3748 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 6px;
  letter-spacing: -0.3px;
}

.subtitle {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
  position: relative;
}

.subtitle::after {
  content: '';
  position: absolute;
  right: -20px;
  top: -2px;
  width: 6px;
  height: 6px;
  background: #f59e0b;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; transform: scale(0.8); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
  50% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 4px rgba(245, 158, 11, 0); }
}

.form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}

.prompt-group {
  margin-bottom: 4px;
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 8px;
}

.label svg {
  color: #6b7280;
}

.label-hint {
  font-size: 12px;
  color: #9ca3af;
  font-weight: 400;
}

/* Textarea 样式 */
.textarea-wrapper {
  position: relative;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 14px;
  transition: border-color 0.2s, background-color 0.2s, box-shadow 0.2s;
  overflow: hidden;
}

.textarea-wrapper:hover {
  border-color: #d1d5db;
  background: #f3f4f6;
}

.textarea-wrapper.focused {
  border-color: var(--color-primary);
  background: white;
  box-shadow: 0 0 0 4px rgba(8, 131, 80, 0.1);
}

.textarea {
  width: 100%;
  padding: 16px 18px;
  border: none;
  font-size: 15px;
  line-height: 1.6;
  background: transparent;
  color: #1f2937;
  resize: none;
  min-height: 80px;
  overflow-y: hidden;
}

.textarea:focus {
  outline: none;
}

/* 输入框工具栏 */
.textarea-tools {
  position: absolute;
  bottom: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.9);
  padding: 4px 6px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.textarea-tools.visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.tool-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 6px;
  transition: all 0.15s;
}

.tool-btn:hover {
  background: #f3f4f6;
  color: var(--color-primary);
}

.tool-btn.clear:hover {
  color: #ef4444;
  background: #fee2e2;
}

.tool-icon {
  font-size: 14px;
}

.tool-divider {
  width: 1px;
  height: 12px;
  background: #e5e7eb;
  margin: 0 2px;
}

.textarea::placeholder {
  color: #9ca3af;
}

/* 上传区域 */
.upload-area {
  border: 2px dashed #cbd5e1;
  border-radius: 16px;
  padding: 28px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 120px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  position: relative;
  overflow: hidden;
}

.upload-area::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent 0%, rgba(8, 131, 80, 0.02) 100%);
  opacity: 0;
  transition: opacity 0.3s;
}

.upload-area:hover {
  border-color: var(--color-primary);
  background: linear-gradient(135deg, #f0fdf7 0%, #e8f5f0 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(8, 131, 80, 0.1);
}

.upload-area:hover::before {
  opacity: 1;
}

.upload-area.drag-over {
  border-color: var(--color-primary);
  background: rgba(8, 131, 80, 0.08);
  border-style: solid;
  transform: scale(1.01);
}

.upload-area.has-images {
  padding: 18px;
  background: white;
  border-style: solid;
  border-color: #e2e8f0;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
}

.file-input {
  display: none;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 20px 0;
}

.upload-icon-wrapper {
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.upload-area:hover .upload-icon-wrapper {
  background: var(--color-primary-subtle);
  color: var(--color-primary);
}

.upload-text {
  font-size: 14px;
  font-weight: 500;
  color: #4b5563;
}

.upload-hint {
  font-size: 12px;
  color: #9ca3af;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 12px;
}

.preview-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
}

.preview-item:hover {
  transform: scale(1.05) translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  border-color: var(--color-primary);
}

.preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.preview-item:hover img {
  transform: scale(1.1);
}

.preview-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(0,0,0,0.4) 0%, transparent 50%, transparent 100%);
  opacity: 0;
  display: flex;
  justify-content: flex-end;
  padding: 8px;
  transition: opacity 0.3s;
}

.preview-item:hover .preview-overlay {
  opacity: 1;
}

.remove-btn {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid rgba(255,255,255,0.1);
}

.remove-btn:hover {
  background: #ef4444;
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
}

.add-more {
  aspect-ratio: 1;
  border: 2px dashed #e5e7eb;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background-color 0.15s;
  background: #fafafa;
}

.add-more:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-soft);
}

/* 参数区域 */
.params-section {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  position: relative;
  overflow: hidden;
}

.params-section::before {
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

.params-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.params-header svg {
  color: #64748b;
  animation: settingsSpin 8s linear infinite;
}

@keyframes settingsSpin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.params-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.param-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 比例选择器网格 */
.ratios-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: 10px;
}

.ratio-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 8px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.ratio-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent 40%, rgba(8, 131, 80, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.25s;
}

.ratio-btn:hover {
  border-color: #bcd4dc;
  background: #f8fafc;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.ratio-btn:hover::before {
  opacity: 1;
}

.ratio-btn.active {
  border-color: var(--color-primary);
  background: linear-gradient(135deg, #f0fdf7 0%, #e8f5f0 100%);
  color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(8, 131, 80, 0.15), 0 4px 12px rgba(8, 131, 80, 0.15);
  transform: translateY(-1px);
}

.ratio-shape {
  width: 28px;
  height: 20px;
  border: 2px solid #9ca3af;
  border-radius: 4px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.ratio-btn:hover .ratio-shape {
  border-color: #64748b;
  transform: scale(1.05);
}

.ratio-btn.active .ratio-shape {
  border-color: var(--color-primary);
  background: linear-gradient(135deg, var(--color-primary) 0%, #0a9960 100%);
  box-shadow: 0 2px 8px rgba(8, 131, 80, 0.3);
}

.ratio-text {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  transition: all 0.2s;
}

.ratio-btn.active .ratio-text {
  color: var(--color-primary);
  font-weight: 600;
}

.select-wrapper {
  position: relative;
}

.select {
  width: 100%;
  padding: 12px 40px 12px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  transition: border-color 0.15s, box-shadow 0.15s;
  background: white;
  color: #1f2937;
  cursor: pointer;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
}

.select:hover {
  border-color: #d1d5db;
}

.select:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(8, 131, 80, 0.1);
  outline: none;
}

/* 余额显示 */
.balance-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  color: #475569;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%);
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.balance-display::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(8, 131, 80, 0.03), transparent);
  opacity: 0;
  transition: opacity 0.3s;
}

.balance-display:hover {
  background: linear-gradient(135deg, #f0fdf7 0%, #f0f9ff 100%);
  border-color: #a8d5c2;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(8, 131, 80, 0.1);
}

.balance-display:hover::before {
  opacity: 1;
}

.refresh-icon {
  color: var(--color-primary);
  margin-left: 4px;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin { 100% { transform: rotate(360deg); } }

.balance-icon {
  font-size: 18px;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
  animation: gemFloat 3s ease-in-out infinite;
}

@keyframes gemFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

.balance-text {
  font-weight: 600;
  font-family: 'SF Mono', Monaco, monospace;
  color: #1e293b;
  background: linear-gradient(135deg, #088350 0%, #0a9960 100());
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.cost-hint {
  font-size: 11px;
  color: #94a3b8;
  padding: 2px 8px;
  background: #f1f5f9;
  border-radius: 6px;
}

/* 生成按钮 */
.generate-btn {
  padding: 18px 36px;
  background: linear-gradient(135deg, #0a4d63 0%, #088350 50%, #0a9960 100%);
  background-size: 200% 200%;
  color: white;
  border-radius: 16px;
  font-size: 17px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  box-shadow: 0 4px 20px rgba(8, 131, 80, 0.35), 0 0 0 1px rgba(255,255,255,0.1) inset;
  margin-top: 8px;
  position: relative;
  overflow: hidden;
  letter-spacing: 0.5px;
}

/* 按钮光效 */
.generate-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.generate-btn:hover::before {
  left: 100%;
}

/* 激活状态下的呼吸动画 */
.generate-btn:not(:disabled) {
  animation: gradientFlow 3s ease infinite;
}

@keyframes gradientFlow {
  0% { background-position: 0% 50%; box-shadow: 0 4px 20px rgba(8, 131, 80, 0.35); }
  50% { background-position: 100% 50%; box-shadow: 0 6px 28px rgba(8, 131, 80, 0.5), 0 0 40px rgba(8, 131, 80, 0.15); }
  100% { background-position: 0% 50%; box-shadow: 0 4px 20px rgba(8, 131, 80, 0.35); }
}

.generate-btn:hover:not(:disabled) {
  transform: translateY(-3px) scale(1.01);
  filter: brightness(1.08);
  box-shadow: 0 8px 30px rgba(8, 131, 80, 0.45), 0 0 0 1px rgba(255,255,255,0.15) inset;
}

.generate-btn:active:not(:disabled) {
  transform: translateY(-1px) scale(0.99);
  box-shadow: 0 2px 12px rgba(8, 131, 80, 0.3);
}

.generate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
  animation: none;
}

.generate-btn svg {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
}

.generate-btn:hover:not(:disabled) svg {
  transform: rotate(-15deg) scale(1.15);
}

/* 生成中状态 */
.generate-btn.generating {
  background: linear-gradient(135deg, #0a4d63 0%, #0a9960 100%);
  pointer-events: none;
}

.generate-btn.generating svg {
  animation: generatePulse 1.5s ease-in-out infinite;
}

@keyframes generatePulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(0.9); opacity: 0.7; }
}
</style>

