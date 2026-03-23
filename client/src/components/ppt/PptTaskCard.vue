<template>
  <div class="ppt-task-card" :class="{ active: isActive, [task.status]: true }">
    <!-- 第一行：标签 + 比例 + 统计 + 操作 -->
    <div class="task-row-1">
      <div class="task-meta">
        <span class="task-badge">PPT</span>
        <span v-if="task.aspectRatio" class="ratio-badge">{{ task.aspectRatio }}</span>
        <span class="status-dot" :class="task.status"></span>
        <span class="task-status-text">{{ statusText }}</span>
        <span class="task-divider">·</span>
        <span class="task-time">{{ formatTime(task.createdAt) }}</span>
      </div>
      <div class="task-actions">
        <button v-if="canCancel" class="action-btn cancel" @click.stop="$emit('cancel', task.id)">取消</button>
        <button v-if="canRetry" class="action-btn retry" @click.stop="$emit('retry', task.id)">重试</button>
        <button class="action-btn delete" @click.stop="$emit('delete', task.id)" title="删除">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- 第二行：进度条 + 统计数字 -->
    <div class="task-row-2">
      <div class="progress-wrapper">
        <div class="progress-bar">
          <div class="progress-fill" :class="task.status" :style="{ width: `${safeProgress}%` }"></div>
        </div>
      </div>
      <div class="task-counts">
        <span class="count-item" title="总页数">{{ totalCount }}页</span>
        <span class="count-sep">/</span>
        <span class="count-item succeeded" title="已完成">{{ succeededCount }}成功</span>
        <span v-if="failedCount > 0" class="count-sep">/</span>
        <span v-if="failedCount > 0" class="count-item failed" title="失败">{{ failedCount }}失败</span>
      </div>
    </div>

    <!-- 错误信息（单行截断，hover 展开） -->
    <div v-if="task.error" class="task-error" :title="task.error">
      {{ task.error }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  task: { type: Object, required: true },
  isActive: { type: Boolean, default: false }
})

defineEmits(['cancel', 'delete', 'retry'])

const canCancel = computed(() => {
  return props.task.status === 'pending' || props.task.status === 'running'
})

const canRetry = computed(() => {
  return props.task.status === 'failed'
})

const safeProgress = computed(() => {
  const p = Number(props.task.progress)
  return isNaN(p) ? 0 : Math.min(100, Math.max(0, Math.round(p)))
})

const statusText = computed(() => {
  const map = {
    pending: '等待中',
    running: '生成中',
    succeeded: '已完成',
    failed: '失败',
    cancelled: '已取消'
  }
  return map[props.task.status] || props.task.status
})

const totalCount = computed(() => props.task.slides?.length || 0)

const succeededCount = computed(() => {
  return props.task.slides?.filter(s => s.status === 'succeeded').length || 0
})

const failedCount = computed(() => {
  return props.task.slides?.filter(s => s.status === 'failed').length || 0
})

const formatTime = (timestamp) => {
  if (!timestamp) return '未知'
  const date = new Date(timestamp)
  if (isNaN(date.getTime())) return '未知'

  const now = new Date()
  const diff = now - date

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return date.toLocaleDateString()
}
</script>

<style scoped>
.ppt-task-card {
  background: #fff;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 14px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  position: relative;
  overflow: hidden;
}

.ppt-task-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  background: linear-gradient(180deg, var(--color-primary) 0%, #0a9960 100%);
  opacity: 0;
  transition: opacity 0.25s;
}

.ppt-task-card:hover {
  border-color: #a8d5c2;
  box-shadow: 0 4px 16px rgba(8, 131, 80, 0.15);
  transform: translateY(-1px);
}

.ppt-task-card:hover::before {
  opacity: 1;
}

.ppt-task-card.active {
  border-color: var(--color-primary);
  background: linear-gradient(135deg, #f0f%, #e8df7 0f5f0 100%);
  box-shadow: 0 0 0 3px rgba(8, 131, 80, 0.15);
}

.ppt-task-card.active::before {
  opacity: 1;
}

/* 第一行 */
.task-row-1 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1;
}

.task-badge {
  font-size: 11px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--color-primary) 0%, #0a9960 100%);
  color: white;
  padding: 2px 8px;
  border-radius: 6px;
  flex-shrink: 0;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 6px rgba(8, 131, 80, 0.25);
}

.ratio-badge {
  font-size: 10px;
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: #94a3b8;
}

.status-dot.running {
  background: linear-gradient(135deg, var(--color-primary) 0%, #10b981 100%);
  animation: pulse 1.5s ease-in-out infinite;
  box-shadow: 0 0 8px rgba(8, 131, 80, 0.4);
}

.status-dot.pending {
  background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
}

.status-dot.succeeded {
  background: linear-gradient(135deg, var(--color-primary) 0%, #0a9960 100%);
}

.status-dot.failed {
  background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
}

.status-dot.cancelled {
  background: #94a3b8;
}

@keyframes pulse {
 0%, 100% { opacity: 1; transform: scale(1); }
 50% { opacity: 0.6; transform: scale(0.9); }
}

.task-status-text {
  font-size: 12px;
  font-weight: 500;
  color: #475569;
  flex-shrink: 0;
}

.task-divider {
  color: #cbd5e1;
  font-size: 12px;
  flex-shrink: 0;
}

.task-time {
  font-size: 11px;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.action-btn {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 5px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  line-height: 1.4;
}

.action-btn.cancel {
  color: #f59e0b;
}

.action-btn.cancel:hover {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-color: #fde68a;
  transform: scale(1.02);
}

.action-btn.retry {
  color: var(--color-primary);
}

.action-btn.retry:hover {
  background: linear-gradient(135deg, #f0fdf7 0%, #e8f5f0 100%);
  border-color: #a8d5c2;
  transform: scale(1.02);
}

.action-btn.delete {
  color: #94a3b8;
  padding: 4px 6px;
  display: flex;
  align-items: center;
  border-radius: 6px;
}

.action-btn.delete:hover {
  color: #ef4444;
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border-color: #fecaca;
  transform: scale(1.05);
}

/* 第二行 */
.task-row-2 {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-wrapper {
  flex: 1;
  min-width: 0;
}

.progress-bar {
  height: 6px;
  background: #f1f5f9;
  border-radius: 3px;
  overflow: hidden;
  position: relative;
}

.progress-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  animation: progressShine 2s ease-in-out infinite;
}

@keyframes progressShine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, var(--color-primary) 0%, #0a9960 100%);
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  animation: progressShine 1.5s ease-in-out infinite;
}

.progress-fill.running {
  background: linear-gradient(90deg, var(--color-primary) 0%, #10b981 100%);
}

.progress-fill.failed {
  background: linear-gradient(90deg, #ef4444 0%, #f87171 100%);
}

.progress-fill.succeeded {
  background: linear-gradient(90deg, var(--color-primary) 0%, #0a9960 100%);
}

.progress-fill.cancelled {
  background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);
}

.task-counts {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  font-size: 11px;
  white-space: nowrap;
  background: #f8fafc;
  padding: 3px 8px;
  border-radius: 6px;
}

.count-item {
  color: #64748b;
  font-weight: 500;
}

.count-item.succeeded {
  background: linear-gradient(135deg, var(--color-primary) 0%, #0a9960 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 700;
}

.count-item.failed {
  background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 700;
}

.count-sep {
  color: #cbd5e1;
  font-size: 10px;
}

/* 错误行 */
.task-error {
  margin-top: 6px;
  padding: 4px 8px;
  background: #fef2f2;
  border-radius: 5px;
  font-size: 11px;
  color: #dc2626;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ppt-task-card:hover .task-error {
  white-space: normal;
  word-break: break-word;
}
</style>
