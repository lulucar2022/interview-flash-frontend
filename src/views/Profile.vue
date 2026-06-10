<template>
  <div class="profile-container page-container" v-loading="loading">
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
      <el-col :xs="24" :sm="24" :md="16">
        <div class="profile-card" v-tilt>
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
        
        <div class="profile-card" v-tilt>
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

        <div class="profile-card" v-tilt>
          <h3>我的文章</h3>
          <div class="my-articles-list">
            <div
              v-for="item in myArticles"
              :key="item.id"
              class="my-article-item"
              @click="$router.push(`/articles/${item.id}`)"
            >
              <span class="article-title">{{ item.title }}</span>
              <span class="article-date">{{ formatDate(item.updatedAt || item.createdAt) }}</span>
            </div>
            <el-empty v-if="myArticles.length === 0" description="暂无文章" :image-size="60" />
          </div>
        </div>
      </el-col>
      
      <el-col :xs="24" :sm="24" :md="8">
        <div class="profile-card stats-card" v-tilt>
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
      
      <div class="profile-card" v-tilt>
        <h3>社交</h3>
        <div class="social-tabs">
          <span
            class="social-tab"
            :class="{ active: socialTab === 'followers' }"
            @click="switchSocialTab('followers')"
          >粉丝 {{ followerCount }}</span>
          <span
            class="social-tab"
            :class="{ active: socialTab === 'following' }"
            @click="switchSocialTab('following')"
          >关注 {{ followingCount }}</span>
        </div>
        <div class="social-list">
          <div
            v-for="item in socialList"
            :key="item.id"
            class="social-item"
            @click="$router.push('/author/' + item.id)"
          >
            <el-avatar :size="32" :src="item.avatarUrl">
              {{ (item.nickname || 'U')[0] }}
            </el-avatar>
            <div class="social-item-text">
              <span class="social-item-name">{{ item.nickname }}</span>
              <span v-if="item.mutual" class="mutual-tag">互相关注</span>
            </div>
          </div>
          <el-empty v-if="socialList.length === 0" description="暂无数据" :image-size="50" />
        </div>
      </div>
      
      <div class="profile-card" v-tilt>
        <h3>我的收藏</h3>
        <div class="favorites-tabs">
          <span
            class="fav-tab"
            :class="{ active: favoriteTab === 'questions' }"
            @click="switchFavoriteTab('questions')"
          >题目</span>
          <span
            class="fav-tab"
            :class="{ active: favoriteTab === 'articles' }"
            @click="switchFavoriteTab('articles')"
          >文章</span>
        </div>
        <div v-if="favoriteTab === 'questions'">
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
        <div v-else>
          <div class="favorites-list">
            <div
              v-for="item in articleBookmarks"
              :key="item.id"
              class="favorite-item"
              @click="$router.push(`/articles/${item.article?.id}`)"
            >
              <span class="favorite-title">{{ item.article?.title }}</span>
              <span class="favorite-date">{{ formatDate(item.createdAt) }}</span>
            </div>
            <el-empty v-if="articleBookmarks.length === 0" description="暂无文章收藏" :image-size="60" />
          </div>
        </div>
      </div>
        
        <div class="profile-card" v-tilt>
        <h3>黑名单</h3>
        <div class="block-list">
          <div
            v-for="item in blockedUsers"
            :key="item.id"
            class="block-item"
          >
            <el-avatar :size="28" :src="item.avatarUrl">
              {{ (item.nickname || 'U')[0] }}
            </el-avatar>
            <span class="block-item-name">{{ item.nickname }}</span>
            <el-button type="primary" size="small" text @click="handleUnblock(item)">
              解除
            </el-button>
          </div>
          <el-empty v-if="blockedUsers.length === 0" description="暂无拉黑" :image-size="50" />
        </div>
      </div>
        
        <div class="profile-card danger-zone" v-tilt>
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
import { progressApi, authApi, articleApi, followApi, bookmarkApi, blockApi } from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref()
const passwordFormRef = ref()
const loading = ref(true)

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
const myArticles = ref([])
const socialTab = ref('followers')
const socialList = ref([])
const followerCount = ref(0)
const followingCount = ref(0)
const favoriteTab = ref('questions')
const articleBookmarks = ref([])
const blockedUsers = ref([])

const loadStatistics = async () => {
  try {
    const res = await progressApi.getStatistics()
    statistics.value = res.data || {}
  } catch (error) {
    console.error('加载统计失败', error)
  }
}

const loadFavorites = async () => {
  try {
    const res = await progressApi.getFavorites()
    favorites.value = res.data || []
  } catch (error) {
    console.error('加载收藏失败', error)
  }
}

const loadMyArticles = async () => {
  try {
    const res = await articleApi.getMyList({ page: 0, size: 10 })
    myArticles.value = res.data?.content || []
  } catch (error) {
    console.error('加载文章失败', error)
  }
}

const loadSocialData = async () => {
  const userId = userStore.user?.id
  if (!userId) return
  try {
    const [followersRes, followingRes] = await Promise.all([
      followApi.getFollowers(userId),
      followApi.getFollowing(userId)
    ])
    const followers = Array.isArray(followersRes.data) ? followersRes.data : []
    const following = Array.isArray(followingRes.data) ? followingRes.data : []
    followerCount.value = followers.length
    followingCount.value = following.length
    if (socialTab.value === 'followers') {
      socialList.value = followers
    } else {
      socialList.value = following
    }
  } catch {
    socialList.value = []
  }
}

const switchSocialTab = (tab) => {
  socialTab.value = tab
  loadSocialData()
}

const loadArticleBookmarks = async () => {
  try {
    const res = await bookmarkApi.getList({ page: 0, size: 100 })
    articleBookmarks.value = res.data?.content || []
  } catch {
    articleBookmarks.value = []
  }
}

const switchFavoriteTab = (tab) => {
  favoriteTab.value = tab
  if (tab === 'articles' && articleBookmarks.value.length === 0) {
    loadArticleBookmarks()
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return dateStr.slice(0, 10)
}

const handleUpdateProfile = async () => {
  try {
    const res = await authApi.updateProfile({
      nickname: profileForm.nickname,
      avatarUrl: profileForm.avatarUrl,
      bio: profileForm.bio
    })
    userStore.updateUser(res.data)
    ElMessage.success('个人信息已更新')
  } catch {
    ElMessage.error('更新失败')
  }
}

const handleChangePassword = async () => {
  if (!passwordFormRef.value) return
  
  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await authApi.changePassword({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword
        })
        ElMessage.success('密码修改成功')
        passwordForm.oldPassword = ''
        passwordForm.newPassword = ''
        passwordForm.confirmPassword = ''
      } catch {
        ElMessage.error('密码修改失败')
      }
    }
  })
}

const removeFavorite = async (item) => {
  try {
    await progressApi.updateProgress(
      { questionId: item.questionId, isFavorite: false }
    )
    ElMessage.success('已取消收藏')
    loadFavorites()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const loadBlockedUsers = async () => {
  try {
    const res = await blockApi.getList()
    blockedUsers.value = Array.isArray(res.data) ? res.data : []
  } catch {
    blockedUsers.value = []
  }
}

const handleUnblock = async (item) => {
  try {
    await blockApi.toggle(item.userId)
    blockedUsers.value = blockedUsers.value.filter((b) => b.id !== item.id)
    ElMessage.success('已解除拉黑')
  } catch {
    ElMessage.error('操作失败')
  }
}

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}

onMounted(async () => {
  loading.value = true
  profileForm.username = userStore.user?.username || ''
  profileForm.email = userStore.user?.email || ''
  profileForm.displayName = userStore.user?.displayName || ''

  try {
    await Promise.all([
      loadStatistics(),
      loadFavorites(),
      loadMyArticles(),
      loadSocialData(),
      loadArticleBookmarks(),
      loadBlockedUsers()
    ])
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.profile-container {
  padding-top: 20px;
}

.profile-header {
  background: var(--gradient-primary);
  border-radius: var(--radius-md);
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
  background: var(--color-surface);
  color: var(--color-interactive);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: bold;
}

.user-info h2 {
  color: var(--color-text-on-primary);
  font-size: var(--font-2xl);
  margin-bottom: var(--spacing-sm);
}

.user-info p {
  color: rgba(255, 255, 255, 0.8);
}

.profile-card {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: var(--shadow-md);
}

.profile-card h3 {
  font-size: var(--font-lg);
  color: var(--color-text-primary);
  margin-bottom: 20px;
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.stats-card .stats-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
}

.stat-item .stat-label {
  color: var(--color-text-secondary);
}

.stat-item .stat-value {
  font-weight: bold;
  font-size: var(--font-lg);
}

.stat-value.success {
  color: var(--color-success);
}

.stat-value.danger {
  color: var(--color-danger);
}

.stat-value.primary {
  color: var(--color-interactive);
}

.favorites-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.favorite-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-slow);
}

.favorite-item:hover {
  background: var(--el-color-primary-light-9);
}

.favorite-title {
  color: var(--color-text-secondary);
  font-size: var(--font-base);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.favorite-date {
  color: var(--color-text-secondary);
  font-size: var(--font-xs);
  flex-shrink: 0;
}

.danger-zone {
  border: 1px solid var(--color-danger);
}

.block-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.block-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
}

.block-item-name {
  flex: 1;
  font-size: var(--font-base);
  color: var(--color-text-primary);
}

.favorites-tabs,
.social-tabs {
  display: flex;
  gap: 4px;
  background: var(--color-bg-secondary);
  border-radius: 6px;
  padding: 2px;
  margin-bottom: var(--spacing-md);
}

.fav-tab,
.social-tab {
  flex: 1;
  text-align: center;
  padding: 6px 0;
  border-radius: var(--spacing-xs);
  cursor: pointer;
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
  transition: var(--transition-base);
}

.fav-tab:hover,
.social-tab:hover {
  color: var(--color-interactive);
}

.fav-tab.active,
.social-tab.active {
  background: var(--color-surface);
  color: var(--color-interactive);
  font-weight: 500;
  box-shadow: var(--shadow-sm);
}

.social-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.social-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-base);
}

.social-item:hover {
  background: var(--el-color-primary-light-9);
}

.social-item-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.social-item-name {
  font-size: var(--font-base);
  color: var(--color-text-primary);
  font-weight: 500;
}

.mutual-tag {
  font-size: 11px;
  color: var(--color-interactive);
  background: var(--el-color-primary-light-9);
  padding: 1px 6px;
  border-radius: 3px;
  display: inline-block;
  width: fit-content;
}

.my-articles-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.my-article-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-slow);
}

.my-article-item:hover {
  background: var(--el-color-primary-light-9);
}

.article-title {
  color: var(--color-text-primary);
  font-size: var(--font-base);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.article-date {
  color: var(--color-text-secondary);
  font-size: var(--font-xs);
  margin-left: var(--spacing-md);
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .profile-header {
    padding: var(--spacing-lg) var(--spacing-md);
  }

  .avatar {
    width: 60px;
    height: 60px;
    font-size: 28px;
  }
}
</style>
