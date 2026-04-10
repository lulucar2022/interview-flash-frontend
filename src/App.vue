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
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Header from '@/components/Header.vue'
import { useAppStore } from '@/stores/app'
import '@/styles/variables.css'

const route = useRoute()
const appStore = useAppStore()

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

.page-container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-lg);
  letter-spacing: -0.72px;
}

.card {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  box-shadow: 0 0 0 1px var(--color-ring);
  transition: all 0.2s ease;
  cursor: pointer;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.text-center {
  text-align: center;
}

.text-muted {
  color: var(--color-text-secondary);
  font-size: 14px;
}
</style>
