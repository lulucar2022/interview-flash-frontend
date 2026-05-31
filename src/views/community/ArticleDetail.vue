<template>
  <div class="page-container">
    <div class="back-link" @click="$router.push('/articles')">
      <el-icon><ArrowLeft /></el-icon> 返回文章列表
    </div>

    <div v-if="loading" class="text-center" style="padding: 60px">
      <el-icon class="is-loading" :size="32"><Loading /></el-icon>
    </div>

    <template v-else-if="article">
      <div class="article-detail">
        <h1 class="detail-title">{{ article.title }}</h1>

        <div class="detail-meta">
          <div class="author-info">
            <el-avatar :size="40" :src="article.authorAvatarUrl">
              {{ (article.authorNickname || 'U')[0] }}
            </el-avatar>
            <div class="author-text">
              <span class="author-name">{{ article.authorNickname }}</span>
              <span class="publish-date">{{ formatDate(article.createdAt) }}</span>
            </div>
          </div>
          <div class="meta-actions">
            <span class="topic-badge">{{ article.topicName }}</span>
            <span class="meta-stat">
              <el-icon><Star /></el-icon> {{ article.thumbsUpCount || 0 }}
            </span>
            <span class="meta-stat">
              <el-icon><View /></el-icon> {{ article.viewCount || 0 }}
            </span>
            <el-button
              v-if="canFollow"
              :type="isFollowing ? 'default' : 'primary'"
              size="small"
              @click="handleFollow"
            >
              {{ isFollowing ? '已关注' : '关注' }}
            </el-button>
          </div>
        </div>

        <div class="article-content" v-html="sanitizedContent"></div>

        <div class="tags" v-if="article.tags">
          <el-tag
            v-for="tag in tagList"
            :key="tag"
            size="small"
            style="margin-right: 6px"
          >
            {{ tag }}
          </el-tag>
        </div>
      </div>

      <div class="comments-section">
        <h3 class="section-title">评论 ({{ comments.length }})</h3>

        <div class="comment-form">
          <el-input
            v-model="commentContent"
            type="textarea"
            :rows="3"
            placeholder="写下你的评论..."
          />
          <div class="comment-form-actions">
            <el-button type="primary" :loading="commentLoading" @click="submitComment">
              发表评论
            </el-button>
          </div>
        </div>

        <div v-if="comments.length === 0" class="text-center text-muted" style="padding: 40px">
          暂无评论，快来发表第一条评论吧
        </div>

        <div v-for="comment in comments" :key="comment.id" class="comment-item">
          <el-avatar :size="36" :src="comment.authorAvatarUrl">
            {{ (comment.authorNickname || 'U')[0] }}
          </el-avatar>
          <div class="comment-body">
            <div class="comment-header">
              <span class="comment-author">{{ comment.authorNickname }}</span>
              <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
            </div>
            <p class="comment-content">{{ comment.content }}</p>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="text-center text-muted" style="padding: 60px">
      文章不存在或已删除
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import DOMPurify from 'dompurify'
import { useRoute } from 'vue-router'
import { articleApi, commentApi, followApi } from '@/api'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { Loading, ArrowLeft, Star, View } from '@element-plus/icons-vue'

const route = useRoute()
const userStore = useUserStore()

const article = ref(null)
const comments = ref([])
const loading = ref(false)
const commentContent = ref('')
const commentLoading = ref(false)
const isFollowing = ref(false)

const sanitizedContent = computed(() => {
  if (!article.value?.content) return ''
  return DOMPurify.sanitize(article.value.content)
})

const tagList = computed(() => {
  if (!article.value?.tags) return []
  return String(article.value.tags).split(',').map(t => t.trim()).filter(Boolean)
})

const canFollow = computed(() => {
  if (!article.value || !userStore.user) return false
  return article.value.authorId !== userStore.user.id
})

const fetchArticle = async () => {
  loading.value = true
  try {
    const res = await articleApi.getById(route.params.id)
    article.value = res.data
    if (article.value?.authorId && userStore.isLoggedIn) {
      fetchFollowStatus()
    }
  } catch {
    article.value = null
  } finally {
    loading.value = false
  }
}

const fetchComments = async () => {
  try {
    const res = await commentApi.getByArticle({ articleId: route.params.id })
    comments.value = Array.isArray(res.data) ? res.data : []
  } catch {
    comments.value = []
  }
}

const fetchFollowStatus = async () => {
  try {
    const res = await followApi.getStatus({ followingId: article.value.authorId })
    isFollowing.value = res.data.following
  } catch {
    isFollowing.value = false
  }
}

const handleFollow = async () => {
  try {
    if (isFollowing.value) {
      await followApi.unfollow({ followingId: article.value.authorId })
      isFollowing.value = false
      ElMessage.success('已取消关注')
    } else {
      await followApi.follow({ followingId: article.value.authorId })
      isFollowing.value = true
      ElMessage.success('关注成功')
    }
  } catch {
    ElMessage.error('操作失败')
  }
}

const submitComment = async () => {
  if (!commentContent.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }
  commentLoading.value = true
  try {
    await commentApi.create({
      articleId: route.params.id,
      content: commentContent.value.trim()
    })
    ElMessage.success('评论成功')
    commentContent.value = ''
    fetchComments()
  } catch {
    ElMessage.error('评论失败')
  } finally {
    commentLoading.value = false
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

onMounted(() => {
  fetchArticle()
  fetchComments()
})
</script>

<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #409EFF;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 20px;
}

.back-link:hover {
  color: #66b1ff;
}

.article-detail {
  background: #fff;
  border-radius: 8px;
  padding: 32px;
  box-shadow: 0 0 0 1px var(--color-ring);
  margin-bottom: 24px;
}

.detail-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 20px 0;
  line-height: 1.4;
}

.detail-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-text {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.publish-date {
  font-size: 12px;
  color: #999;
}

.meta-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.topic-badge {
  background: #ecf5ff;
  color: #409EFF;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
}

.meta-stat {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #999;
  font-size: 13px;
}

.article-content {
  font-size: 15px;
  line-height: 1.8;
  color: #333;
  margin-bottom: 20px;
}

.article-content :deep(h1),
.article-content :deep(h2),
.article-content :deep(h3) {
  margin: 24px 0 12px;
}

.article-content :deep(p) {
  margin: 0 0 16px;
}

.article-content :deep(img) {
  max-width: 100%;
  border-radius: 8px;
}

.article-content :deep(pre) {
  background: #f6f8fa;
  border-radius: 6px;
  padding: 16px;
  overflow-x: auto;
}

.article-content :deep(code) {
  background: #f6f8fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
}

.tags {
  margin-top: 16px;
}

.comments-section {
  background: #fff;
  border-radius: 8px;
  padding: 24px 32px;
  box-shadow: 0 0 0 1px var(--color-ring);
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 20px 0;
}

.comment-form {
  margin-bottom: 24px;
}

.comment-form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid #f5f5f5;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-body {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.comment-author {
  font-size: 14px;
  font-weight: 500;
  color: #409EFF;
}

.comment-date {
  font-size: 12px;
  color: #ccc;
}

.comment-content {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  margin: 0;
}
</style>
