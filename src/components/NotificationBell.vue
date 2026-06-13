<template>
  <el-popover
    placement="bottom-end"
    :width="360"
    trigger="click"
    popper-class="notification-popover"
    @show="fetchList"
  >
    <template #reference>
      <div class="bell-wrapper" @click.stop>
        <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="bell-badge">
          <span class="bell-icon">🔔</span>
        </el-badge>
      </div>
    </template>
    <div class="notification-dropdown">
      <div class="dropdown-header">
        <span class="dropdown-title">消息通知</span>
        <el-button
          v-if="unreadCount > 0"
          text
          type="primary"
          size="small"
          @click="handleMarkAllRead"
        >全部已读</el-button>
      </div>
      <div class="dropdown-body">
        <div
          v-for="item in list"
          :key="item.id"
          class="notification-item"
          :class="{ unread: !item.isRead }"
          @click="handleClick(item)"
        >
          <div class="notif-avatar-wrap">
            <img v-if="item.fromUserAvatar" :src="item.fromUserAvatar" class="notif-avatar" />
            <span v-else class="notif-avatar-placeholder">{{ typeIcon(item.type) }}</span>
            <span class="notif-type-badge" :class="item.type">{{ typeBadgeIcon(item.type) }}</span>
          </div>
          <div class="notif-content">
            <span class="notif-summary">{{ item.summary }}</span>
            <span class="notif-time">{{ timeAgo(item.createdAt) }}</span>
          </div>
          <span v-if="!item.isRead" class="unread-dot" />
        </div>
        <el-empty v-if="list.length === 0" description="暂无通知" :image-size="50" />
      </div>
      <div class="dropdown-footer">
        <router-link to="/notifications" class="view-all">查看全部</router-link>
      </div>
    </div>
  </el-popover>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { notificationApi } from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const list = ref([])
const unreadCount = ref(0)
let eventSource = null
let reconnectTimer = null

const typeIcon = (type) => {
  if (type === 'like') return '👍'
  if (type === 'comment') return '💬'
  if (type === 'follow') return '👤'
  return '📢'
}

const typeBadgeIcon = (type) => {
  if (type === 'like') return '👍'
  if (type === 'comment') return '💬'
  if (type === 'follow') return '➕'
  return '🔔'
}

const timeAgo = (dateStr) => {
  if (!dateStr) return ''
  const now = Date.now()
  const past = new Date(dateStr).getTime()
  if (isNaN(past)) return dateStr.slice(0, 10)
  const diff = Math.floor((now - past) / 1000)
  if (diff < 0) return '刚刚'
  if (diff < 60) return '刚刚'
  if (diff < 3600) return Math.floor(diff / 60) + '分钟前'
  if (diff < 86400) return Math.floor(diff / 3600) + '小时前'
  if (diff < 2592000) return Math.floor(diff / 86400) + '天前'
  return dateStr.slice(0, 10)
}

const fetchUnreadCount = async () => {
  try {
    const res = await notificationApi.getUnreadCount()
    unreadCount.value = res.data?.count || 0
  } catch {
    unreadCount.value = 0
  }
}

const fetchList = async () => {
  try {
    const res = await notificationApi.getList({ page: 0, size: 5 })
    list.value = res.data?.content || []
  } catch {
    list.value = []
  }
}

const handleClick = async (item) => {
  if (!item.isRead) {
    try {
      await notificationApi.markRead(item.id)
      item.isRead = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch {
      // ignore
    }
  }
  if (item.type === 'like' || item.type === 'comment') {
    router.push(`/articles/${item.targetId}`)
  } else if (item.type === 'follow') {
    router.push(`/author/${item.fromUserId}`)
  }
}

const handleMarkAllRead = async () => {
  try {
    await notificationApi.markAllRead()
    unreadCount.value = 0
    list.value.forEach((n) => { n.isRead = true })
    ElMessage.success('已全部标记为已读')
  } catch {
    ElMessage.error('操作失败')
  }
}

const connectSSE = () => {
  const token = userStore.token
  if (!token) return
  eventSource = new EventSource(`/api/notifications/subscribe?token=${token}`)

  eventSource.addEventListener('notification', (e) => {
    try {
      const data = JSON.parse(e.data)
      unreadCount.value++
    } catch {
      // ignore
    }
  })

  eventSource.addEventListener('heartbeat', () => {})

  eventSource.onerror = () => {
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
    reconnectTimer = setTimeout(connectSSE, 5000)
  }
}

const disconnectSSE = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }
}

onMounted(() => {
  fetchUnreadCount()
  connectSSE()
})

onUnmounted(() => {
  disconnectSSE()
})
</script>

<style scoped>
.bell-wrapper {
  position: relative;
  cursor: pointer;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--spacing-xs);
  transition: background var(--transition-base);
}
.bell-wrapper:hover {
  background: var(--color-bg-secondary);
}
.bell-icon {
  font-size: 20px;
  line-height: 1;
}
.notification-dropdown {
  display: flex;
  flex-direction: column;
}
.dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-xs) var(--spacing-md);
}
.dropdown-title {
  font-size: var(--font-md);
  font-weight: 600;
  color: var(--color-text-primary);
}
.dropdown-body {
  max-height: 360px;
  overflow-y: auto;
  margin: 0 -12px;
  padding: 0 12px;
}
.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: var(--spacing-md) var(--spacing-sm);
  border-radius: 6px;
  cursor: pointer;
  transition: background var(--transition-base);
  position: relative;
}
.notification-item:hover {
  background: var(--color-bg-secondary);
}
.notification-item.unread {
  background: var(--el-color-primary-light-9);
}
.notification-item.unread:hover {
  background: var(--el-color-primary-light-8);
}
.notif-icon {
  font-size: 18px;
  flex-shrink: 0;
  margin-top: 2px;
}
.notif-avatar-wrap {
  position: relative;
  flex-shrink: 0;
}
.notif-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}
.notif-avatar-placeholder {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--el-color-primary-light-9);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}
.notif-type-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  font-size: 10px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 1px var(--color-border);
}
.notif-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.notif-summary {
  font-size: var(--font-sm);
  color: var(--color-text-primary);
  line-height: 1.4;
  word-break: break-word;
}
.notif-time {
  font-size: var(--font-xs);
  color: var(--color-text-secondary);
}
.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-interactive);
  flex-shrink: 0;
  margin-top: 6px;
}
.dropdown-footer {
  padding-top: var(--spacing-sm);
  margin: var(--spacing-xs) -4px 0;
  text-align: center;
}
.view-all {
  font-size: var(--font-sm);
  color: var(--color-interactive);
  text-decoration: none;
  display: block;
  padding: 6px;
  border-radius: var(--spacing-xs);
}
.view-all:hover {
  background: var(--el-color-primary-light-9);
}
</style>
