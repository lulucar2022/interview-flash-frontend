<template>
  <div class="question-detail-container page-container" v-loading="loading">
    <div v-if="question" class="question-detail">
      <div class="question-header">
        <h1>{{ question.title }}</h1>
        <div class="question-meta">
          <el-tag :type="getTypeTag(question.type)" size="small">
            {{ getTypeText(question.type) }}
          </el-tag>
          <el-tag :type="getDifficultyType(question.difficulty)" size="small">
            {{ getDifficultyText(question.difficulty) }}
          </el-tag>
          <span class="category">{{ question.categoryName }}</span>
        </div>
      </div>
      
      <div class="question-content card" v-tilt>
        <h2>题目描述</h2>
        <div class="content-text">{{ question.content }}</div>
      </div>
      
      <div class="answer-section card" v-tilt>
        <div class="answer-header">
          <h2>我的答案</h2>
        </div>
        
        <!-- 单选题 -->
        <div v-if="question.type === 'SINGLE_CHOICE'" class="answer-options">
          <el-radio-group v-model="userAnswer">
            <el-radio
              v-for="(option, index) in parseOptions(question.options)"
              :key="index"
              :label="option.label"
              class="option-item"
            >
              <span class="option-label">{{ option.label }}.</span>
              <span class="option-content">{{ option.content }}</span>
            </el-radio>
          </el-radio-group>
        </div>
        
        <!-- 多选题 -->
        <div v-else-if="question.type === 'MULTIPLE_CHOICE'" class="answer-options">
          <el-checkbox-group v-model="multiAnswers">
            <el-checkbox
              v-for="(option, index) in parseOptions(question.options)"
              :key="index"
              :label="option.label"
              class="option-item"
            >
              <span class="option-label">{{ option.label }}.</span>
              <span class="option-content">{{ option.content }}</span>
            </el-checkbox>
          </el-checkbox-group>
        </div>
        
        <!-- 判断题 -->
        <div v-else-if="question.type === 'TRUE_FALSE'" class="answer-options">
          <el-radio-group v-model="userAnswer" class="true-false-group">
            <el-radio label="TRUE" class="tf-option">正确</el-radio>
            <el-radio label="FALSE" class="tf-option">错误</el-radio>
          </el-radio-group>
        </div>
        
        <!-- 填空题 / 简答题 -->
        <div v-else-if="question.type === 'FILL_BLANK' || question.type === 'SHORT_ANSWER'" class="answer-input">
          <el-input
            v-model="userAnswer"
            type="textarea"
            :rows="question.type === 'SHORT_ANSWER' ? 6 : 3"
            :placeholder="question.type === 'FILL_BLANK' ? '请填写答案...' : '请输入你的回答...'"
          />
        </div>
        
        <!-- 编程题 / 情景分析题 -->
        <div v-else-if="question.type === 'CODING' || question.type === 'SCENARIO'" class="answer-input">
          <el-input
            v-model="userAnswer"
            type="textarea"
            :rows="8"
            placeholder="请输入你的代码或分析..."
          />
        </div>
        
        <!-- 其他题型默认用文本框 -->
        <div v-else class="answer-input">
          <el-input
            v-model="userAnswer"
            type="textarea"
            :rows="4"
            placeholder="请输入答案..."
          />
        </div>
        
        <div class="answer-actions">
          <el-button type="primary" size="large" @click="handleSubmitAnswer">
            提交答案
          </el-button>
          <el-button size="large" @click="toggleShowAnswer">
            {{ showAnswer ? '隐藏答案' : '查看答案' }}
          </el-button>
        </div>
        
        <div v-if="showAnswer" class="correct-answer">
          <h3>参考答案</h3>
          <div class="answer-text">
            <template v-if="question.type === 'SINGLE_CHOICE' || question.type === 'MULTIPLE_CHOICE'">
              <div v-for="(opt, idx) in parseOptions(question.options)" :key="idx" class="correct-option" :class="{ correct: isCorrectOption(opt.label, question.answer) }">
                {{ opt.label }}. {{ opt.content }}
                <el-icon v-if="isCorrectOption(opt.label, question.answer)" class="check-icon"><CircleCheckFilled /></el-icon>
              </div>
            </template>
            <template v-else-if="question.type === 'TRUE_FALSE'">
              {{ question.answer === 'TRUE' ? '正确' : '错误' }}
            </template>
            <template v-else>
              {{ question.answer || '暂无参考答案' }}
            </template>
          </div>
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
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { questionApi, progressApi, wrongApi } from '@/api'
import { useUserStore } from '@/stores/user'
import { useQuestionHelpers } from '@/composables/useQuestionHelpers'
import { ElMessage } from 'element-plus'
import { Star } from '@element-plus/icons-vue'
import { CircleCheckFilled } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { getTypeText, getTypeTag, getDifficultyText, getDifficultyType } = useQuestionHelpers()

const loading = ref(false)
const question = ref(null)
const userAnswer = ref('')
const multiAnswers = ref([])
const showAnswer = ref(false)
const isFavorite = ref(false)

const loadQuestion = async () => {
  loading.value = true
  try {
    const id = route.params.id || route.query.questionId
    const res = await questionApi.getById(id)
    question.value = res.data
    
    const progressRes = await progressApi.getProgressByQuestion(id)
    isFavorite.value = progressRes.data?.isFavorite || false
  } catch (error) {
    ElMessage.error('加载题目失败')
  } finally {
    loading.value = false
  }
}

const handleSubmitAnswer = async () => {
  let answer = userAnswer.value
  if (question.value.type === 'MULTIPLE_CHOICE') {
    answer = multiAnswers.value.join(',')
  }
  
  const isCorrect = checkAnswerCorrect(answer, question.value.answer, question.value.type)
  
  try {
    await wrongApi.recordAnswer({
      questionId: question.value.id,
      userAnswer: answer,
      isCorrect: isCorrect
    })
    ElMessage.success(isCorrect ? '回答正确！' : '回答错误，已加入错题本')
  } catch (error) {
    ElMessage.warning('答案已提交')
  }
  
  showAnswer.value = true
}

const checkAnswerCorrect = (userAnswer, correctAnswer, type) => {
  if (type === 'MULTIPLE_CHOICE') {
    const userSet = new Set(userAnswer.split(',').map(a => a.trim()).filter(Boolean))
    const correctSet = new Set(correctAnswer.split(',').map(a => a.trim()).filter(Boolean))
    return userSet.size === correctSet.size && [...userSet].every(a => correctSet.has(a))
  }
  if (type === 'TRUE_FALSE') {
    return userAnswer === correctAnswer
  }
  if (type === 'SINGLE_CHOICE') {
    return userAnswer === correctAnswer
  }
  return userAnswer?.trim() === correctAnswer?.trim()
}

const parseOptions = (optionsStr) => {
  if (!optionsStr) return []
  try {
    return JSON.parse(optionsStr)
  } catch {
    return []
  }
}

const isCorrectOption = (label, answer) => {
  if (!answer) return false
  const answers = answer.split(',').map(a => a.trim())
  return answers.includes(label)
}

const toggleShowAnswer = () => {
  showAnswer.value = !showAnswer.value
}

const toggleFavorite = async () => {
  try {
    await progressApi.updateProgress(
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
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: 32px;
  box-shadow: var(--shadow-md);
}

.question-header {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--color-border);
}

.question-header h1 {
  font-size: var(--font-2xl);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.question-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  color: var(--color-text-secondary);
  font-size: var(--font-base);
}

.category {
  background: var(--el-color-primary-light-9);
  color: var(--color-interactive);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--spacing-xs);
}

.card {
  margin-bottom: 24px;
}

.card h2 {
  font-size: var(--font-lg);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.content-text {
  color: var(--color-text-secondary);
  line-height: 1.8;
  font-size: var(--font-md);
}

.answer-section {
  background: var(--color-bg-secondary);
  padding: 24px;
  border-radius: var(--radius-sm);
}

.answer-header h2 {
  margin-bottom: var(--spacing-md);
}

.answer-options {
  margin-bottom: 20px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  width: 100%;
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--spacing-xs);
  transition: var(--transition-base);
}

.option-item:hover {
  border-color: var(--color-interactive);
  background: var(--el-color-primary-light-9);
}

.option-label {
  font-weight: 600;
  margin-right: var(--spacing-sm);
  color: var(--color-interactive);
}

.option-content {
  color: var(--color-text-primary);
}

.true-false-group {
  display: flex;
  gap: 24px;
}

.tf-option {
  padding: var(--spacing-md) 32px;
  border: 1px solid var(--color-border);
  border-radius: var(--spacing-xs);
}

.tf-option:hover {
  border-color: var(--color-interactive);
}

.answer-input {
  margin-bottom: 20px;
}

.answer-actions {
  margin-top: var(--spacing-md);
  display: flex;
  gap: var(--spacing-md);
}

.correct-answer {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px dashed var(--color-border);
}

.correct-answer h3 {
  font-size: 16px;
  color: var(--color-success);
  margin-bottom: var(--spacing-md);
}

.answer-text {
  color: var(--color-text-secondary);
  line-height: 1.8;
  background: var(--color-surface);
  padding: var(--spacing-md);
  border-radius: var(--radius-sm);
  white-space: pre-wrap;
}

.correct-option {
  padding: var(--spacing-sm) var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  background: var(--color-surface);
  border-radius: var(--spacing-xs);
  position: relative;
}

.correct-option.correct {
  color: var(--color-success);
  font-weight: 600;
}

.check-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
}
</style>
