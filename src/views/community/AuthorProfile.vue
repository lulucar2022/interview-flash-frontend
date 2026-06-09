<template>
  <div class="page-container">
    <template v-if="loading">
      <div class="profile-header skeleton-profile-header">
        <div class="header-left">
          <el-skeleton-item variant="circle" style="width: 72px; height: 72px" />
          <div class="header-text">
            <el-skeleton-item variant="text" style="width: 140px; height: 24px" />
            <el-skeleton-item variant="text" style="width: 200px; height: 16px" />
          </div>
        </div>
      </div>
      <div class="stats-row skeleton-stats">
        <div v-for="n in 4" :key="n" class="stat-card">
          <el-skeleton-item variant="text" style="width: 24px; height: 24px" />
          <el-skeleton-item variant="text" style="width: 40px; height: 14px" />
        </div>
      </div>
      <div class="skeleton-articles">
        <div v-for="n in 3" :key="n" class="article-card" style="padding: 20px">
          <el-skeleton :rows="2" animated />
        </div>
      </div>
    </template>

    <template v-else-if="profile">
      <div class="profile-header" v-tilt>
        <div class="header-left">
          <el-avatar :size="72" :src="profile.avatarUrl">
            {{ (profile.nickname || 'U')[0] }}
          </el-avatar>
          <div class="header-text">
            <h2>{{ profile.nickname || profile.username }}</h2>
            <p v-if="profile.bio" class="bio">{{ profile.bio }}</p>
            <p class="join-date">加入于 {{ formatDate(profile.createdAt) }}</p>
          </div>
        </div>
        <div class="header-actions">
          <el-button
            v-if="profile.id !== currentUserId"
            :type="profile.following ? 'default' : 'primary'"
            :loading="followLoading"
            @click="handleToggleFollow"
          >
            {{ profile.following ? '已关注' : '关注' }}
          </el-button>
          <el-button
            v-if="profile.id !== currentUserId"
            :type="isBlocked ? 'danger' : 'default'"
            size="small"
            @click="handleToggleBlock"
          >
            {{ isBlocked ? '已拉黑' : '拉黑' }}
          </el-button>
        </div>
      </div>

      <el-row :gutter="16" class="stats-row">
        <el-col :span="6">
          <div class="stat-card" v-tilt>
            <div class="stat-value">{{ profile.articleCount }}</div>
            <div class="stat-label">文章</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card" v-tilt>
            <div class="stat-value primary">{{ profile.totalLikes }}</div>
            <div class="stat-label">获赞</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card" v-tilt>
            <div class="stat-value">{{ profile.followingCount }}</div>
            <div class="stat-label">关注</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card" v-tilt>
            <div class="stat-value success">{{ profile.followerCount }}</div>
            <div class="stat-label">粉丝</div>
          </div>
        </el-col>
      </el-row>

      <div class="articles-section">
        <h3>文章</h3>
        <div v-if="articles.length === 0" class="text-center text-muted" style="padding: 40px">
          暂无文章
        </div>
        <div
          v-for="article in articles"
          :key="article.id"
          class="article-card card"
          v-tilt
          @click="$router.push(`/articles/${article.id}`)"
        >
          <h4 class="article-title">{{ article.title }}</h4>
          <div class="article-meta">
            <span class="topic-tag">{{ article.topic?.topicName }}</span>
            <span class="meta-item">
              <el-icon><View /></el-icon>
              {{ article.viewCount || 0 }}
            </span>
            <span class="meta-item">
              <el-icon><Star /></el-icon>
              {{ article.thumbsUpCount || 0 }}
            </span>
            <span class="meta-item">
              <el-icon><ChatDotRound /></el-icon>
              {{ article.commentCount || 0 }}
            </span>
            <span class="date">{{ formatDate(article.createdAt) }}</span>
          </div>
        </div>

        <div class="pagination-wrap" v-if="totalPages > 1">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="total"
            layout="prev, pager, next"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </template>

    <div v-else-if="!loading && error" class="text-center text-muted" style="padding: 60px">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHead } from '@unhead/vue'
import { useUserStore } from '@/stores/user'
import { userApi, followApi, blockApi } from '@/api'
import { ElMessage } from 'element-plus'
import { View, Star, ChatDotRound } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const profile = ref(null)
const articles = ref([])
const loading = ref(true)
const error = ref('')
const followLoading = ref(false)
const isBlocked = ref(false)
const currentPage = ref(1)
const pageSize = 10
const total = ref(0)
const totalPages = ref(0)

const currentUserId = computed(() => userStore.user?.id)

const fetchProfile = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await userApi.getAuthorProfile(route.params.id)
    profile.value = res.data
    if (userStore.isLoggedIn && profile.value.id !== currentUserId.value) {
      const blockRes = await blockApi.getStatus(profile.value.id)
      isBlocked.value = blockRes.data.blocked
    }
  } catch {
    error.value = '用户不存在'
  } finally {
    loading.value = false
  }
}

const fetchArticles = async () => {
  try {
    const params = { page: currentPage.value - 1, size: pageSize }
    const res = await userApi.getAuthorArticles(route.params.id, params)
    const data = res.data
    if (data.content) {
      articles.value = data.content
      total.value = data.totalElements || data.total || 0
      totalPages.value = data.totalPages || 0
    } else {
      articles.value = []
    }
  } catch {
    articles.value = []
  }
}

const handleToggleFollow = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  followLoading.value = true
  try {
    const res = await followApi.toggle(profile.value.id)
    const followed = res.data
    profile.value.following = followed
    profile.value.followerCount += followed ? 1 : -1
  } catch {
    ElMessage.error('操作失败')
  } finally {
    followLoading.value = false
  }
}

const handleToggleBlock = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  try {
    const res = await blockApi.toggle(profile.value.id)
    isBlocked.value = res.data.blocked
    ElMessage.success(isBlocked.value ? '已拉黑' : '已取消拉黑')
  } catch {
    ElMessage.error('操作失败')
  }
}

const handlePageChange = (page) => {
  currentPage.value = page
  fetchArticles()
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

useHead(() => {
  const p = profile.value
  const name = p?.nickname || p?.username || ''
  const desc = p?.bio || `${name}的主页`
  return {
    title: name ? `${name} - 面试刷题系统` : '作者主页 - 面试刷题系统',
    meta: [
      { name: 'description', content: desc },
      { property: 'og:title', content: name },
      { property: 'og:description', content: desc },
      { property: 'og:type', content: 'profile' },
      { property: 'og:url', content: window.location.href },
    ]
  }
})

onMounted(async () => {
  await fetchProfile()
  if (profile.value) {
    await fetchArticles()
  }
})
</script>

<style scoped>
.profile-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 32px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-text h2 {
  color: #fff;
  font-size: 22px;
  margin: 0 0 6px 0;
}

.bio {
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
  margin: 0 0 4px 0;
}

.join-date {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  margin: 0;
}

.header-actions {
  flex-shrink: 0;
}

.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-value.primary {
  color: #409EFF;
}

.stat-value.success {
  color: #67C23A;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.articles-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.articles-section h3 {
  font-size: 18px;
  color: #303133;
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.article-card {
  padding: 16px 20px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.article-card:hover .article-title {
  color: #409EFF;
}

.article-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 10px 0;
  transition: color 0.2s;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 13px;
  color: #999;
  flex-wrap: wrap;
}

.topic-tag {
  background: #ecf5ff;
  color: #409EFF;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.date {
  margin-left: auto;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding: 16px 0 0;
}

.skeleton-profile-header {
  display: flex;
  align-items: center;
  gap: 24px;
}

.skeleton-stats {
  margin: 24px 0;
}

.skeleton-stats .stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.skeleton-articles {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
