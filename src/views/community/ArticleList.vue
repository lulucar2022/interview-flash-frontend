<template>
  <div class="page-container">
    <div class="article-list-layout">
      <div class="sidebar">
        <div class="sidebar-card">
          <div class="sidebar-header">
            <h3>话题分类</h3>
          </div>
          <div class="topic-list">
            <div
              class="topic-item"
              :class="{ active: currentTopicId === '' }"
              @click="filterByTopic('')"
            >
              全部
            </div>
            <div
              v-for="topic in topics"
              :key="topic.id"
              class="topic-item"
              :class="{ active: currentTopicId === topic.id }"
              @click="filterByTopic(topic.id)"
            >
              {{ topic.topicName || topic.name }}
            </div>
          </div>
        </div>
        <el-button type="primary" class="create-btn" @click="$router.push('/articles/create')">
          发布文章
        </el-button>
      </div>

      <div class="main-content">
        <div v-if="loading" class="text-center" style="padding: 40px">
          <el-icon class="is-loading" :size="32"><Loading /></el-icon>
        </div>

        <template v-else>
          <div v-if="articles.length === 0" class="text-center text-muted" style="padding: 60px">
            暂无文章
          </div>

          <div
            v-for="article in articles"
            :key="article.id"
            class="article-card card"
            @click="$router.push(`/articles/${article.id}`)"
          >
            <div class="article-main">
              <h3 class="article-title">{{ article.title }}</h3>
              <div class="article-meta">
                <span class="author">{{ article.authorNickname || article.authorName }}</span>
                <span class="topic-tag">{{ article.topicName }}</span>
                <span class="meta-item">
                  <el-icon><Star /></el-icon>
                  {{ article.thumbsUpCount || 0 }}
                </span>
                <span class="meta-item">
                  <el-icon><ChatDotRound /></el-icon>
                  {{ article.commentCount || 0 }}
                </span>
                <span class="meta-item">
                  <el-icon><View /></el-icon>
                  {{ article.viewCount || 0 }}
                </span>
                <span class="date">{{ formatDate(article.createdAt) }}</span>
              </div>
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
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { articleApi, topicApi } from '@/api'
import { Loading, Star, ChatDotRound, View } from '@element-plus/icons-vue'

const articles = ref([])
const topics = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = 10
const total = ref(0)
const totalPages = ref(0)
const currentTopicId = ref('')

const fetchArticles = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize,
      status: 'PUBLISHED'
    }
    if (currentTopicId.value) {
      params.topicId = currentTopicId.value
    }
    const res = await articleApi.getList(params)
    const data = res.data
    if (Array.isArray(data)) {
      articles.value = data
    } else if (data.content) {
      articles.value = data.content
      total.value = data.totalElements || data.total || 0
      totalPages.value = data.totalPages || 0
    } else {
      articles.value = []
    }
  } catch {
    articles.value = []
  } finally {
    loading.value = false
  }
}

const fetchTopics = async () => {
  try {
    const res = await topicApi.getAll()
    topics.value = Array.isArray(res.data) ? res.data : []
  } catch {
    topics.value = []
  }
}

const filterByTopic = (topicId) => {
  currentTopicId.value = topicId
  currentPage.value = 1
  fetchArticles()
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

onMounted(() => {
  fetchTopics()
  fetchArticles()
})
</script>

<style scoped>
.article-list-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.sidebar {
  width: 240px;
  flex-shrink: 0;
  position: sticky;
  top: 84px;
}

.sidebar-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 0 0 1px var(--color-ring);
  margin-bottom: 16px;
}

.sidebar-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #333;
}

.topic-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.topic-item {
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.2s;
}

.topic-item:hover {
  background: #ecf5ff;
  color: #409EFF;
}

.topic-item.active {
  background: #ecf5ff;
  color: #409EFF;
  font-weight: 500;
}

.create-btn {
  width: 100%;
}

.main-content {
  flex: 1;
  min-width: 0;
}

.article-card {
  margin-bottom: 16px;
  padding: 20px;
}

.article-card:hover .article-title {
  color: #409EFF;
}

.article-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
  transition: color 0.2s;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 13px;
  color: #999;
  flex-wrap: wrap;
}

.author {
  color: #409EFF;
  font-weight: 500;
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
  padding: 20px 0;
}
</style>
