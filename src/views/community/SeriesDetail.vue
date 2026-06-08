<template>
  <div class="page-container series-detail-page">
    <div class="back-link" @click="$router.push('/series')">
      <el-icon><ArrowLeft /></el-icon> 返回系列列表
    </div>

    <template v-if="loading">
      <el-skeleton :rows="5" animated />
    </template>

    <template v-else-if="series">
      <div class="series-header" :style="{ background: headerGradient }">
        <div class="series-header-content">
          <h1 class="series-title">{{ series.title }}</h1>
          <p class="series-desc" v-if="series.description">{{ series.description }}</p>
          <div class="series-meta">
            <span>{{ articleCount }} 篇文章</span>
            <span>创建于 {{ formatDate(series.createdAt) }}</span>
          </div>
          <div class="series-actions" v-if="isOwner">
            <el-button size="small" @click="showEditDialog = true">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete">删除</el-button>
          </div>
        </div>
      </div>

      <div class="article-list">
        <div v-if="articles.length === 0" class="text-center text-muted" style="padding: 60px">
          该系列暂无文章
        </div>
        <div v-for="(article, idx) in articles" :key="article.id" class="article-item" @click="$router.push(`/articles/${article.id}`)">
          <div class="article-order">{{ idx + 1 }}</div>
          <div class="article-info">
            <h3 class="article-title">{{ article.title }}</h3>
            <div class="article-meta">
              <span>{{ formatDate(article.createdAt) }}</span>
              <span>👁️ {{ article.viewCount || 0 }}</span>
            </div>
          </div>
          <el-icon><ArrowRight /></el-icon>
        </div>
      </div>

      <div v-if="totalPages > 1" class="pagination-wrap">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="fetchDetail"
        />
      </div>
    </template>

    <div v-else class="text-center text-muted" style="padding: 60px">
      系列不存在或已删除
    </div>

    <el-dialog v-model="showEditDialog" title="编辑系列" width="500px">
      <el-form :model="editForm" label-position="top">
        <el-form-item label="系列名称" required>
          <el-input v-model="editForm.title" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="editForm.description" type="textarea" :rows="3" maxlength="500" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" :loading="updating" @click="handleUpdate">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { seriesApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const series = ref(null)
const articles = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const showEditDialog = ref(false)
const updating = ref(false)
const editForm = ref({ title: '', description: '' })

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))
const articleCount = computed(() => series.value?.articleCount || 0)
const isOwner = computed(() => {
  if (!series.value || !userStore.user) return false
  return series.value.userId === userStore.user.id
})

const headerGradient = computed(() => {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  ]
  const id = series.value?.id || 0
  return gradients[id % gradients.length]
})

const fetchDetail = async () => {
  loading.value = true
  try {
    const res = await seriesApi.getById(route.params.id, {
      page: currentPage.value - 1,
      size: pageSize.value,
    })
    series.value = res.data.series
    articles.value = Array.isArray(res.data.articles?.content) ? res.data.articles.content : []
    total.value = res.data.articles?.totalElements || 0
  } catch {
    series.value = null
    articles.value = []
  } finally {
    loading.value = false
  }
}

const handleUpdate = async () => {
  if (!editForm.value.title.trim()) {
    ElMessage.warning('请输入系列名称')
    return
  }
  updating.value = true
  try {
    await seriesApi.update(route.params.id, {
      title: editForm.value.title.trim(),
      description: editForm.value.description.trim() || null,
    })
    ElMessage.success('保存成功')
    showEditDialog.value = false
    fetchDetail()
  } catch {
    ElMessage.error('保存失败')
  } finally {
    updating.value = false
  }
}

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm('确定要删除该系列吗？系列中的文章不会被删除。', '确认删除', {
      type: 'warning',
      confirmButtonText: '确定删除',
      cancelButtonText: '取消'
    })
    await seriesApi.delete(route.params.id)
    ElMessage.success('系列已删除')
    router.push('/series')
  } catch {
    // cancelled or failed
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

onMounted(() => {
  fetchDetail()
})
</script>

<style scoped>
.series-detail-page {
  max-width: 900px;
  margin: 0 auto;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #409EFF;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 20px;
}

.series-header {
  border-radius: 12px;
  padding: 40px;
  color: #fff;
  margin-bottom: 24px;
}

.series-header-content {
  max-width: 600px;
}

.series-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 12px 0;
}

.series-desc {
  font-size: 15px;
  opacity: 0.9;
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.series-meta {
  display: flex;
  gap: 20px;
  font-size: 13px;
  opacity: 0.8;
}

.series-actions {
  margin-top: 16px;
  display: flex;
  gap: 8px;
}

.series-actions .el-button {
  color: #fff;
  border-color: rgba(255,255,255,0.5);
}

.article-list {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

.article-item {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #f0f0f0;
}

.article-item:last-child {
  border-bottom: none;
}

.article-item:hover {
  background: #f5f7fa;
}

.article-order {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #ecf5ff;
  color: #409EFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.article-info {
  flex: 1;
  margin: 0 16px;
  min-width: 0;
}

.article-title {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.article-meta {
  font-size: 12px;
  color: #c0c4cc;
  display: flex;
  gap: 16px;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>
