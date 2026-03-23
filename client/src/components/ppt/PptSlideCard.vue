<template>
  <div class="ppt-slide-card">
    <div class="slide-header">
      <span class="slide-number">第 {{ index + 1 }} 页</span>
      <button class="remove-btn" @click="$emit('remove')" title="删除">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    <textarea
      v-model="localScript"
      class="slide-textarea"
      placeholder="输入这一页的 PPT 脚本内容..."
      @input="handleInput"
      rows="3"
    ></textarea>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  index: { type: Number, required: true },
  script: { type: String, default: '' }
})

const emit = defineEmits(['update:script', 'remove'])

const localScript = ref(props.script)

watch(() => props.script, (newVal) => {
  localScript.value = newVal
})

const handleInput = () => {
  emit('update:script', localScript.value)
}
</script>

<style scoped>
.ppt-slide-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
  transition: all 0.2s;
}

.ppt-slide-card:hover {
  border-color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(8, 131, 80, 0.1);
}

.slide-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.slide-number {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
}

.remove-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.15s;
}

.remove-btn:hover {
  background: #fee2e2;
  color: #ef4444;
}

.slide-textarea {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 60px;
  transition: border-color 0.2s;
}

.slide-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

</style>
