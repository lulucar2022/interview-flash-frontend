<template>
  <div class="practice-container page-container">
    <div class="practice-header">
      <h1>在线刷题</h1>
      <div class="progress-info">
        <span>进度: {{ currentIndex + 1 }} / {{ questions.length }}</span>
        <el-progress :percentage="progressPercent" :stroke-width="8" style="width: 200px;" />
      </div>
    </div>
    
    <div v-if="currentQuestion" class="practice-content">
      <div class="question-card">
        <div class="question-header">
          <h2>{{ currentQuestion.title }}</h2>
          <div class="question-meta">
            <el-tag :type="getTypeTag(currentQuestion.type)" size="small">
              {{ getTypeText(currentQuestion.type) }}
            </el-tag>
            <el-tag :type="getDifficultyType(currentQuestion.difficulty)" size="small">
              {{ getDifficultyText(currentQuestion.difficulty) }}
            </el-tag>
          </div>
        </div>
        <div class="question-body">
          <p>{{ currentQuestion.content }}</p>
        </div>
      </div>
      
      <div class="answer-card">
        <h3>你的答案</h3>
        
        <!-- 单选题 -->
        <div v-if="currentQuestion.type === 'SINGLE_CHOICE'" class="answer-options">
          <el-radio-group v-model="answers[currentQuestion.id]">
            <el-radio
              v-for="(option, index) in parseOptions(currentQuestion.options)"
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
        <div v-else-if="currentQuestion.type === 'MULTIPLE_CHOICE'" class="answer-options">
          <el-checkbox-group v-model="multiAnswers[currentQuestion.id]">
            <el-checkbox
              v-for="(option, index) in parseOptions(currentQuestion.options)"
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
        <div v-else-if="currentQuestion.type === 'TRUE_FALSE'" class="answer-options">
          <el-radio-group v-model="answers[currentQuestion.id]" class="true-false-group">
            <el-radio label="TRUE" class="tf-option">正确</el-radio>
            <el-radio label="FALSE" class="tf-option">错误</el-radio>
          </el-radio-group>
        </div>
        
        <!-- 填空题 / 简答题 -->
        <div v-else-if="currentQuestion.type === 'FILL_BLANK' || currentQuestion.type === 'SHORT_ANSWER'" class="answer-input">
          <el-input
            v-model="answers[currentQuestion.id]"
            type="textarea"
            :rows="currentQuestion.type === 'SHORT_ANSWER' ? 6 : 3"
            :placeholder="currentQuestion.type === 'FILL_BLANK' ? '请填写答案...' : '请输入你的回答...'"
          />
        </div>
        
        <!-- 编程题 / 情景分析题 -->
        <div v-else-if="currentQuestion.type === 'CODING' || currentQuestion.type === 'SCENARIO'" class="answer-input">
          <el-input
            v-model="answers[currentQuestion.id]"
            type="textarea"
            :rows="8"
            placeholder="请输入你的代码或分析..."
          />
        </div>
        
        <!-- 其他题型默认用文本框 -->
        <div v-else class="answer-input">
          <el-input
            v-model="answers[currentQuestion.id]"
            type="textarea"
            :rows="4"
            placeholder="请输入答案..."
          />
        </div>
        
        <!-- <div class="answer-check">
          <span>回答是否正确：</span>
          <el-radio-group v-model="answerCorrect[currentQuestion.id]">
            <el-radio :label="true">正确</el-radio>
            <el-radio :label="false">错误</el-radio>
          </el-radio-group>
        </div> -->
        
        <div class="answer-actions">
          <el-button @click="previousQuestion" :disabled="currentIndex === 0">
            上一题
          </el-button>
          <el-button type="primary" @click="nextQuestion" v-if="currentIndex < questions.length - 1">
            下一题
          </el-button>
          <el-button type="success" @click="handleSubmitAnswer" v-else>
            提交答案
          </el-button>
        </div>
      </div>
      
      <div class="action-bar">
        <el-button :type="isFavorite ? 'warning' : 'default'" @click="toggleFavorite">
          {{ isFavorite ? '取消收藏' : '收藏' }}
        </el-button>
        <el-button @click="toggleShowAnswer">
          {{ showAnswer ? '隐藏答案' : '查看答案' }}
        </el-button>
      </div>
      
      <div v-if="showAnswer" class="answer-preview">
        <h4>参考答案</h4>
        <div class="answer-content">
          <template v-if="currentQuestion.type === 'SINGLE_CHOICE' || currentQuestion.type === 'MULTIPLE_CHOICE'">
            <div v-for="(opt, idx) in parseOptions(currentQuestion.options)" :key="idx" class="correct-option" :class="{ correct: isCorrectOption(opt.label, currentQuestion.answer) }">
              {{ opt.label }}. {{ opt.content }}
              <el-icon v-if="isCorrectOption(opt.label, currentQuestion.answer)" class="check-icon"><CircleCheckFilled /></el-icon>
            </div>
          </template>
          <template v-else-if="currentQuestion.type === 'TRUE_FALSE'">
            {{ currentQuestion.answer === 'TRUE' ? '正确' : '错误' }}
          </template>
          <template v-else>
            {{ currentQuestion.answer || '暂无参考答案' }}
          </template>
        </div>
      </div>
    </div>
    
    <div v-else class="empty-state">
      <el-empty description="暂无题目，请先选择分类">
        <el-button type="primary" @click="$router.push('/questions')">
          去题库
        </el-button>
      </el-empty>
    </div>
    
    <div class="navigation-bar">
      <el-button @click="previousQuestion" :disabled="currentIndex === 0">
        上一题
      </el-button>
      <div class="question-dots">
        <span
          v-for="(q, index) in questions"
          :key="q.id"
          class="dot"
          :class="{
            active: index === currentIndex,
            correct: results[q.id] === true,
            wrong: results[q.id] === false
          }"
          @click="goToQuestion(index)"
        />
      </div>
      <el-button @click="nextQuestion" :disabled="currentIndex === questions.length - 1">
        下一题
      </el-button>
    </div>

    <el-dialog
      v-model="showResultDialog"
      title="答题结果"
      width="400px"
      :close-on-click-modal="false"
      :show-close="false"
    >
      <div class="result-dialog-content">
        <div class="result-icon" :class="currentResult ? 'correct' : 'wrong'">
          {{ currentResult ? '🎉' : '❌' }}
        </div>
        <div class="result-text">
          {{ currentResult ? '回答正确！' : '回答错误，已加入错题本' }}
        </div>
        <div class="result-stats">
          <span>正确: {{ correctCount }}</span>
          <span>错误: {{ wrongCount }}</span>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="handleNextAfterSubmit" v-if="currentIndex < questions.length - 1">
          下一题
        </el-button>
        <el-button type="success" @click="handleFinish" v-else>
          完成答题
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showFinishDialog"
      title="答题完成"
      width="450px"
      :close-on-click-modal="false"
      :show-close="false"
    >
      <div class="finish-dialog-content">
        <div class="finish-stats">
          <div class="stat-item">
            <span class="stat-value">{{ correctCount }}</span>
            <span class="stat-label">正确</span>
          </div>
          <div class="stat-item">
            <span class="stat-value danger">{{ wrongCount }}</span>
            <span class="stat-label">错误</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ questions.length }}</span>
            <span class="stat-label">总计</span>
          </div>
        </div>
        <div class="finish-rate">
          正确率: {{ Math.round(correctCount / questions.length * 100) }}%
        </div>
      </div>
      <template #footer>
        <el-button @click="$router.push('/')">返回首页</el-button>
        <el-button type="primary" @click="restartPractice">再次练习</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { questionApi, progressApi } from '@/api'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { CircleCheckFilled } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const questions = ref([])
const currentIndex = ref(0)
const answers = ref({})
const multiAnswers = ref({})
const answerCorrect = ref({})
const results = ref({})
const showAnswer = ref(false)
const isFavorite = ref(false)

const showResultDialog = ref(false)
const showFinishDialog = ref(false)
const currentResult = ref(true)

const correctCount = computed(() => Object.values(results.value).filter(r => r === true).length)
const wrongCount = computed(() => Object.values(results.value).filter(r => r === false).length)

const currentQuestion = computed(() => questions.value[currentIndex.value])

const progressPercent = computed(() => {
  if (questions.value.length === 0) return 0
  const answered = Object.keys(results.value).length
  return Math.round((answered / questions.value.length) * 100)
})

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

const loadQuestions = async () => {
  try {
    const res = await questionApi.getList({ page: 0, size: 20 })
    questions.value = res.data?.content || []
    
    if (route.query.questionId) {
      const index = questions.value.findIndex(q => q.id === parseInt(route.query.questionId))
      if (index !== -1) {
        currentIndex.value = index
      }
    }
  } catch (error) {
    ElMessage.error('加载题目失败')
  }
}

const previousQuestion = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
    showAnswer.value = false
  }
}

const nextQuestion = () => {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
    showAnswer.value = false
  }
}

const goToQuestion = (index) => {
  currentIndex.value = index
  showAnswer.value = false
}

const handleSubmitAnswer = async () => {
  const answer = answers.value[currentQuestion.value.id]
  const isCorrect = answerCorrect.value[currentQuestion.value.id]
  
  if (answer === undefined || answer === '' || answer === null) {
    ElMessage.warning('请输入答案后再提交')
    return
  }
  
  if (isCorrect === undefined) {
    ElMessage.warning('请选择回答是否正确')
    return
  }

  try {
    await progressApi.updateProgress(
      { userId: userStore.user.id },
      {
        questionId: currentQuestion.value.id,
        isCorrect: isCorrect
      }
    )
    
    results.value[currentQuestion.value.id] = isCorrect
    currentResult.value = isCorrect
    
    showAnswer.value = true
    showResultDialog.value = true
  } catch (error) {
    console.error('提交答案失败', error)
  }
}

const handleNextAfterSubmit = () => {
  showResultDialog.value = false
  nextQuestion()
}

const handleFinish = () => {
  showResultDialog.value = false
  showFinishDialog.value = true
}

const restartPractice = () => {
  showFinishDialog.value = false
  answers.value = {}
  multiAnswers.value = {}
  answerCorrect.value = {}
  results.value = {}
  currentIndex.value = 0
}

const toggleFavorite = async () => {
  if (!currentQuestion.value) return
  try {
    await progressApi.updateProgress(
      { userId: userStore.user.id },
      {
        questionId: currentQuestion.value.id,
        isFavorite: !isFavorite.value
      }
    )
    isFavorite.value = !isFavorite.value
    ElMessage.success(isFavorite.value ? '已收藏' : '已取消收藏')
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const toggleShowAnswer = () => {
  showAnswer.value = !showAnswer.value
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

const getDifficultyType = (difficulty) => {
  const types = { EASY: 'success', MEDIUM: 'warning', HARD: 'danger' }
  return types[difficulty] || 'info'
}

const getDifficultyText = (difficulty) => {
  const texts = { EASY: '简单', MEDIUM: '中等', HARD: '困难' }
  return texts[difficulty] || difficulty
}

watch(currentQuestion, async (newQ) => {
  if (newQ) {
    try {
      const res = await progressApi.getProgressByQuestion({
        userId: userStore.user.id,
        questionId: newQ.id
      })
      isFavorite.value = res.data?.isFavorite || false
    } catch (error) {
      isFavorite.value = false
    }
  }
})

onMounted(() => {
  loadQuestions()
})
</script>

<style scoped>
.practice-container {
  max-width: 900px;
  margin: 0 auto;
  padding-top: 20px;
}

.practice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.practice-header h1 {
  font-size: 24px;
  color: var(--color-text-primary);
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 16px;
  color: var(--color-text-secondary);
}

.practice-content {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 32px;
  box-shadow: 0 0 0 1px var(--color-ring);
  margin-bottom: 24px;
}

.question-card {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--color-border);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.question-header h2 {
  font-size: 20px;
  color: var(--color-text-primary);
  flex: 1;
}

.question-meta {
  display: flex;
  gap: 8px;
}

.question-body p {
  color: var(--color-text-secondary);
  line-height: 1.8;
  font-size: 15px;
}

.answer-card h3 {
  font-size: 16px;
  color: var(--color-text-primary);
  margin-bottom: 16px;
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
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  transition: all 0.2s;
}

.option-item:hover {
  border-color: var(--color-interactive);
  background: #f8f9ff;
}

.option-item.is-checked {
  border-color: var(--color-interactive);
  background: #f0f5ff;
}

.option-label {
  font-weight: 600;
  margin-right: 8px;
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
  padding: 16px 32px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.tf-option:hover {
  border-color: var(--color-interactive);
}

.answer-input {
  margin-bottom: 20px;
}

.answer-check {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0;
  padding: 12px 16px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
}

.answer-check span {
  color: var(--color-text-secondary);
}

.answer-actions {
  margin-top: 16px;
  display: flex;
  justify-content: center;
  gap: 12px;
}

.action-bar {
  margin-top: 24px;
  display: flex;
  justify-content: center;
  gap: 12px;
}

.answer-preview {
  margin-top: 24px;
  padding: 16px;
  background: #f0f9eb;
  border-radius: var(--radius-sm);
}

.answer-preview h4 {
  color: var(--color-success);
  margin-bottom: 12px;
}

.answer-content {
  color: var(--color-text-secondary);
  line-height: 1.8;
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
  color: var(--color-success);
  font-weight: 600;
}

.check-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
}

.navigation-bar {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 0 0 1px var(--color-ring);
}

.question-dots {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  max-width: 500px;
  justify-content: center;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-border);
  cursor: pointer;
  transition: all 0.3s;
}

.dot:hover {
  background: var(--color-interactive);
}

.dot.active {
  background: var(--color-interactive);
  transform: scale(1.2);
}

.dot.correct {
  background: var(--color-success);
}

.dot.wrong {
  background: #F56C6C;
}

.empty-state {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: 60px;
  text-align: center;
}

.result-dialog-content {
  text-align: center;
  padding: 20px 0;
}

.result-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.result-icon.correct {
  color: var(--color-success);
}

.result-icon.wrong {
  color: #F56C6C;
}

.result-text {
  font-size: 18px;
  color: var(--color-text-primary);
  margin-bottom: 16px;
}

.result-stats {
  display: flex;
  justify-content: center;
  gap: 24px;
  color: var(--color-text-secondary);
}

.finish-dialog-content {
  text-align: center;
  padding: 20px 0;
}

.finish-stats {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 24px;
}

.finish-stats .stat-item {
  text-align: center;
}

.finish-stats .stat-value {
  display: block;
  font-size: 36px;
  font-weight: bold;
  color: var(--color-success);
}

.finish-stats .stat-value.danger {
  color: #F56C6C;
}

.finish-stats .stat-label {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.finish-rate {
  font-size: 20px;
  color: var(--color-text-primary);
  font-weight: 600;
}
</style>
