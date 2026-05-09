<template>
  <div class="home-container page-container">
    <div class="welcome-section">
      <div class="welcome-text">
        <h1>欢迎回来，{{ userStore.user?.displayName || userStore.user?.username }} 👋</h1>
        <p class="welcome-subtitle">开始今天的刷题之旅吧！</p>
      </div>
      <div class="welcome-stats">
        <div class="welcome-stat-item">
          <span class="welcome-stat-value">{{ statistics.masteredCount || 0 }}</span>
          <span class="welcome-stat-label">已掌握</span>
        </div>
        <div class="welcome-divider"></div>
        <div class="welcome-stat-item">
          <span class="welcome-stat-value">{{ statistics.wrongCount || 0 }}</span>
          <span class="welcome-stat-label">待复习</span>
        </div>
        <div class="welcome-divider"></div>
        <div class="welcome-stat-item">
          <span class="welcome-stat-value">{{ statistics.progressRate || '0.00' }}%</span>
          <span class="welcome-stat-label">掌握率</span>
        </div>
      </div>
    </div>
    
    <el-row :gutter="20" class="quick-actions">
      <el-col :span="12">
        <div class="action-card action-primary" @click="$router.push('/practice')">
          <div class="action-icon">🚀</div>
          <div class="action-info">
            <div class="action-title">开始刷题</div>
            <div class="action-desc">随机题目 · 智能排序</div>
          </div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="action-card action-secondary" @click="$router.push('/wrong')">
          <div class="action-icon">📝</div>
          <div class="action-info">
            <div class="action-title">查看错题本</div>
            <div class="action-desc">{{ statistics.wrongCount || 0 }} 道题待复习</div>
          </div>
        </div>
      </el-col>
    </el-row>
    
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :span="8">
          <div class="stat-card">
            <div class="stat-icon" style="background: #409EFF;">📚</div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.totalQuestions || 0 }}</div>
              <div class="stat-label">总题目数</div>
            </div>
            <el-progress :percentage="100" :stroke-width="4" color="#409EFF" class="stat-bar" />
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-card">
            <div class="stat-icon" style="background: #67C23A;">✅</div>
            <div class="stat-info">
              <div class="stat-value">{{ Math.round(parseFloat(statistics.progressRate || 0)) }}%</div>
              <div class="stat-label">掌握率</div>
            </div>
            <el-progress :percentage="Math.round(parseFloat(statistics.progressRate || 0))" :stroke-width="4" color="#67C23A" class="stat-bar" />
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-card">
            <div class="stat-icon" style="background: #F56C6C;">❌</div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.wrongCount || 0 }}</div>
              <div class="stat-label">错题数</div>
            </div>
            <el-progress
              :percentage="statistics.totalQuestions ? Math.round((statistics.wrongCount || 0) / statistics.totalQuestions * 100) : 0"
              :stroke-width="4"
              color="#F56C6C"
              class="stat-bar"
            />
          </div>
        </el-col>
      </el-row>
    </div>
    
    <el-row :gutter="20">
      <el-col :span="16">
        <div class="section">
          <div class="section-header">
            <h2>📚 全部分类</h2>
            <el-button type="primary" text @click="$router.push('/questions')">查看全部 →</el-button>
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
              <div class="category-count">{{ category.questionCount || 0 }} 道题</div>
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
              <div class="hot-question-top">
                <el-tag :type="getTypeTag(question.type)" size="small">{{ getTypeText(question.type) }}</el-tag>
                <el-tag size="small" type="info">{{ getDifficultyText(question.difficulty) }}</el-tag>
              </div>
              <div class="question-title">{{ question.title }}</div>
              <div class="question-meta">
                <span class="hot-category">{{ question.categoryName }}</span>
              </div>
            </div>
            <div v-if="hotQuestions.length === 0" class="empty-text">
              暂无热门题目
            </div>
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

const getTypeText = (type) => {
  const texts = {
    SINGLE_CHOICE: '单选', MULTIPLE_CHOICE: '多选', TRUE_FALSE: '判断',
    FILL_BLANK: '填空', SHORT_ANSWER: '简答', CODING: '编程', SCENARIO: '情景'
  }
  return texts[type] || type
}

const getTypeTag = (type) => {
  const tags = {
    SINGLE_CHOICE: 'primary', MULTIPLE_CHOICE: 'success', TRUE_FALSE: 'warning',
    FILL_BLANK: 'info', SHORT_ANSWER: 'info', CODING: 'danger', SCENARIO: 'danger'
  }
  return tags[type] || 'info'
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
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.welcome-text h1 {
  font-size: 26px;
  color: #303133;
  margin-bottom: 6px;
}

.welcome-subtitle {
  color: #909399;
  font-size: 15px;
  margin: 0;
}

.welcome-stats {
  display: flex;
  align-items: center;
  gap: 24px;
  background: #fff;
  padding: 16px 28px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.welcome-stat-item {
  text-align: center;
}

.welcome-stat-value {
  display: block;
  font-size: 22px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}

.welcome-stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.welcome-divider {
  width: 1px;
  height: 36px;
  background: #e4e7ed;
}

.quick-actions {
  margin-bottom: 28px;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
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
  font-size: 32px;
  flex-shrink: 0;
}

.action-title {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 2px;
}

.action-desc {
  font-size: 13px;
  opacity: 0.8;
}

.stats-section {
  margin-bottom: 28px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 18px 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  position: relative;
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 2px;
}

.stat-bar {
  margin-top: 10px;
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
  margin: 0;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.category-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 18px 16px;
  text-align: center;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s;
}

.category-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}

.category-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.category-name {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 6px;
}

.category-count {
  font-size: 13px;
  opacity: 0.85;
}

.hot-questions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hot-question-item {
  padding: 14px 16px;
  background: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.hot-question-item:hover {
  background: #ecf5ff;
  transform: translateX(4px);
}

.hot-question-top {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}

.question-title {
  font-size: 14px;
  color: #303133;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.question-meta {
  display: flex;
  gap: 8px;
}

.hot-category {
  font-size: 12px;
  color: #909399;
}

.empty-text {
  text-align: center;
  color: #909399;
  padding: 40px;
}
</style>
