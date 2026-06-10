<template>
  <el-container class="layout-container">
    <el-header v-if="showHeader">
      <Header />
    </el-header>
    <el-main :class="{ 'no-padding': !showHeader }">
      <router-view />
    </el-main>
  </el-container>
  
  <el-config-provider>
    <el-loading
      v-model="appStore.loading"
      :text="appStore.loadingText"
      fullscreen
      spinner="el-icon-loading"
    />
  </el-config-provider>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'
import Header from '@/components/Header.vue'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import '@/styles/variables.css'

const route = useRoute()
const appStore = useAppStore()
const userStore = useUserStore()

useHead(() => ({
  title: route.meta?.title ? `${route.meta.title} - 面试刷题系统` : '面试刷题系统',
}))

onMounted(() => {
  userStore.initializeAuth()
})

const showHeader = computed(() => route.path !== '/login')
</script>

<style>
@import '@/styles/variables.css';

.layout-container {
  min-height: 100vh;
}

.el-main {
  padding: var(--spacing-lg);
}

.el-main.no-padding {
  padding: 0;
}

a {
  text-decoration: none;
  color: inherit;
}

.text-center {
  text-align: center;
}

.text-muted {
  color: var(--color-text-secondary);
  font-size: 14px;
}
</style>
