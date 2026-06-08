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
          <span class="notif-icon">{{ typeIcon(item.type) }}</span>
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

const timeAgo = (dateStr) => {
  if (!dateStr) return ''
  const now = Date.now()
  const past = new Date(dateStr).getTime()
  const diff = Math.floor((now - past) / 1000)
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
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}
.bell-wrapper:hover {
  background: #f5f7fa;
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
  padding: 0 4px 12px;
  border-bottom: 1px solid #eee;
}
.dropdown-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
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
  padding: 12px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;
}
.notification-item:hover {
  background: #f5f7fa;
}
.notification-item.unread {
  background: #f0f7ff;
}
.notification-item.unread:hover {
  background: #e6f0ff;
}
.notif-icon {
  font-size: 18px;
  flex-shrink: 0;
  margin-top: 2px;
}
.notif-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.notif-summary {
  font-size: 13px;
  color: #303133;
  line-height: 1.4;
  word-break: break-word;
}
.notif-time {
  font-size: 12px;
  color: #909399;
}
.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #409EFF;
  flex-shrink: 0;
  margin-top: 6px;
}
.dropdown-footer {
  border-top: 1px solid #eee;
  padding-top: 8px;
  margin: 4px -4px 0;
  text-align: center;
}
.view-all {
  font-size: 13px;
  color: #409EFF;
  text-decoration: none;
  display: block;
  padding: 6px;
  border-radius: 4px;
}
.view-all:hover {
  background: #ecf5ff;
}
</style>
