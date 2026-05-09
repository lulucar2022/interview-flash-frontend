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
                <el-tag size="small" type="info">{{ getDifficultyText(question.difficulty) }}</el-tag>
              </div>
            </div>
            <div v-if="hotQuestions.length === 0" class="empty-text">
              暂无题目
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="quick-actions">
      <el-col :span="12">
        <div class="action-card action-primary" @click="$router.push('/practice')">
          <div class="action-icon">🚀</div>
          <div class="action-info">
            <div class="action-title">开始刷题</div>
            <div class="action-desc">随机题目 + 智能排序</div>
          </div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="action-card action-secondary" @click="$router.push('/wrong')">
          <div class="action-icon">📝</div>
          <div class="action-info">
            <div class="action-title">查看错题本</div>
            <div class="action-desc">重温错题，查漏补缺</div>
          </div>
        </div>
      </el-col>
    </el-row>
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
    const [categoriesRes, hotRes, statsRes, totalRes] = await Promise.all([
      categoryApi.getAll(),
      questionApi.getHot({ size: 5 }),
      progressApi.getStatistics({ userId: userStore.user.id }),
      questionApi.getCount()
    ])
    
    categories.value = categoriesRes.data || []
    hotQuestions.value = hotRes.data || []
    statistics.value = statsRes.data || {}
    statistics.value.totalQuestions = totalRes.data || 0
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

const getDifficultyText = (difficulty) => {
  const texts = { EASY: '简单', MEDIUM: '中等', HARD: '困难' }
  return texts[difficulty] || difficulty
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
  margin-top: 32px;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.action-card:hover {
  transform: translateY(-2px);
}

.action-primary {
  background: linear-gradient(135deg, #409EFF, #337ecc);
  color: #fff;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
}

.action-primary:hover {
  box-shadow: 0 6px 24px rgba(64, 158, 255, 0.4);
}

.action-secondary {
  background: #f5f7fa;
  color: #303133;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.action-secondary:hover {
  background: #ecf5ff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.action-icon {
  font-size: 36px;
  flex-shrink: 0;
}

.action-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.action-desc {
  font-size: 13px;
  opacity: 0.8;
}
</style>
