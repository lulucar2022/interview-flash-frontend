<template>
  <div class="page-container">
    <div class="back-link" @click="$router.push('/articles')">
      <el-icon><ArrowLeft /></el-icon> 返回文章列表
    </div>

    <template v-if="loading">
      <div class="article-detail">
        <div class="skeleton-title">
          <el-skeleton :rows="2" animated />
        </div>
        <div class="skeleton-author">
          <el-skeleton-item variant="circle" style="width: 40px; height: 40px" />
          <div class="skeleton-author-text">
            <el-skeleton-item variant="text" style="width: 120px" />
            <el-skeleton-item variant="text" style="width: 160px" />
          </div>
        </div>
        <div class="skeleton-content">
          <el-skeleton :rows="6" animated />
        </div>
        <div class="skeleton-comments">
          <el-skeleton-item variant="text" style="width: 100px; height: 24px" />
          <el-skeleton :rows="3" animated style="margin-top: 12px" />
        </div>
      </div>
    </template>

    <template v-else-if="article">
      <div class="article-detail">
        <h1 class="detail-title">{{ article.title }}</h1>

        <div class="detail-meta">
          <router-link class="author-info" :to="'/author/' + article.author?.id">
            <el-avatar :size="40" :src="article.author?.avatarUrl">
              {{ (article.author?.nickname || 'U')[0] }}
            </el-avatar>
            <div class="author-text">
              <span class="author-name">{{ article.author?.nickname }}</span>
              <span class="publish-date">{{ formatDate(article.createdAt) }}</span>
            </div>
          </router-link>
          <div class="meta-actions">
            <span class="topic-badge">{{ article.topic?.topicName }}</span>
            <span class="meta-stat like-btn" :class="{ liked: isLiked }" @click="handleLike">
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
            <el-button
              v-if="isAuthor"
              size="small"
              @click="$router.push(`/articles/${article.id}/edit`)"
            >
              编辑
            </el-button>
            <el-button
              v-if="isAuthor"
              size="small"
              type="danger"
              @click="handleDelete"
            >
              删除
            </el-button>
          </div>
        </div>

        <div class="article-content">
          <MdPreview :modelValue="article.content" language="zh-CN" />
        </div>

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
        <div class="section-header">
          <h3 class="section-title">评论</h3>
          <div class="comment-sort">
            <span
              class="sort-btn"
              :class="{ active: commentSort === 'oldest' }"
              @click="switchSort('oldest')"
            >最早</span>
            <span
              class="sort-btn"
              :class="{ active: commentSort === 'newest' }"
              @click="switchSort('newest')"
            >最新</span>
          </div>
        </div>

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

        <CommentItem
          v-for="comment in comments"
          :key="comment.id"
          :comment="comment"
          :article-id="route.params.id"
          :depth="0"
          @reply-submitted="fetchComments"
          @comment-updated="fetchComments"
          @comment-deleted="fetchComments"
          @like-toggled="fetchComments"
        />
      </div>
    </template>

    <div v-else class="text-center text-muted" style="padding: 60px">
      文章不存在或已删除
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MdPreview } from 'md-editor-v3'
import 'md-editor-v3/lib/preview.css'
import { articleApi, commentApi, followApi, likeApi } from '@/api'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Star, View } from '@element-plus/icons-vue'
import CommentItem from './CommentItem.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const article = ref(null)
const comments = ref([])
const loading = ref(false)
const commentContent = ref('')
const commentLoading = ref(false)
const isFollowing = ref(false)
const isLiked = ref(false)
const commentSort = ref('oldest')

const tagList = computed(() => {
  if (!article.value?.tags) return []
  return String(article.value.tags).split(',').map(t => t.trim()).filter(Boolean)
})

const isAuthor = computed(() => {
  if (!article.value || !userStore.user) return false
  return article.value.author?.id === userStore.user.id
})

const canFollow = computed(() => {
  if (!article.value || !userStore.user) return false
  return article.value.author?.id !== userStore.user.id
})

const fetchArticle = async () => {
  loading.value = true
  try {
    const res = await articleApi.getById(route.params.id)
    article.value = res.data
    if (userStore.isLoggedIn) {
      fetchFollowStatus()
      fetchLikeStatus()
    }
  } catch {
    article.value = null
  } finally {
    loading.value = false
  }
}

const fetchComments = async () => {
  try {
    const params = { sort: commentSort.value }
    const res = await commentApi.getByArticle(route.params.id, params)
    const data = res.data
    comments.value = Array.isArray(data) ? data : []
  } catch {
    comments.value = []
  }
}

const switchSort = (sort) => {
  commentSort.value = sort
  fetchComments()
}

const fetchFollowStatus = async () => {
  try {
    const res = await followApi.getStatus(article.value.author.id)
    isFollowing.value = res.data.following
  } catch {
    isFollowing.value = false
  }
}

const fetchLikeStatus = async () => {
  try {
    const res = await likeApi.getStatus(route.params.id)
    isLiked.value = res.data.liked
  } catch {
    isLiked.value = false
  }
}

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm('确定要删除该文章吗？删除后不可恢复。', '确认删除', {
      type: 'warning',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消'
    })
    await articleApi.delete(route.params.id)
    ElMessage.success('文章已删除')
    router.push('/articles')
  } catch {
    // cancelled or failed — do nothing
  }
}

const handleLike = async () => {
  try {
    const res = await likeApi.toggle(route.params.id)
    isLiked.value = res.data.liked
    if (article.value) {
      article.value.thumbsUpCount = res.data.count
    }
  } catch {
    ElMessage.error('操作失败')
  }
}

const handleFollow = async () => {
  try {
    const res = await followApi.toggle(article.value.author.id)
    isFollowing.value = res.data.following
    ElMessage.success(isFollowing.value ? '关注成功' : '已取消关注')
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
  text-decoration: none;
  color: inherit;
}

.author-info:hover .author-name {
  color: #409EFF;
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

.like-btn {
  cursor: pointer;
  transition: color 0.2s;
}

.like-btn:hover {
  color: #e6a23c;
}

.like-btn.liked {
  color: #e6a23c;
}

.article-content {
  margin-bottom: 20px;
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

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.comment-sort {
  display: flex;
  gap: 4px;
  background: #f5f5f5;
  border-radius: 6px;
  padding: 2px;
}

.sort-btn {
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  color: #666;
  transition: all 0.2s;
}

.sort-btn:hover {
  color: #409EFF;
}

.sort-btn.active {
  background: #fff;
  color: #409EFF;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.comment-form {
  margin-bottom: 24px;
}

.comment-form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

.skeleton-title {
  margin-bottom: 24px;
}

.skeleton-author {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
}

.skeleton-author-text {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-content {
  margin-bottom: 32px;
}

.skeleton-comments {
  margin-top: 24px;
}
</style>
