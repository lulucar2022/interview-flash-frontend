<template>
  <div class="question-list-container page-container">
    <div class="page-header">
      <h1 class="page-title">题库列表</h1>
      <div class="page-actions" v-if="userStore.user?.role === 'ADMIN'">
        <el-button type="primary" @click="showImportDialog = true">📥 批量导入</el-button>
      </div>
      <div class="filters">
        <div class="filter-item">
          <label class="filter-label">分类</label>
          <el-select v-model="selectedCategory" placeholder="全部分类" clearable @change="handleFilterChange">
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </div>
        <div class="filter-item">
          <label class="filter-label">难度</label>
          <el-select v-model="selectedDifficulty" placeholder="全部难度" clearable @change="handleFilterChange">
            <el-option label="简单" value="EASY" />
            <el-option label="中等" value="MEDIUM" />
            <el-option label="困难" value="HARD" />
          </el-select>
        </div>
      </div>
    </div>
    
    <div class="question-grid" v-loading="loading">
      <div
        v-for="question in questions"
        :key="question.id"
        v-tilt
        class="question-card"
        @click="goToQuestion(question.id)"
      >
        <div class="question-header">
          <h3 class="question-title">{{ question.title }}</h3>
          <el-tag :type="getDifficultyType(question.difficulty)" size="small">
            {{ getDifficultyText(question.difficulty) }}
          </el-tag>
        </div>
        <p class="question-content">{{ question.content }}</p>
        <div class="question-footer">
          <span class="category-tag">{{ question.categoryName }}</span>
          <el-button type="primary" size="small" text @click.stop="goToPractice(question.id)">
            开始答题
          </el-button>
        </div>
      </div>
      
      <div v-if="questions.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无题目" />
      </div>
    </div>
    
    <div class="pagination-wrapper" v-if="total > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <el-dialog v-model="showImportDialog" title="批量导入题库" width="500px">
      <div class="import-body">
        <el-upload
          ref="uploadRef"
          drag
          accept=".xlsx,.json"
          :limit="1"
          :before-upload="handleBeforeUpload"
          :http-request="handleUpload"
          :auto-upload="false"
        >
          <div class="upload-icon">📂</div>
          <div class="upload-text">将 .xlsx 或 .json 文件拖到此处</div>
          <div class="upload-hint">或点击选择文件</div>
        </el-upload>

        <div class="import-actions">
          <el-button type="primary" @click="submitUpload" :loading="importLoading">
            开始导入
          </el-button>
          <el-button @click="downloadTemplate">下载导入模板</el-button>
        </div>

        <div v-if="importResult" class="import-result">
          <el-alert
            :type="importResult.fail > 0 ? 'warning' : 'success'"
            :closable="false"
          >
            <template #title>
              导入完成：成功 {{ importResult.success }} 条，失败 {{ importResult.fail }} 条
            </template>
          </el-alert>
          <ul v-if="importResult.errors.length > 0" class="error-list">
            <li v-for="(err, i) in importResult.errors" :key="i">{{ err }}</li>
          </ul>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useQuestionHelpers } from '@/composables/useQuestionHelpers'
import { categoryApi, questionApi } from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { getDifficultyText, getDifficultyType } = useQuestionHelpers()

const loading = ref(false)
const questions = ref([])
const categories = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const selectedCategory = ref(null)
const selectedDifficulty = ref(null)

const showImportDialog = ref(false)
const importLoading = ref(false)
const importFile = ref(null)
const importResult = ref(null)

const handleBeforeUpload = (file) => {
  const ext = file.name.split('.').pop().toLowerCase()
  if (!['xlsx', 'json'].includes(ext)) {
    ElMessage.error('仅支持 .xlsx 或 .json 文件')
    return false
  }
  importFile.value = file
  return false
}

const handleUpload = () => {}

const submitUpload = async () => {
  if (!importFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }
  importLoading.value = true
  importResult.value = null
  try {
    const res = await questionApi.importFile(importFile.value)
    importResult.value = res.data
    ElMessage.success(`导入完成: 成功 ${res.data.success} 条, 失败 ${res.data.fail} 条`)
    loadQuestions()
  } catch (e) {
    ElMessage.error('导入失败')
  } finally {
    importLoading.value = false
  }
}

const downloadTemplate = async () => {
  try {
    const res = await questionApi.downloadTemplate()
    const blob = res instanceof Blob ? res : new Blob([res])
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'questions-template.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    ElMessage.error('下载模板失败')
  }
}

const loadCategories = async () => {
  try {
    const res = await categoryApi.getAll()
    categories.value = res.data || []
    
    if (route.query.categoryId) {
      selectedCategory.value = parseInt(route.query.categoryId)
    }
  } catch (error) {
    console.error('加载分类失败', error)
  }
}

const loadQuestions = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value - 1,
      size: pageSize.value
    }
    if (selectedCategory.value) {
      params.categoryId = selectedCategory.value
    }
    if (selectedDifficulty.value) {
      params.difficulty = selectedDifficulty.value
    }
    
    const res = await questionApi.getList(params)
    questions.value = res.data?.content || []
    total.value = res.data?.totalElements || 0
  } catch (error) {
    ElMessage.error('加载题目失败')
  } finally {
    loading.value = false
  }
}

const handleFilterChange = () => {
  currentPage.value = 1
  loadQuestions()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  loadQuestions()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  loadQuestions()
}

const goToQuestion = (id) => {
  router.push(`/questions/${id}`)
}

const goToPractice = (id) => {
  router.push(`/practice?questionId=${id}`)
}

onMounted(() => {
  loadCategories().then(() => loadQuestions())
})
</script>

<style scoped>
.question-list-container {
  padding-top: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.filters {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.filter-label {
  font-size: var(--font-base);
  color: var(--color-text-secondary);
  font-weight: 500;
  white-space: nowrap;
}

.question-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.question-card {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: 20px;
  box-shadow: var(--shadow-md);
  cursor: pointer;
  transition: var(--transition-slow);
}

.question-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-md);
}

.question-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  flex: 1;
  margin-right: var(--spacing-md);
}

.question-content {
  color: var(--color-text-secondary);
  font-size: var(--font-base);
  line-height: 1.6;
  margin-bottom: var(--spacing-md);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.question-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-tag {
  background: var(--el-color-primary-light-9);
  color: var(--color-interactive);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--spacing-xs);
  font-size: var(--font-xs);
}

.empty-state {
  grid-column: 1 / -1;
  padding: 60px 0;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
}

.page-actions {
  display: flex;
  gap: var(--spacing-md);
}

.import-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.upload-icon {
  font-size: 40px;
  margin-bottom: var(--spacing-sm);
}

.upload-text {
  font-size: var(--font-base);
  color: var(--color-text-secondary);
}

.upload-hint {
  font-size: var(--font-xs);
  color: var(--color-placeholder);
  margin-top: var(--spacing-xs);
}

.import-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
}

.import-result {
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
}

.error-list {
  margin-top: var(--spacing-md);
  padding-left: 20px;
  font-size: var(--font-sm);
  color: var(--color-warning);
  line-height: 1.8;
}

@media (max-width: 768px) {
  .question-grid {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
