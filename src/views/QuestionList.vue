<template>
  <div class="question-list-container page-container">
    <div class="page-header">
      <h1 class="page-title">题库列表</h1>
      <div class="filters">
        <el-select v-model="selectedCategory" placeholder="选择分类" clearable @change="handleFilterChange">
          <el-option
            v-for="cat in categories"
            :key="cat.id"
            :label="cat.name"
            :value="cat.id"
          />
        </el-select>
        <el-select v-model="selectedDifficulty" placeholder="选择难度" clearable @change="handleFilterChange">
          <el-option label="简单" value="LOW" />
          <el-option label="中等" value="MEDIUM" />
          <el-option label="困难" value="HIGH" />
        </el-select>
      </div>
    </div>
    
    <div class="question-grid" v-loading="loading">
      <div
        v-for="question in questions"
        :key="question.id"
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
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { categoryApi, questionApi } from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const questions = ref([])
const categories = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const selectedCategory = ref(null)
const selectedDifficulty = ref(null)

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

const getDifficultyType = (difficulty) => {
  const types = { LOW: 'success', MEDIUM: 'warning', HIGH: 'danger' }
  return types[difficulty] || 'info'
}

const getDifficultyText = (difficulty) => {
  const texts = { LOW: '简单', MEDIUM: '中等', HIGH: '困难' }
  return texts[difficulty] || difficulty
}

onMounted(() => {
  loadCategories()
  loadQuestions()
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
}

.filters {
  display: flex;
  gap: 12px;
}

.question-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.question-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.3s;
}

.question-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.question-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  flex: 1;
  margin-right: 12px;
}

.question-content {
  color: #606266;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 16px;
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
  background: #ecf5ff;
  color: #409EFF;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
}

.empty-state {
  grid-column: 1 / -1;
  padding: 60px 0;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
}
</style>
