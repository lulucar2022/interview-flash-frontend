<template>
  <div class="home-container page-container" v-loading="loading">
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
        <div class="welcome-divider"></div>
        <div class="welcome-stat-item welcome-stat-streak">
          <span class="welcome-stat-value">🔥 {{ streakDays }}</span>
          <span class="welcome-stat-label">连续学习</span>
        </div>
      </div>
    </div>
    
    <el-row :gutter="20" class="quick-actions">
      <el-col :span="12">
        <div class="action-card action-primary" v-tilt @click="$router.push('/practice')">
          <div class="action-icon">🚀</div>
          <div class="action-info">
            <div class="action-title">开始刷题</div>
            <div class="action-desc">随机题目 · 智能排序</div>
          </div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="action-card action-secondary" v-tilt @click="$router.push('/wrong')">
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
        <el-col :xs="24" :sm="12" :md="8">
          <div class="stat-card" v-tilt>
            <div class="stat-icon" style="background: var(--color-interactive);">📚</div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.totalQuestions || 0 }}</div>
              <div class="stat-label">总题目数</div>
            </div>
            <el-progress :percentage="100" :stroke-width="4" color="var(--color-interactive)" class="stat-bar" />
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <div class="stat-card" v-tilt>
            <div class="stat-icon" style="background: var(--color-success);">✅</div>
            <div class="stat-info">
              <div class="stat-value">{{ Math.round(parseFloat(statistics.progressRate || 0)) }}%</div>
              <div class="stat-label">掌握率</div>
            </div>
            <el-progress :percentage="Math.round(parseFloat(statistics.progressRate || 0))" :stroke-width="4" color="var(--color-success)" class="stat-bar" />
          </div>
        </el-col>
        <el-col :xs="24" :sm="24" :md="8">
          <div class="stat-card" v-tilt>
            <div class="stat-icon" style="background: var(--color-danger);">❌</div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.wrongCount || 0 }}</div>
              <div class="stat-label">错题数</div>
            </div>
            <el-progress
              :percentage="statistics.totalQuestions ? Math.round((statistics.wrongCount || 0) / statistics.totalQuestions * 100) : 0"
              :stroke-width="4"
              color="var(--color-danger)"
              class="stat-bar"
            />
          </div>
        </el-col>
      </el-row>
    </div>
    
    <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :md="16">
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
      
      <el-col :xs="24" :sm="24" :md="8">
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
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useQuestionHelpers } from '@/composables/useQuestionHelpers'
import { categoryApi, questionApi, progressApi, statisticsApi } from '@/api'

const router = useRouter()
const userStore = useUserStore()
const { getTypeText, getTypeTag, getDifficultyText } = useQuestionHelpers()

const categories = ref([])
const hotQuestions = ref([])
const statistics = ref({})
const streakDays = ref(0)
const loading = ref(true)

const loadData = async () => {
  loading.value = true
  try {
    const [categoriesRes, hotRes, statsRes, totalRes, streakRes] = await Promise.all([
      categoryApi.getAll(),
      questionApi.getHot({ size: 5 }),
      progressApi.getStatistics(),
      questionApi.getCount(),
      statisticsApi.getStreak()
    ])
    
    categories.value = categoriesRes.data || []
    hotQuestions.value = hotRes.data || []
    statistics.value = statsRes.data || {}
    statistics.value.totalQuestions = totalRes.data || 0
    streakDays.value = streakRes.data?.currentStreak || 0
  } catch (error) {
    console.error('加载数据失败', error)
    ElMessage.error('加载数据失败，请稍后重试')
  } finally {
    loading.value = false
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
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.welcome-text h1 {
  font-size: 26px;
  color: var(--color-text-primary);
  margin-bottom: 6px;
}

.welcome-subtitle {
  color: var(--color-text-secondary);
  font-size: 15px;
  margin: 0;
}

.welcome-stats {
  display: flex;
  align-items: center;
  gap: 24px;
  background: var(--color-surface);
  padding: 16px 28px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}

.welcome-stat-item {
  text-align: center;
}

.welcome-stat-value {
  display: block;
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.2;
}

.welcome-stat-label {
  font-size: var(--font-xs);
  color: var(--color-text-secondary);
  margin-top: 2px;
}

.welcome-divider {
  width: 1px;
  height: 36px;
  background: var(--color-border);
}

.welcome-stat-streak .welcome-stat-value {
  color: var(--color-warning);
}

.quick-actions {
  margin-bottom: 28px;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-slow);
}

.action-card:hover {
  transform: translateY(-2px);
}

.action-primary {
  background: var(--gradient-primary);
  color: var(--color-text-on-primary);
  box-shadow: 0 4px 16px rgba(91, 118, 254, 0.3);
}

.action-primary:hover {
  box-shadow: 0 6px 24px rgba(91, 118, 254, 0.4);
}

.action-secondary {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  box-shadow: var(--shadow-sm);
}

.action-secondary:hover {
  background: var(--el-color-primary-light-9);
  box-shadow: var(--shadow-lg);
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
  font-size: var(--font-sm);
  opacity: 0.8;
}

.stats-section {
  margin-bottom: 28px;
}

.stat-card {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: 18px 20px;
  box-shadow: var(--shadow-md);
  position: relative;
  margin-bottom: var(--spacing-sm);
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
  color: var(--color-text-primary);
}

.stat-label {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  margin-top: 2px;
}

.stat-bar {
  margin-top: 10px;
}

.section {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: 24px;
  box-shadow: var(--shadow-md);
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  font-size: var(--font-lg);
  color: var(--color-text-primary);
  margin: 0;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 14px;
}

.category-card {
  background: var(--gradient-primary);
  border-radius: var(--radius-md);
  padding: 18px 16px;
  text-align: center;
  color: var(--color-text-on-primary);
  cursor: pointer;
  transition: var(--transition-slow);
}

.category-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(91, 118, 254, 0.4);
}

.category-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.category-name {
  font-size: var(--font-md);
  font-weight: 600;
  margin-bottom: 6px;
}

.category-count {
  font-size: var(--font-sm);
  opacity: 0.85;
}

.hot-questions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hot-question-item {
  padding: 14px 16px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-slow);
}

.hot-question-item:hover {
  background: var(--el-color-primary-light-9);
  transform: translateX(4px);
}

.hot-question-top {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}

.question-title {
  font-size: var(--font-base);
  color: var(--color-text-primary);
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
  font-size: var(--font-xs);
  color: var(--color-text-secondary);
}

.empty-text {
  text-align: center;
  color: var(--color-text-secondary);
  padding: 40px;
}

@media (max-width: 768px) {
  .welcome-section {
    flex-direction: column;
    align-items: flex-start;
  }

  .welcome-stats {
    width: 100%;
    justify-content: space-between;
    padding: 12px 16px;
    gap: 12px;
  }

  .welcome-stat-value {
    font-size: 18px;
  }

  .category-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
