<template>
  <div class="question-detail-container page-container" v-loading="loading">
    <div v-if="question" class="question-detail">
      <div class="question-header">
        <h1>{{ question.title }}</h1>
        <div class="question-meta">
          <el-tag :type="getDifficultyType(question.difficulty)">
            {{ getDifficultyText(question.difficulty) }}
          </el-tag>
          <span class="category">{{ question.categoryName }}</span>
          <span class="time">{{ question.createdAt }}</span>
        </div>
      </div>
      
      <div class="question-content card">
        <h2>题目描述</h2>
        <div class="content-text">{{ question.content }}</div>
      </div>
      
      <div class="answer-section card">
        <div class="answer-header">
          <h2>我的答案</h2>
          <el-input
            v-model="userAnswer"
            type="textarea"
            :rows="6"
            placeholder="请输入你的答案..."
          />
        </div>
        
        <div class="answer-actions">
          <el-button type="primary" size="large" @click="checkAnswer">
            提交答案
          </el-button>
          <el-button size="large" @click="showAnswer = !showAnswer">
            {{ showAnswer ? '隐藏答案' : '查看答案' }}
          </el-button>
        </div>
        
        <div v-if="showAnswer" class="correct-answer">
          <h3>参考答案</h3>
          <div class="answer-text">{{ question.answer }}</div>
        </div>
      </div>
      
      <div class="action-buttons">
        <el-button type="warning" :icon="Star" @click="toggleFavorite">
          {{ isFavorite ? '取消收藏' : '收藏' }}
        </el-button>
        <el-button type="danger" @click="addToWrong">
          加入错题本
        </el-button>
        <el-button @click="$router.push('/practice')">
          返回刷题
        </el-button>
      </div>
    </div>
    
    <el-empty v-else description="题目不存在" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { questionApi, progressApi } from '@/api'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { Star } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const question = ref(null)
const userAnswer = ref('')
const showAnswer = ref(false)
const isFavorite = ref(false)

const loadQuestion = async () => {
  loading.value = true
  try {
    const id = route.params.id || route.query.questionId
    const res = await questionApi.getById(id)
    question.value = res.data
    
    const progressRes = await progressApi.getProgressByQuestion({
      userId: userStore.user.id,
      questionId: id
    })
    isFavorite.value = progressRes.data?.isFavorite || false
  } catch (error) {
    ElMessage.error('加载题目失败')
  } finally {
    loading.value = false
  }
}

const checkAnswer = () => {
  showAnswer.value = true
  ElMessage.success('答案已提交')
}

const toggleFavorite = async () => {
  try {
    await progressApi.updateProgress(
      { userId: userStore.user.id },
      {
        questionId: question.value.id,
        isFavorite: !isFavorite.value
      }
    )
    isFavorite.value = !isFavorite.value
    ElMessage.success(isFavorite.value ? '已收藏' : '已取消收藏')
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const addToWrong = async () => {
  try {
    await progressApi.updateProgress(
      { userId: userStore.user.id },
      {
        questionId: question.value.id,
        isCorrect: false
      }
    )
    ElMessage.success('已加入错题本')
  } catch (error) {
    ElMessage.error('操作失败')
  }
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
  loadQuestion()
})
</script>

<style scoped>
.question-detail-container {
  max-width: 900px;
  margin: 0 auto;
  padding-top: 20px;
}

.question-detail {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.question-header {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #eee;
}

.question-header h1 {
  font-size: 24px;
  color: #303133;
  margin-bottom: 16px;
}

.question-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  color: #909399;
  font-size: 14px;
}

.category {
  background: #ecf5ff;
  color: #409EFF;
  padding: 4px 12px;
  border-radius: 4px;
}

.card {
  margin-bottom: 24px;
}

.card h2 {
  font-size: 18px;
  color: #303133;
  margin-bottom: 16px;
}

.content-text {
  color: #606266;
  line-height: 1.8;
  font-size: 15px;
}

.answer-section {
  background: #f5f7fa;
  padding: 24px;
  border-radius: 8px;
}

.answer-header h2 {
  margin-bottom: 12px;
}

.answer-actions {
  margin-top: 16px;
  display: flex;
  gap: 12px;
}

.correct-answer {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px dashed #ddd;
}

.correct-answer h3 {
  font-size: 16px;
  color: #67C23A;
  margin-bottom: 12px;
}

.answer-text {
  color: #606266;
  line-height: 1.8;
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  white-space: pre-wrap;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>
