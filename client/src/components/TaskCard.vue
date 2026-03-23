<template>
  <div class="task-card" :class="task.status">
    <div class="task-content">
      <!-- 状态图标 -->
      <div class="status-icon-wrapper" :class="task.status">
        <svg v-if="task.status === 'running'" class="icon spinning" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
        </svg>
        <svg v-else-if="task.status === 'succeeded'" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <svg v-else-if="task.status === 'failed'" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        <svg v-else class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <circle cx="12" cy="12" r="10"></circle>
        </svg>
      </div>

      <!-- 任务信息 -->
      <div class="info-wrapper">
        <div class="prompt-text" :title="task.prompt">{{ task.prompt || '无描述' }}</div>
        <div class="meta-row">
          <span class="meta-tag ratio">{{ task.aspectRatio }}</span>
          <span class="meta-tag size" v-if="task.imageSize">{{ task.imageSize }}</span>
          <span class="status-text" v-if="task.status !== 'running'">{{ statusText }}</span>
          <span class="progress-text" v-else>{{ task.progress }}%</span>
        </div>
        <!-- 失败原因 -->
        <div class="error-row" v-if="task.status === 'failed' && task.error" :title="task.error">
          {{ shortenError(task.error) }}
        </div>
      </div>

      <!-- 操作按钮 (Hover显示) -->
      <div class="actions-overlay">
        <button v-if="task.status === 'running' || task.status === 'pending'" @click.stop="$emit('cancel', task.id)" title="取消">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
        </button>
        <button v-if="task.status === 'failed' && !isFatalError" @click.stop="$emit('retry', task.id)" title="重试">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
        </button>
        <button @click.stop="$emit('remove', task.id)" title="移除">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    </div>

    <!-- 底部进度条 -->
    <div class="progress-line" v-if="task.status === 'running'">
      <div class="fill" :style="{ width: task.progress + '%' }"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  task: { type: Object, required: true },
  compact: Boolean
})

defineEmits(['remove', 'retry', 'cancel'])

const statusText = computed(() => {
  const map = { pending: '排队', running: '生成中', succeeded: '完成', failed: '失败', cancelled: '取消' }
  return map[props.task.status] || props.task.status
})

// 缩短错误信息
const shortenError = (error) => {
  if (!error) return ''
  const str = String(error)
  
  // 优先匹配内容违规
  if (str.includes('违规') || str.includes('安全拦截') || str.includes('moderation') || str.includes('content_filter')) {
    return '内容违规：请修改提示词后重试'
  }
  
  // 常见错误简化
  if (str.includes('timeout')) return '请求超时'
  if (str.includes('ECONNRESET')) return '连接中断'
  if (str.includes('network')) return '网络错误'
  if (str.includes('401') || str.includes('Unauthorized')) return '认证失败'
  if (str.includes('403') || str.includes('Forbidden')) return '无权限'
  if (str.includes('429')) return '请求过频'
  if (str.includes('500')) return '服务器错误'
  if (str.includes('502') || str.includes('503')) return '服务不可用'
  
  // 截断显示，但稍微放宽长度限制以容纳中文
  return str.length > 30 ? str.substring(0, 30) + '...' : str
}

// 判断是否为致命错误（不可重试）
const isFatalError = computed(() => {
  if (props.task.status !== 'failed') return false
  const err = props.task.error || ''
  return err.includes('违规') || err.includes('安全拦截') || err.includes('moderation')
})
</script>

<style scoped>
.task-card {
  background: #fafafa;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  transition: background 0.15s, box-shadow 0.15s;
  border: 1px solid #eee;
  min-height: 64px; 
}

.task-card.failed {
  min-height: 72px;
}

.task-card.succeeded {
  animation: flash 1s ease-out;
}

@keyframes flash {
  0% { background: var(--color-bg-container); }
  30% { background: #d1fae5; box-shadow: 0 0 15px rgba(16, 185, 129, 0.3); border-color: #10b981; }
  100% { background: var(--color-bg-container); border-color: transparent; }
}

.task-card.running {
  border-color: rgba(59, 130, 246, 0.3);
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.05);
}

.task-card:hover {
  background: #fff;
  border-color: rgba(0,0,0,0.08);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  transform: translateY(-1px);
}

.task-content {
  display: flex;
  align-items: center;
  padding: 0 12px;
  height: 100%;
  gap: 10px;
}

/* 状态图标 */
.status-icon-wrapper {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: rgba(0,0,0,0.03);
  color: #64748b;
  transition: all 0.3s;
}

.status-icon-wrapper.running { background: rgba(59,130,246,0.1); color: #3b82f6; }
.status-icon-wrapper.succeeded { background: rgba(16,185,129,0.1); color: #10b981; }
.status-icon-wrapper.failed { background: rgba(239,68,68,0.1); color: #ef4444; }

.icon { width: 16px; height: 16px; }
.spinning { animation: spin 2s linear infinite; }

@keyframes spin { 100% { transform: rotate(360deg); } }

/* 信息区域 */
.info-wrapper {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
}

.prompt-text {
  font-size: 13px;
  color: #1e293b;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

.meta-tag {
  background: rgba(0,0,0,0.04);
  padding: 1px 6px;
  border-radius: 4px;
  color: #64748b;
  font-family: monospace; /* 等宽字体显得更技术感 */
}

.status-text { color: #94a3b8; }
.progress-text { color: #3b82f6; font-weight: 600; }

.error-row {
  font-size: 10px;
  color: #ef4444;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  margin-top: 1px;
}

/* 操作遮罩 */
.actions-overlay {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 80px; /* 覆盖右侧 */
  background: linear-gradient(90deg, transparent, #fff 40%);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 12px;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

.task-card:hover .actions-overlay {
  opacity: 1;
  pointer-events: auto;
}

.actions-overlay button {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: #f1f5f9;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.actions-overlay button:hover {
  background: #e2e8f0;
  color: #0f172a;
  transform: scale(1.05);
}

.actions-overlay button svg { width: 14px; height: 14px; }

/* 底部极细进度条 */
.progress-line {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(59,130,246,0.1);
}

.fill {
  height: 100%;
  background: #3b82f6;
  transition: width 0.3s ease;
  box-shadow: 0 0 8px rgba(59,130,246,0.5);
}
</style>

