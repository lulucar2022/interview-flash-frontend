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
      
      <div class="question-content card">
        <h2>题目描述</h2>
        <div class="content-text">{{ question.content }}</div>
      </div>
      
      <div class="answer-section card">
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
import { ElMessage } from 'element-plus'
import { Star } from '@element-plus/icons-vue'
import { CircleCheckFilled } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

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

const handleSubmitAnswer = async () => {
  let answer = userAnswer.value
  if (question.value.type === 'MULTIPLE_CHOICE') {
    answer = multiAnswers.value.join(',')
  }
  
  const isCorrect = checkAnswerCorrect(answer, question.value.answer, question.value.type)
  
  try {
    await wrongApi.recordAnswer({
      userId: userStore.user.id,
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
  const types = { EASY: 'success', MEDIUM: 'warning', HARD: 'danger' }
  return types[difficulty] || 'info'
}

const getDifficultyText = (difficulty) => {
  const texts = { EASY: '简单', MEDIUM: '中等', HARD: '困难' }
  return texts[difficulty] || difficulty
}

const getTypeText = (type) => {
  const texts = {
    SINGLE_CHOICE: '单选题',
    MULTIPLE_CHOICE: '多选题',
    TRUE_FALSE: '判断题',
    FILL_BLANK: '填空题',
    SHORT_ANSWER: '简答题',
    CODING: '编程题',
    SCENARIO: '情景分析题'
  }
  return texts[type] || type
}

const getTypeTag = (type) => {
  const tags = {
    SINGLE_CHOICE: 'primary',
    MULTIPLE_CHOICE: 'success',
    TRUE_FALSE: 'warning',
    FILL_BLANK: 'info',
    SHORT_ANSWER: 'info',
    CODING: 'danger',
    SCENARIO: 'danger'
  }
  return tags[type] || 'info'
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

.answer-options {
  margin-bottom: 20px;
}

.option-item {
  display: flex;
  align-items: flex-start;
  width: 100%;
  padding: 12px 16px;
  margin-bottom: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  transition: all 0.2s;
}

.option-item:hover {
  border-color: #409EFF;
  background: #f8f9ff;
}

.option-label {
  font-weight: 600;
  margin-right: 8px;
  color: #409EFF;
}

.option-content {
  color: #303133;
}

.true-false-group {
  display: flex;
  gap: 24px;
}

.tf-option {
  padding: 16px 32px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.tf-option:hover {
  border-color: #409EFF;
}

.answer-input {
  margin-bottom: 20px;
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

.correct-option {
  padding: 8px 12px;
  margin-bottom: 8px;
  background: #fff;
  border-radius: 4px;
  position: relative;
}

.correct-option.correct {
  color: #67C23A;
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
  gap: 12px;
  justify-content: center;
}
</style>
