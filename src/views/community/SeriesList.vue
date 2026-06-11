<template>
  <div class="page-container series-list-page">
    <div class="page-header">
      <h1 class="page-title">文章系列</h1>
      <el-button type="primary" @click="showCreateDialog = true">新建系列</el-button>
    </div>

    <div class="filter-bar">
      <el-radio-group v-model="filterMode" @change="fetchSeries">
        <el-radio-button value="all">全部系列</el-radio-button>
        <el-radio-button value="mine">我的系列</el-radio-button>
      </el-radio-group>
    </div>

    <el-row :gutter="20" v-loading="loading">
      <el-col v-for="s in series" :key="s.id" :span="8" :xs="24" :sm="12" :md="8" style="margin-bottom: 20px">
        <div class="series-card" v-tilt @click="$router.push(`/series/${s.id}`)">
          <div class="series-cover" :class="{ 'series-cover--has-image': s.coverImage }"
               :style="s.coverImage ? { backgroundImage: `url(${s.coverImage})` } : {}">
            <el-icon v-if="!s.coverImage" class="series-cover-icon"><Collection /></el-icon>
            <div class="series-article-count">{{ s.articleCount }} 篇文章</div>
          </div>
          <div class="series-body">
            <h3 class="series-title">{{ s.title }}</h3>
            <p class="series-desc" v-if="s.description">{{ s.description }}</p>
            <div class="series-meta">
              <span>创建于 {{ formatDate(s.createdAt) }}</span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-empty v-if="!loading && series.length === 0" description="暂无系列" />

    <el-dialog v-model="showCreateDialog" title="新建系列" width="500px" :close-on-click-modal="false">
      <div class="create-dialog-gradient" :style="{ background: createDialogGradient }">
        <span class="create-dialog-icon">✨</span>
        <span>创建新的文章系列</span>
      </div>
      <el-form :model="createForm" label-position="top" style="margin-top: 20px">
        <el-form-item label="系列名称">
          <el-input v-model="createForm.title" placeholder="请输入系列名称" maxlength="100" show-word-limit clearable />
        </el-form-item>
        <el-form-item>
          <template #label>
            <span>简介</span>
            <span class="label-hint">（可选）</span>
          </template>
          <el-input v-model="createForm.description" type="textarea" :rows="4"
            placeholder="输入系列简介，描述这个系列的主题和内容" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="handleCreate">创建系列</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { seriesApi } from '@/api'
import { CARD_GRADIENTS } from './constants'
import { ElMessage } from 'element-plus'
import { Collection } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const series = ref([])
const loading = ref(false)
const filterMode = ref('all')
const showCreateDialog = ref(false)
const creating = ref(false)
const createForm = ref({ title: '', description: '' })

const createDialogGradient = CARD_GRADIENTS[0]

const fetchSeries = async () => {
  loading.value = true
  try {
    const params = filterMode.value === 'mine' ? { userId: userStore.user?.id } : {}
    const res = await seriesApi.getList(params)
    series.value = Array.isArray(res.data) ? res.data : []
  } catch {
    series.value = []
  } finally {
    loading.value = false
  }
}

const handleCreate = async () => {
  if (!createForm.value.title.trim()) {
    ElMessage.warning('请输入系列名称')
    return
  }
  creating.value = true
  try {
    const res = await seriesApi.create({
      title: createForm.value.title.trim(),
      description: createForm.value.description.trim() || null,
    })
    ElMessage.success('系列创建成功')
    showCreateDialog.value = false
    createForm.value = { title: '', description: '' }
    router.push(`/series/${res.data.id}`)
  } catch {
    ElMessage.error('创建失败')
  } finally {
    creating.value = false
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

onMounted(() => {
  fetchSeries()
})
</script>

<style scoped>
.series-list-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-bar {
  margin-bottom: 24px;
}

.series-card {
  background: var(--color-surface);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-md);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.series-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.series-cover {
  height: 120px;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 12px;
  position: relative;
  background: var(--color-bg-secondary);
}

.series-cover--has-image {
  background-size: cover;
  background-position: center;
}

.series-cover-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -60%);
  font-size: 32px;
  color: var(--color-border);
}

.series-article-count {
  background: rgba(0, 0, 0, 0.5);
  color: var(--color-text-on-primary);
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 10px;
}

.series-body {
  padding: 16px;
}

.series-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.series-desc {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0 0 12px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.series-meta {
  font-size: 12px;
  color: var(--color-text-placeholder);
}

.create-dialog-gradient {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  border-radius: var(--radius-sm);
  color: var(--color-text-on-primary);
  font-size: 15px;
  font-weight: 500;
}

.create-dialog-icon {
  font-size: 18px;
}

.label-hint {
  color: var(--color-text-placeholder);
  font-size: 12px;
  font-weight: 400;
  margin-left: 4px;
}
</style>
