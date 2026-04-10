<template>
  <div class="wrong-questions-container page-container">
    <div class="page-header">
      <h1 class="page-title">📝 错题本</h1>
      <el-button type="primary" @click="loadWrongQuestions">
        刷新
      </el-button>
    </div>
    
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-value">{{ wrongQuestions.length }}</span>
        <span class="stat-label">错题总数</span>
      </div>
    </div>
    
    <div class="wrong-list" v-loading="loading">
      <div
        v-for="item in wrongQuestions"
        :key="item.id"
        class="wrong-item"
      >
        <div class="wrong-content">
          <div class="question-header">
            <h3>{{ item.questionTitle }}</h3>
            <el-tag type="danger" size="small">答错</el-tag>
          </div>
          <div class="question-meta">
            <span>复习次数: {{ item.reviewCount }}</span>
            <span v-if="item.lastReviewedAt">
              最后复习: {{ formatDate(item.lastReviewedAt) }}
            </span>
          </div>
        </div>
        <div class="wrong-actions">
          <el-button type="primary" size="small" @click="goToPractice(item.questionId)">
            再做一次
          </el-button>
          <el-button type="success" size="small" @click="markAsCorrect(item)">
            已掌握
          </el-button>
          <el-button type="danger" size="small" plain @click="removeFromWrong(item)">
            移除
          </el-button>
        </div>
      </div>
      
      <el-empty v-if="wrongQuestions.length === 0 && !loading" description="暂无错题，继续保持！" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { progressApi } from '@/api'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const wrongQuestions = ref([])

const loadWrongQuestions = async () => {
  loading.value = true
  try {
    const res = await progressApi.getWrongQuestions({ userId: userStore.user.id })
    wrongQuestions.value = res.data || []
  } catch (error) {
    ElMessage.error('加载错题失败')
  } finally {
    loading.value = false
  }
}

const goToPractice = (questionId) => {
  router.push(`/practice?questionId=${questionId}`)
}

const markAsCorrect = async (item) => {
  try {
    await progressApi.updateProgress(
      { userId: userStore.user.id },
      {
        questionId: item.questionId,
        isCorrect: true,
        status: 'MASTERED'
      }
    )
    ElMessage.success('太棒了！已标记为掌握')
    loadWrongQuestions()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const removeFromWrong = async (item) => {
  try {
    await ElMessageBox.confirm('确定要从错题本移除吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await progressApi.resetProgress({
      userId: userStore.user.id,
      questionId: item.questionId
    })
    ElMessage.success('已移除')
    loadWrongQuestions()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('移除失败')
    }
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

onMounted(() => {
  loadWrongQuestions()
})
</script>

<style scoped>
.wrong-questions-container {
  padding-top: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.stats-row {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  display: flex;
  gap: 32px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #F56C6C;
  display: block;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.wrong-list {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.wrong-item {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.3s;
}

.wrong-item:last-child {
  border-bottom: none;
}

.wrong-item:hover {
  background: #f5f7fa;
}

.wrong-content {
  flex: 1;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.question-header h3 {
  font-size: 16px;
  color: #303133;
}

.question-meta {
  display: flex;
  gap: 16px;
  color: #909399;
  font-size: 14px;
}

.wrong-actions {
  display: flex;
  gap: 8px;
}
</style>
