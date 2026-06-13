<template>
  <div class="notif-page page-container">
    <div class="notif-header">
      <h2>消息通知</h2>
      <el-button
        v-if="unreadCount > 0"
        type="primary"
        plain
        size="small"
        @click="handleMarkAllRead"
      >全部已读</el-button>
    </div>

    <div class="notif-list">
      <div
        v-for="item in list"
        :key="item.id"
        class="notif-card"
        :class="{ unread: !item.isRead, read: item.isRead }"
        @click="handleClick(item)"
      >
        <div class="notif-card-left">
          <span class="notif-type-icon">{{ typeIcon(item.type) }}</span>
        </div>
        <div class="notif-card-body">
          <div class="notif-summary">{{ item.summary }}</div>
          <div class="notif-meta">
            <span class="notif-time">{{ formatDateTime(item.createdAt) }}</span>
            <span v-if="!item.isRead" class="unread-badge">未读</span>
          </div>
        </div>
        <div class="notif-card-right">
          <el-button
            v-if="!item.isRead"
            text
            type="primary"
            size="small"
            @click.stop="handleMarkRead(item)"
          >标为已读</el-button>
        </div>
      </div>

      <el-empty v-if="loaded && list.length === 0" description="暂无通知" :image-size="80" />

      <div v-if="totalPages > 1" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="page"
          :page-size="size"
          :total="total"
          layout="prev, pager, next"
          @current-change="fetchList"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { notificationApi } from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()

const list = ref([])
const page = ref(0)
const size = 20
const total = ref(0)
const totalPages = ref(0)
const loaded = ref(false)
const unreadCount = ref(0)

const typeIcon = (type) => {
  if (type === 'like') return '👍'
  if (type === 'comment') return '💬'
  if (type === 'follow') return '👤'
  return '📢'
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const fetchList = async () => {
  try {
    const res = await notificationApi.getList({ page: page.value, size })
    const data = res.data || {}
    list.value = data.content || []
    total.value = data.totalElements || 0
    totalPages.value = data.totalPages || 0
  } catch {
    list.value = []
  } finally {
    loaded.value = true
  }
}

const fetchUnreadCount = async () => {
  try {
    const res = await notificationApi.getUnreadCount()
    unreadCount.value = res.data?.count || 0
  } catch {
    unreadCount.value = 0
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
  if ((item.type === 'like' || item.type === 'comment') && item.targetId) {
    router.push(`/articles/${item.targetId}`)
  } else if (item.type === 'follow' && item.fromUserId) {
    router.push(`/author/${item.fromUserId}`)
  }
}

const handleMarkRead = async (item) => {
  if (item.isRead) return
  try {
    await notificationApi.markRead(item.id)
    item.isRead = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  } catch {
    ElMessage.error('操作失败')
  }
}

const handleMarkAllRead = async () => {
  try {
    await notificationApi.markAllRead()
    list.value.forEach((n) => { n.isRead = true })
    unreadCount.value = 0
    ElMessage.success('已全部标记为已读')
  } catch {
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  fetchList()
  fetchUnreadCount()
})
</script>

<style scoped>
.notif-page {
  max-width: 800px;
  margin: 0 auto;
  padding-top: 24px;
}

.notif-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.notif-header h2 {
  font-size: 22px;
  color: var(--color-text-primary);
}

.notif-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notif-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--color-surface);
  border-radius: 10px;
  padding: 16px 20px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all 0.2s;
}

.notif-card:hover {
  box-shadow: var(--shadow-md);
}

.notif-card.unread {
  border-left: 3px solid var(--color-interactive);
  background: var(--el-color-primary-light-9);
}

.notif-card.read {
  border-left: 3px solid transparent;
}

.notif-card-left {
  flex-shrink: 0;
}

.notif-type-icon {
  font-size: 24px;
}

.notif-card-body {
  flex: 1;
  min-width: 0;
}

.notif-summary {
  font-size: 14px;
  color: var(--color-text-primary);
  line-height: 1.5;
  margin-bottom: 6px;
  word-break: break-word;
}

.notif-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.notif-time {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.unread-badge {
  font-size: 11px;
  color: var(--color-interactive);
  background: var(--el-color-primary-light-9);
  padding: 1px 6px;
  border-radius: 3px;
}

.notif-card-right {
  flex-shrink: 0;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}
</style>
