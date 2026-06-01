<template>
  <div class="page-container statistics-page">
    <h1 class="page-title">学习统计</h1>

    <!-- 概览卡片 -->
    <el-row :gutter="20" class="overview-row">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #409EFF;">🔥</div>
          <div class="stat-info">
            <div class="stat-value">{{ streak.currentStreak || 0 }}</div>
            <div class="stat-label">连续学习（天）</div>
          </div>
          <div class="stat-extra">最长 {{ streak.maxStreak || 0 }} 天</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #67C23A;">✅</div>
          <div class="stat-info">
            <div class="stat-value">{{ Math.round(accuracyRate) }}%</div>
            <div class="stat-label">近期正确率</div>
          </div>
          <div class="stat-extra">近 30 天</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #E6A23C;">📊</div>
          <div class="stat-info">
            <div class="stat-value">{{ totalAnswered }}</div>
            <div class="stat-label">累计答题</div>
          </div>
          <div class="stat-extra">{{ totalCorrect }} 道正确</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #909399;">🏷️</div>
          <div class="stat-info">
            <div class="stat-value">{{ categoryData.length }}</div>
            <div class="stat-label">涉及分类</div>
          </div>
          <div class="stat-extra">{{ masteredCategories }} 个已掌握</div>
        </div>
      </el-col>
    </el-row>

    <!-- 密度热力图 -->
    <div class="section">
      <div class="section-header">
        <h2>🔥 活跃度热力图</h2>
        <span class="section-desc">核密度估计 · 高斯平滑 · 感知均匀色阶</span>
      </div>
      <HeatmapCanvas :points="heatmapPoints" :width="720" :height="200" />
    </div>

    <!-- 折线图 + 饼图 -->
    <el-row :gutter="20">
      <el-col :span="14">
        <div class="section">
          <div class="section-header"><h2>📈 正确率趋势</h2></div>
          <v-chart :option="trendOption" autoresize style="height: 300px" />
        </div>
      </el-col>
      <el-col :span="10">
        <div class="section">
          <div class="section-header"><h2>🥧 分类分布</h2></div>
          <v-chart :option="categoryOption" autoresize style="height: 300px" />
        </div>
      </el-col>
    </el-row>
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
import HeatmapCanvas from '@/components/HeatmapCanvas.vue'

use([CanvasRenderer, LineChart, PieChart,
  TitleComponent, TooltipComponent, GridComponent,
  LegendComponent])

const userStore = useUserStore()

const dailyData = ref([])
const categoryData = ref([])
const streak = ref({ currentStreak: 0, maxStreak: 0 })

const totalAnswered = computed(() => dailyData.value.reduce((s, d) => s + d.count, 0))
const totalCorrect = computed(() => dailyData.value.reduce((s, d) => s + d.correct, 0))
const accuracyRate = computed(() => {
  if (totalAnswered.value === 0) return 0
  return (totalCorrect.value / totalAnswered.value * 100)
})
const masteredCategories = computed(() =>
  categoryData.value.filter(c => c.total > 0 && c.mastered / c.total >= 0.8).length
)

// ---- 活跃度热力图 ----
const heatmapPoints = computed(() => {
  return dailyData.value
    .filter(d => d.count > 0)
    .map((d, i) => ({
      x: i * (720 / Math.max(1, dailyData.value.length)),
      y: 100,
      weight: d.count
    }))
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
      lineStyle: { color: '#409EFF', width: 2 },
      areaStyle: { color: 'rgba(64,158,255,0.1)' },
      itemStyle: { color: '#409EFF' }
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

onMounted(async () => {
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
  } catch (e) {
    console.error('加载统计数据失败', e)
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
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  gap: 14px;
  position: relative;
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
  color: #303133;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}

.stat-extra {
  position: absolute;
  bottom: 8px;
  right: 16px;
  font-size: 11px;
  color: #c0c4cc;
}

.section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h2 {
  font-size: 18px;
  color: #303133;
  margin: 0;
}

.section-desc {
  font-size: 12px;
  color: #c0c4cc;
}
</style>
