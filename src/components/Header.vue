<template>
  <div class="header">
    <div class="header-content">
      <div class="logo" @click="$router.push('/')">
        <span class="logo-icon">📚</span>
        <span class="logo-text">面试刷题系统</span>
      </div>

      <div class="nav-menu">
        <router-link to="/" class="nav-item" :class="{ active: $route.path === '/' }">
          首页
        </router-link>
        <router-link to="/questions" class="nav-item" :class="{ active: $route.path === '/questions' }">
          题库
        </router-link>
        <router-link to="/practice" class="nav-item" :class="{ active: $route.path === '/practice' }">
          在线刷题
        </router-link>
        <router-link to="/wrong" class="nav-item" :class="{ active: $route.path === '/wrong' }">
          错题本
        </router-link>
        <router-link to="/statistics" class="nav-item" :class="{ active: $route.path === '/statistics' }">
          统计
        </router-link>
        <router-link to="/articles" class="nav-item" :class="{ active: $route.path.startsWith('/articles') }">
          社区
        </router-link>
        <router-link to="/series" class="nav-item" :class="{ active: $route.path.startsWith('/series') }">
          系列
        </router-link>
      </div>

      <div class="user-area">
        <NotificationBell />
        <el-dropdown @command="handleCommand">
          <span class="user-info">
            <span class="avatar">{{ (userStore.user?.nickname || 'U')[0] }}</span>
            <span class="username">{{ userStore.user?.nickname || userStore.user?.email || '用户' }}</span>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">
                👤 个人中心
              </el-dropdown-item>
              <el-dropdown-item command="logout" divided>
                🚪 退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <button class="mobile-menu-btn" @click="drawerVisible = true">☰</button>
      </div>
    </div>

    <el-drawer v-model="drawerVisible" direction="rtl" size="260px" :show-close="false">
      <template #header>
        <span class="drawer-title">导航菜单</span>
      </template>
      <div class="drawer-nav">
        <router-link to="/" class="drawer-nav-item" @click="drawerVisible = false">🏠 首页</router-link>
        <router-link to="/questions" class="drawer-nav-item" @click="drawerVisible = false">📚 题库</router-link>
        <router-link to="/practice" class="drawer-nav-item" @click="drawerVisible = false">🚀 在线刷题</router-link>
        <router-link to="/wrong" class="drawer-nav-item" @click="drawerVisible = false">📝 错题本</router-link>
        <router-link to="/statistics" class="drawer-nav-item" @click="drawerVisible = false">📊 统计</router-link>
        <router-link to="/articles" class="drawer-nav-item" @click="drawerVisible = false">💬 社区</router-link>
        <router-link to="/series" class="drawer-nav-item" @click="drawerVisible = false">📖 系列</router-link>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import NotificationBell from '@/components/NotificationBell.vue'

const userStore = useUserStore()
const router = useRouter()
const drawerVisible = ref(false)

const handleCommand = (command) => {
  if (command === 'logout') {
    userStore.logout()
    router.push('/login')
  } else if (command === 'profile') {
    router.push('/profile')
  }
}
</script>

<style scoped>
.header {
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-lg);
  height: 60px;
}

.logo {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.logo-icon {
  font-size: 28px;
  margin-right: var(--spacing-sm);
}

.logo-text {
  font-size: var(--font-xl);
  font-weight: bold;
  color: var(--color-interactive);
}

.nav-menu {
  display: flex;
  gap: var(--spacing-sm);
}

.nav-item {
  padding: var(--spacing-sm) var(--spacing-md);
  color: var(--color-text-secondary);
  text-decoration: none;
  border-radius: var(--spacing-xs);
  transition: var(--transition-slow);
}

.nav-item:hover {
  color: var(--color-interactive);
  background: var(--el-color-primary-light-9);
}

.nav-item.active {
  color: var(--color-interactive);
  background: var(--el-color-primary-light-9);
}

.user-area {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--spacing-xs);
}

.user-info:hover {
  background: var(--color-bg-secondary);
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--gradient-primary);
  color: var(--color-text-on-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: var(--spacing-sm);
}

.username {
  color: var(--color-text-primary);
  font-size: var(--font-base);
}

.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: var(--spacing-xs);
  color: var(--color-text-secondary);
}

.drawer-title {
  font-size: var(--font-lg);
  font-weight: 600;
  color: var(--color-text-primary);
}

.drawer-nav {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.drawer-nav-item {
  padding: var(--spacing-md);
  color: var(--color-text-primary);
  text-decoration: none;
  border-radius: var(--radius-sm);
  transition: var(--transition-base);
}

.drawer-nav-item:hover {
  background: var(--color-bg-secondary);
  color: var(--color-interactive);
}

@media (max-width: 768px) {
  .nav-menu {
    display: none;
  }

  .mobile-menu-btn {
    display: block;
  }

  .username {
    display: none;
  }

  .header-content {
    padding: 0 var(--spacing-md);
  }
}
</style>
