<template>
  <div class="ppt-generate-panel">
    <div class="panel-header">
      <div class="header-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="8" y1="3" x2="8" y2="21"></line>
          <line x1="16" y1="3" x2="16" y2="21"></line>
        </svg>
      </div>
      <div class="header-text">
        <h2 class="title">AI PPT 批量生图</h2>
        <p class="subtitle">横屏 4K 分辨率</p>
      </div>
    </div>

    <div class="form">
      <!-- 风格提示词 -->
      <div class="form-group">
        <div class="label-row">
          <label class="label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
            风格提示词
          </label>
          <span class="label-hint">一次性设置，所有页面共用</span>
        </div>
        <textarea
          v-model="localStylePrompt"
          class="textarea"
          placeholder="描述 PPT 的整体视觉风格，例如：简约商务风格、科技感蓝色主题、手绘插画风格..."
          rows="4"
          @input="handleStylePromptInput"
        ></textarea>
      </div>

      <!-- 风格参考图 -->
      <div class="form-group">
        <div class="label-row">
          <label class="label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            风格参考图
          </label>
          <span class="label-hint">可选，最多5张</span>
        </div>
        <div
          class="upload-area"
          :class="{ 'has-images': styleReferenceImages.length > 0, 'drag-over': isDragOver }"
          @click="triggerUpload"
          @dragover.prevent="isDragOver = true"
          @dragleave.prevent="isDragOver = false"
          @drop.prevent="handleDrop"
        >
          <input
            ref="fileInputRef"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            class="file-input"
            @change="handleFileSelect"
          />
          <div v-if="styleReferenceImages.length === 0" class="upload-placeholder">
            <div class="upload-icon-wrapper">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            <p class="upload-text">点击或拖拽上传风格参考图</p>
            <p class="upload-hint">支持 JPG、PNG、WEBP，单张不超过 10MB</p>
          </div>
          <div v-else class="preview-grid">
            <div v-for="(img, index) in styleReferenceImages" :key="index" class="preview-item">
              <img :src="img.preview" :alt="'参考图 ' + (index + 1)" />
              <div class="preview-overlay">
                <button class="remove-btn" @click.stop="removeImage(index)" title="移除">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
            <div v-if="styleReferenceImages.length < 5" class="add-more" @click.stop="triggerUpload">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </div>
          </div>
        </div>
        <div v-if="uploadWarning" class="upload-warning">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <span>{{ uploadWarning }}</span>
        </div>
        <div v-if="styleReferenceImages.length > 0" class="style-hint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <span>已启用风格参考图，系统将自动附加风格引导提示词</span>
        </div>
      </div>

      <div class="form-group">
        <div class="label-row">
          <label class="label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            PPT 脚本
          </label>
          <button class="add-slide-btn" @click="addSlide">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            添加页面
          </button>
        </div>

        <div v-if="slides.length === 0" class="empty-slides">
          <p>点击"添加页面"开始创建PPT 脚本</p>
        </div>
        <div v-else class="slides-list">
          <div v-for="(slide, index) in slides" :key="index" class="slide-card">
            <div class="slide-header">
              <span class="slide-number">第 {{ index + 1 }} 页</span>
              <button class="slide-delete" @click="removeSlide(index)" title="删除">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <textarea
              :value="slide.content"
              class="slide-textarea"
              placeholder="输入该页的脚本内容..."
              @input="updateSlide(index, 'content', $event.target.value)"
            ></textarea>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button 
          class="generate-btn" 
          :disabled="!canGenerate"
          @click="handleGenerate"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
          <span>开始生成</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  stylePrompt: { type: String, default: '' },
  styleReferenceImages: { type: Array, default: () => [] },
  slides: { type: Array, default: () => [] },
  isGenerating: { type: Boolean, default: false }
})

const emit = defineEmits([
  'update:stylePrompt',
  'update:styleReferenceImages',
  'update:slides',
  'generate'
])

const localStylePrompt = ref(props.stylePrompt)
const fileInputRef = ref(null)
const isDragOver = ref(false)
const uploadWarning = ref('')

watch(() => props.stylePrompt, (newVal) => {
  localStylePrompt.value = newVal
})

const handleStylePromptInput = () => {
  emit('update:stylePrompt', localStylePrompt.value)
}

const canGenerate = computed(() => {
  return props.slides.length > 0 && props.slides.some(s => s.content.trim())
})

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

const MAX_FILE_SIZE = 10 * 1024 * 1024

const processFiles = async (files) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const validFiles = files.filter(f => {
    if (!validTypes.includes(f.type)) return false
    if (f.size > MAX_FILE_SIZE) {
      uploadWarning.value = `文件 ${f.name} 超过10MB限制，已跳过`
      setTimeout(() => { uploadWarning.value = '' }, 3000)
      return false
    }
    return true
  })

  const remaining = 5 - props.styleReferenceImages.length
  const filesToProcess = validFiles.slice(0, remaining)

  const newImages = []
  for (const file of filesToProcess) {
    const base64 = await fileToBase64(file)
    newImages.push({
      file,
      preview: URL.createObjectURL(file),
      base64
    })
  }

  if (newImages.length > 0) {
    emit('update:styleReferenceImages', [...props.styleReferenceImages, ...newImages])
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
  const images = [...props.styleReferenceImages]
  URL.revokeObjectURL(images[index].preview)
  images.splice(index, 1)
  emit('update:styleReferenceImages', images)
}

const addSlide = () => {
  emit('update:slides', [...props.slides, { content: '' }])
}

const removeSlide = (index) => {
  const newSlides = [...props.slides]
  newSlides.splice(index, 1)
  emit('update:slides', newSlides)
}

const updateSlide = (index, field, value) => {
  const newSlides = [...props.slides]
  newSlides[index] = { ...newSlides[index], [field]: value }
  emit('update:slides', newSlides)
}

const handleGenerate = () => {
  if (canGenerate.value) {
    emit('generate')
  }
}
</script>

<style scoped>
.ppt-generate-panel {
  background: #fff;
  border-radius: 20px;
  padding: 28px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 28px;
}

.header-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0a4d63 0%, var(--color-primary) 50%, #0a9960 100%);
  background-size: 200% 200%;
  border-radius: 16px;
  color: white;
  box-shadow: 0 4px 16px rgba(8, 131, 80, 0.35);
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
  background: linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%);
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
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 6px 0;
}

.subtitle {
  font-size: 13px;
  color: #64748b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.subtitle::before {
  content: '';
  width: 8px;
  height: 8px;
  background: linear-gradient(135deg, var(--color-primary), #34d399);
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; transform: scale(0.9); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
  50% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 4px rgba(16, 185, 129, 0); }
}

.form-group {
  margin-bottom: 24px;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

.label-hint {
  font-size: 12px;
  color: #94a3b8;
}

.textarea {
  width: 100%;
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  padding: 14px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  background: #f8fafc;
}

.textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  background: white;
  box-shadow: 0 0 0 4px rgba(8, 131, 80, 0.1);
}

.upload-area {
  border: 2px dashed #cbd5e1;
  border-radius: 14px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.upload-area:hover {
  border-color: var(--color-primary);
  background: linear-gradient(135deg, #f0fdf7 0%, #e8f5f0 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(8, 131, 80, 0.1);
}

.upload-area.drag-over {
  border-color: var(--color-primary);
  background: #f0fdf7;
  transform: scale(1.01);
}

.upload-placeholder {
  text-align: center;
}

.upload-icon-wrapper {
  margin: 0 auto 14px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e8f5f0 0%, #d1e7dd 100%);
  border-radius: 14px;
  color: var(--color-primary);
  transition: all 0.3s;
}

.upload-area:hover .upload-icon-wrapper {
  transform: scale(1.1) rotate(-5deg);
  box-shadow: 0 4px 12px rgba(8, 131, 80, 0.2);
}

.upload-text {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin: 0 0 6px 0;
}

.upload-hint {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
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
  border: 2px solid #e2e8f0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(0,0,0,0.5) 0%, transparent 50%, transparent 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.preview-item:hover .preview-overlay {
  opacity: 1;
}

.remove-btn {
  background: rgba(255, 255, 255, 0.95);
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #ef4444;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.remove-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.add-more {
  aspect-ratio: 1;
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s;
  background: #f8fafc;
}

.add-more:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: #f0fdf7;
}

.upload-warning {
  margin-top: 10px;
  padding: 10px 14px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #d97706;
  border: 1px solid #fde68a;
}

.style-hint {
  margin-top: 10px;
  padding: 10px 14px;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--color-primary);
  border: 1px solid #c7d2fe;
}

.add-slide-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, var(--color-primary) 0%, #0a9960 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(8, 131, 80, 0.25);
}

.add-slide-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(8, 131, 80, 0.35);
}

.empty-slides {
  padding: 48px;
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 14px;
  border: 2px dashed #e2e8f0;
  position: relative;
}

.empty-slides::before {
  content: '';
  display: block;
  font-size: 32px;
  margin-bottom: 12px;
  opacity: 0.6;
}

.slides-list {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 4px;
}

.slides-list::-webkit-scrollbar {
  width: 6px;
}

.slides-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.slides-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.slide-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.slide-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.slide-number {
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}

.slide-delete {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s;
}

.slide-delete:hover {
  background: #fee2e2;
  color: #ef4444;
}

.slide-textarea {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  background: white;
}

.slide-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-actions {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #f1f5f9;
}

.generate-btn {
  width: 100%;
  padding: 16px 24px;
  background: linear-gradient(135deg, #0a4d63 0%, var(--color-primary) 50%, #0a9960 100%);
  background-size: 200% 200%;
  color: #fff;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(8, 131, 80, 0.35), 0 0 0 1px rgba(255,255,255,0.1) inset;
  position: relative;
  overflow: hidden;
  letter-spacing: 0.5px;
}

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

.generate-btn:hover:not(:disabled) {
  transform: translateY(-2px) scale(1.01);
  box-shadow: 0 8px 24px rgba(8, 131, 80, 0.45), 0 0 0 1px rgba(255,255,255,0.15) inset;
  animation: gradientFlow 3s ease infinite;
  background-position: 100% 50%;
}

.generate-btn:hover::before {
  left: 100%;
}

.generate-btn:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
  box-shadow: none;
  animation: none;
}

@keyframes gradientFlow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.file-input {
  display: none;
}
</style>
