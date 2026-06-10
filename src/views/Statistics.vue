<template>
  <div class="page-container statistics-page" v-loading="loading">
    <h1 class="page-title">学习统计</h1>

    <!-- 概览卡片 -->
    <el-row :gutter="20" class="overview-row">
      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card" v-tilt>
          <div class="stat-icon" style="background: var(--color-interactive);">🔥</div>
          <div class="stat-info">
            <div class="stat-value">{{ streak.currentStreak || 0 }}</div>
            <div class="stat-label">连续学习（天）</div>
          </div>
          <div class="stat-extra">最长 {{ streak.maxStreak || 0 }} 天</div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card" v-tilt>
          <div class="stat-icon" style="background: var(--color-success);">✅</div>
          <div class="stat-info">
            <div class="stat-value">{{ Math.round(accuracyRate) }}%</div>
            <div class="stat-label">近期正确率</div>
          </div>
          <div class="stat-extra">近 30 天</div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card" v-tilt>
          <div class="stat-icon" style="background: var(--color-warning);">📊</div>
          <div class="stat-info">
            <div class="stat-value">{{ totalAnswered }}</div>
            <div class="stat-label">累计答题</div>
          </div>
          <div class="stat-extra">{{ totalCorrect }} 道正确</div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <div class="stat-card" v-tilt>
          <div class="stat-icon" style="background: var(--color-info);">🏷️</div>
          <div class="stat-info">
            <div class="stat-value">{{ categoryData.length }}</div>
            <div class="stat-label">涉及分类</div>
          </div>
          <div class="stat-extra">{{ masteredCategories }} 个已掌握</div>
        </div>
      </el-col>
    </el-row>

    <!-- 密度热力图 -->
    <div class="section" v-tilt>
      <div class="section-header">
        <h2>🔥 学习活跃度</h2>
        <span class="section-desc">近 365 天每日答题统计</span>
      </div>
      <ContributionHeatmap :data="dailyData" />
    </div>

    <!-- 折线图 + 饼图 -->
    <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :md="14">
        <div class="section" v-tilt>
          <div class="section-header"><h2>📈 正确率趋势</h2></div>
          <v-chart :option="trendOption" autoresize style="height: 300px" />
        </div>
      </el-col>
      <el-col :xs="24" :sm="24" :md="10">
        <div class="section" v-tilt>
          <div class="section-header"><h2>🥧 分类分布</h2></div>
          <v-chart :option="categoryOption" autoresize style="height: 300px" />
        </div>
      </el-col>
    </el-row>

    <!-- 创作数据 -->
    <div class="section" v-if="showCreationStats">
      <div class="section-header"><h2>📊 创作数据</h2></div>
      <el-row :gutter="20" class="overview-row">
        <el-col :xs="24" :sm="12" :md="12">
          <div class="stat-card" v-tilt>
            <div class="stat-icon" style="background: var(--color-interactive);">👁️</div>
            <div class="stat-info">
              <div class="stat-value">{{ totalViews }}</div>
              <div class="stat-label">文章总浏览量</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="12">
          <div class="stat-card" v-tilt>
            <div class="stat-icon" style="background: var(--color-success);">👥</div>
            <div class="stat-info">
              <div class="stat-value">{{ currentFollowers }}</div>
              <div class="stat-label">累计粉丝</div>
            </div>
          </div>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :xs="24" :sm="24" :md="12">
          <div class="section-header"><h3>📈 阅读趋势</h3></div>
          <v-chart :option="articleViewsOption" autoresize style="height: 260px" />
        </el-col>
        <el-col :xs="24" :sm="24" :md="12">
          <div class="section-header"><h3>📈 粉丝趋势</h3></div>
          <v-chart :option="followerTrendOption" autoresize style="height: 260px" />
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { statisticsApi } from '@/api'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import {
  TitleComponent, TooltipComponent, GridComponent,
  LegendComponent
} from 'echarts/components'
import ContributionHeatmap from '@/components/ContributionHeatmap.vue'

use([CanvasRenderer, LineChart, PieChart,
  TitleComponent, TooltipComponent, GridComponent,
  LegendComponent])

const userStore = useUserStore()

const loading = ref(true)
const dailyData = ref([])
const categoryData = ref([])
const streak = ref({ currentStreak: 0, maxStreak: 0 })
const articleViewTrend = ref([])
const followerTrend = ref([])
const totalViews = ref(0)
const showCreationStats = ref(false)

const totalAnswered = computed(() => dailyData.value.reduce((s, d) => s + d.count, 0))
const totalCorrect = computed(() => dailyData.value.reduce((s, d) => s + d.correct, 0))
const accuracyRate = computed(() => {
  if (totalAnswered.value === 0) return 0
  return (totalCorrect.value / totalAnswered.value * 100)
})
const masteredCategories = computed(() =>
  categoryData.value.filter(c => c.total > 0 && c.mastered / c.total >= 0.8).length
)

const currentFollowers = computed(() => {
  if (followerTrend.value.length === 0) return 0
  return followerTrend.value[followerTrend.value.length - 1].count
})

// ---- 折线图 ----
const trendOption = computed(() => {
  const dates = dailyData.value.slice(-30)
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, top: 10, bottom: 30 },
    xAxis: {
      type: 'category',
      data: dates.map(d => d.date.slice(5)),
      axisLabel: { fontSize: 10, rotate: 45 }
    },
    yAxis: {
      type: 'value', max: 100,
      axisLabel: { formatter: '{value}%' }
    },
    series: [{
      name: '正确率', type: 'line',
      data: dates.map(d => d.count > 0 ? Math.round(d.correct / d.count * 100) : null),
      smooth: true,
      connectNulls: false,
      lineStyle: { color: '#5b76fe', width: 2 },
      areaStyle: { color: 'rgba(91,118,254,0.1)' },
      itemStyle: { color: '#5b76fe' }
    }]
  }
})

// ---- 饼图 ----
const categoryOption = computed(() => {
  const data = categoryData.value.map(c => ({
    name: c.name,
    value: c.total
  }))
  if (data.length === 0) {
    return {
      title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { color: '#999', fontSize: 14 } }
    }
  }
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} 题 ({d}%)' },
    legend: { bottom: '0%', textStyle: { fontSize: 11 } },
    series: [{
      type: 'pie',
      radius: ['35%', '65%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data
    }]
  }
})

// ---- 阅读趋势 ----
const articleViewsOption = computed(() => {
  const data = articleViewTrend.value
  if (data.length === 0) {
    return { title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { color: '#999', fontSize: 14 } } }
  }
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, top: 10, bottom: 30 },
    xAxis: {
      type: 'category',
      data: data.map(d => d.date.slice(5)),
      axisLabel: { fontSize: 10, rotate: 45 }
    },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{
      name: '浏览量', type: 'line',
      data: data.map(d => d.count),
      smooth: true,
      lineStyle: { color: '#5b76fe', width: 2 },
      areaStyle: { color: 'rgba(91,118,254,0.1)' },
      itemStyle: { color: '#5b76fe' }
    }]
  }
})

// ---- 粉丝趋势 ----
const followerTrendOption = computed(() => {
  const data = followerTrend.value
  if (data.length === 0) {
    return { title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { color: '#999', fontSize: 14 } } }
  }
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 20, top: 10, bottom: 30 },
    xAxis: {
      type: 'category',
      data: data.map(d => d.date.slice(5)),
      axisLabel: { fontSize: 10, rotate: 45 }
    },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{
      name: '粉丝数', type: 'line',
      data: data.map(d => d.count),
      smooth: true,
      lineStyle: { color: '#00b473', width: 2 },
      areaStyle: { color: 'rgba(0,180,115,0.1)' },
      itemStyle: { color: '#00b473' }
    }]
  }
})

onMounted(async () => {
  loading.value = true
  try {
    const userId = userStore.user?.id
    if (!userId) return

    const [dailyRes, streakRes, categoryRes] = await Promise.all([
      statisticsApi.getDaily(365),
      statisticsApi.getStreak(),
      statisticsApi.getCategory()
    ])
    dailyData.value = dailyRes.data || []
    streak.value = streakRes.data || {}
    categoryData.value = categoryRes.data || []

    const [viewsRes, totalViewsRes, followerRes] = await Promise.all([
      statisticsApi.getArticleViewsTrend(30).catch(() => ({ data: [] })),
      statisticsApi.getArticleViewTotal().catch(() => ({ data: 0 })),
      statisticsApi.getFollowerTrend(30).catch(() => ({ data: [] }))
    ])
    articleViewTrend.value = viewsRes.data || []
    totalViews.value = totalViewsRes.data || 0
    followerTrend.value = followerRes.data || []
    showCreationStats.value = true
  } catch (e) {
    console.error('加载统计数据失败', e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.statistics-page {
  max-width: 1200px;
  margin: 0 auto;
}

.overview-row {
  margin-bottom: 24px;
}

.stat-card {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: 20px;
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  gap: 14px;
  position: relative;
  margin-bottom: var(--spacing-sm);
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: var(--font-sm);
  color: var(--color-text-secondary);
}

.stat-extra {
  position: absolute;
  bottom: 8px;
  right: 16px;
  font-size: 11px;
  color: var(--color-placeholder);
}

.section {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: 24px;
  box-shadow: var(--shadow-md);
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.section-header h2 {
  font-size: var(--font-lg);
  color: var(--color-text-primary);
  margin: 0;
}

.section-desc {
  font-size: var(--font-xs);
  color: var(--color-placeholder);
}

@media (max-width: 768px) {
  .overview-row .stat-card {
    margin-bottom: var(--spacing-sm);
  }
}
</style>
