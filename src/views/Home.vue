<template>
  <div class="home-container page-container">
    <div class="welcome-section">
      <h1>欢迎回来，{{ userStore.user?.displayName || userStore.user?.username }} 👋</h1>
      <p>开始今天的刷题之旅吧！</p>
    </div>
    
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon" style="background: #409EFF;">📚</div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.totalQuestions || 0 }}</div>
              <div class="stat-label">总题目数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon" style="background: #67C23A;">✅</div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.masteredCount || 0 }}</div>
              <div class="stat-label">已掌握</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon" style="background: #F56C6C;">❌</div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.wrongCount || 0 }}</div>
              <div class="stat-label">错题数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon" style="background: #E6A23C;">📊</div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.progressRate || '0.00' }}%</div>
              <div class="stat-label">掌握率</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
    
    <el-row :gutter="20">
      <el-col :span="16">
        <div class="section">
          <div class="section-header">
            <h2>📚 题库分类</h2>
            <el-button type="primary" text @click="$router.push('/questions')">查看全部</el-button>
          </div>
          <div class="category-grid">
            <div
              v-for="category in categories"
              :key="category.id"
              class="category-card"
              @click="goToQuestions(category.id)"
            >
              <div class="category-icon">{{ getCategoryIcon(category.name) }}</div>
              <div class="category-name">{{ category.name }}</div>
              <div class="category-count">{{ category.questionCount || 0 }} 题</div>
            </div>
            <div v-if="categories.length === 0" class="empty-text">
              暂无分类
            </div>
          </div>
        </div>
      </el-col>
      
      <el-col :span="8">
        <div class="section">
          <div class="section-header">
            <h2>🔥 热门题目</h2>
          </div>
          <div class="hot-questions">
            <div
              v-for="question in hotQuestions"
              :key="question.id"
              class="hot-question-item"
              @click="$router.push(`/questions/${question.id}`)"
            >
              <div class="question-title">{{ question.title }}</div>
              <div class="question-meta">
                <el-tag size="small" type="info">{{ question.difficulty }}</el-tag>
              </div>
            </div>
            <div v-if="hotQuestions.length === 0" class="empty-text">
              暂无题目
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
    
    <div class="quick-actions">
      <el-button type="primary" size="large" @click="$router.push('/practice')">
        🚀 开始刷题
      </el-button>
      <el-button size="large" @click="$router.push('/wrong')">
        📝 查看错题本
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { categoryApi, questionApi, progressApi } from '@/api'

const router = useRouter()
const userStore = useUserStore()

const categories = ref([])
const hotQuestions = ref([])
const statistics = ref({})

const loadData = async () => {
  try {
    const [categoriesRes, questionsRes, statsRes] = await Promise.all([
      categoryApi.getAll(),
      questionApi.getList({ page: 0, size: 5 }),
      progressApi.getStatistics({ userId: userStore.user.id })
    ])
    
    categories.value = categoriesRes.data || []
    hotQuestions.value = questionsRes.data?.content || []
    statistics.value = statsRes.data || {}
  } catch (error) {
    console.error('加载数据失败', error)
  }
}

const getCategoryIcon = (name) => {
  const icons = {
    'Java': '☕', 'Python': '🐍', 'JavaScript': '🌐', '数据库': '🗄️',
    '算法': '🧮', '网络': '🌍', '操作系统': '💻', '系统设计': '🏗️'
  }
  return icons[name] || '📖'
}

const goToQuestions = (categoryId) => {
  router.push({ path: '/questions', query: { categoryId } })
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.home-container {
  padding-top: 20px;
}

.welcome-section {
  margin-bottom: 32px;
}

.welcome-section h1 {
  font-size: 28px;
  color: #303133;
  margin-bottom: 8px;
}

.welcome-section p {
  color: #909399;
  font-size: 16px;
}

.stats-section {
  margin-bottom: 32px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  font-size: 18px;
  color: #303133;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.category-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  color: #fff;
  cursor: pointer;
  transition: transform 0.3s;
}

.category-card:hover {
  transform: translateY(-4px);
}

.category-icon {
  font-size: 36px;
  margin-bottom: 12px;
}

.category-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.category-count {
  font-size: 14px;
  opacity: 0.8;
}

.hot-questions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hot-question-item {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.hot-question-item:hover {
  background: #ecf5ff;
  transform: translateX(4px);
}

.question-title {
  font-size: 14px;
  color: #303133;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.question-meta {
  display: flex;
  gap: 8px;
}

.empty-text {
  text-align: center;
  color: #909399;
  padding: 40px;
}

.quick-actions {
  text-align: center;
  margin-top: 32px;
}

.quick-actions .el-button {
  margin: 0 12px;
  padding: 16px 32px;
  font-size: 16px;
}
</style>
