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

const route = useRoute()
const appStore = useAppStore()

const showHeader = computed(() => route.path !== '/login')
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: #f5f7fa;
}

.layout-container {
  min-height: 100vh;
}

.el-main {
  padding: 24px;
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
  color: #303133;
  margin-bottom: 24px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: all 0.3s;
  cursor: pointer;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.text-center {
  text-align: center;
}

.text-muted {
  color: #909399;
  font-size: 14px;
}
</style>
