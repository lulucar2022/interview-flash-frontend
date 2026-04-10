<template>
  <div class="profile-container page-container">
    <div class="profile-header">
      <div class="avatar-section">
        <div class="avatar">
          {{ userStore.user?.displayName?.[0] || userStore.user?.username?.[0] || 'U' }}
        </div>
        <div class="user-info">
          <h2>{{ userStore.user?.displayName || userStore.user?.username }}</h2>
          <p>{{ userStore.user?.email }}</p>
        </div>
      </div>
    </div>
    
    <el-row :gutter="20">
      <el-col :span="16">
        <div class="profile-card">
          <h3>基本信息</h3>
          <el-form
            ref="formRef"
            :model="profileForm"
            label-width="100px"
          >
            <el-form-item label="用户名">
              <el-input v-model="profileForm.username" disabled />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="profileForm.email" />
            </el-form-item>
            <el-form-item label="显示名称">
              <el-input v-model="profileForm.displayName" />
            </el-form-item>
            <el-form-item label="注册时间">
              <el-input :value="userStore.user?.createdAt" disabled />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleUpdateProfile">
                保存修改
              </el-button>
            </el-form-item>
          </el-form>
        </div>
        
        <div class="profile-card">
          <h3>修改密码</h3>
          <el-form
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="passwordRules"
            label-width="100px"
          >
            <el-form-item label="原密码" prop="oldPassword">
              <el-input v-model="passwordForm.oldPassword" type="password" show-password />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input v-model="passwordForm.newPassword" type="password" show-password />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleChangePassword">
                修改密码
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-col>
      
      <el-col :span="8">
        <div class="profile-card stats-card">
          <h3>学习统计</h3>
          <div class="stats-list">
            <div class="stat-item">
              <span class="stat-label">总题目数</span>
              <span class="stat-value">{{ statistics.totalQuestions || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">已掌握</span>
              <span class="stat-value success">{{ statistics.masteredCount || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">错题数</span>
              <span class="stat-value danger">{{ statistics.wrongCount || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">掌握率</span>
              <span class="stat-value primary">{{ statistics.progressRate || '0.00' }}%</span>
            </div>
          </div>
        </div>
        
        <div class="profile-card">
          <h3>我的收藏</h3>
          <div class="favorites-list">
            <div
              v-for="item in favorites"
              :key="item.id"
              class="favorite-item"
              @click="$router.push(`/practice?questionId=${item.questionId}`)"
            >
              <span class="favorite-title">{{ item.questionTitle }}</span>
              <el-button type="danger" size="small" text @click.stop="removeFavorite(item)">
                移除
              </el-button>
            </div>
            <el-empty v-if="favorites.length === 0" description="暂无收藏" :image-size="60" />
          </div>
        </div>
        
        <div class="profile-card danger-zone">
          <h3>危险区域</h3>
          <el-button type="danger" plain @click="handleLogout">
            退出登录
          </el-button>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { progressApi } from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref()
const passwordFormRef = ref()

const profileForm = reactive({
  username: '',
  email: '',
  displayName: ''
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const statistics = ref({})
const favorites = ref([])

const loadStatistics = async () => {
  try {
    const res = await progressApi.getStatistics({ userId: userStore.user.id })
    statistics.value = res.data || {}
  } catch (error) {
    console.error('加载统计失败', error)
  }
}

const loadFavorites = async () => {
  try {
    const res = await progressApi.getFavorites({ userId: userStore.user.id })
    favorites.value = res.data || []
  } catch (error) {
    console.error('加载收藏失败', error)
  }
}

const handleUpdateProfile = () => {
  userStore.updateUser(profileForm)
  ElMessage.success('个人信息已更新')
}

const handleChangePassword = async () => {
  if (!passwordFormRef.value) return
  
  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      ElMessage.success('密码修改成功')
      passwordForm.oldPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
    }
  })
}

const removeFavorite = async (item) => {
  try {
    await progressApi.updateProgress(
      { userId: userStore.user.id },
      { questionId: item.questionId, isFavorite: false }
    )
    ElMessage.success('已取消收藏')
    loadFavorites()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}

onMounted(() => {
  profileForm.username = userStore.user?.username || ''
  profileForm.email = userStore.user?.email || ''
  profileForm.displayName = userStore.user?.displayName || ''
  
  loadStatistics()
  loadFavorites()
})
</script>

<style scoped>
.profile-container {
  padding-top: 20px;
}

.profile-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 32px;
  margin-bottom: 24px;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 24px;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #fff;
  color: #667eea;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: bold;
}

.user-info h2 {
  color: #fff;
  font-size: 24px;
  margin-bottom: 8px;
}

.user-info p {
  color: rgba(255, 255, 255, 0.8);
}

.profile-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.profile-card h3 {
  font-size: 18px;
  color: #303133;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.stats-card .stats-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.stat-label {
  color: #606266;
}

.stat-value {
  font-weight: bold;
  font-size: 18px;
}

.stat-value.success {
  color: #67C23A;
}

.stat-value.danger {
  color: #F56C6C;
}

.stat-value.primary {
  color: #409EFF;
}

.favorites-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.favorite-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.favorite-item:hover {
  background: #ecf5ff;
}

.favorite-title {
  color: #606266;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.danger-zone {
  border: 1px solid #fde2e2;
}
</style>
