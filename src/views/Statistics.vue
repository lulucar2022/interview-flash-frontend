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

    <!-- 日历热力图 -->
    <div class="section">
      <div class="section-header">
        <h2>📅 学习日历</h2>
        <el-radio-group v-model="calendarMode" size="small" @change="onCalendarModeChange">
          <el-radio-button value="month">月视图</el-radio-button>
          <el-radio-button value="week">周视图</el-radio-button>
        </el-radio-group>
      </div>
      <div class="calendar-wrapper">
        <v-chart :option="calendarOption" autoresize style="height: 220px" />
      </div>
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
import { HeatmapChart, LineChart, PieChart } from 'echarts/charts'
import {
  TitleComponent, TooltipComponent, GridComponent, VisualMapComponent,
  LegendComponent, CalendarComponent
} from 'echarts/components'

use([CanvasRenderer, HeatmapChart, LineChart, PieChart,
  TitleComponent, TooltipComponent, GridComponent, VisualMapComponent,
  LegendComponent, CalendarComponent])

const userStore = useUserStore()

const calendarMode = ref(localStorage.getItem('stats-calendar-mode') || 'month')
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

function onCalendarModeChange(val) {
  localStorage.setItem('stats-calendar-mode', val)
}

// ---- 日历热力图 ----
const calendarOption = computed(() => {
  const dates = dailyData.value
  const data = dates
    .filter(d => d.count > 0)
    .map(d => [d.date, d.count])

  const maxVal = Math.max(1, ...data.map(d => d[1]))
  const today = new Date()
  const year = today.getFullYear()

  if (calendarMode.value === 'month') {
    // 月视图：12 个月的行
    const months = []
    const monthDays = []
    for (let m = 0; m < 12; m++) {
      const start = new Date(year, m, 1)
      const end = new Date(year, m + 1, 0)
      const dayCount = end.getDate()
      monthDays.push(dayCount)
      // yAxis category: month name
      months.push(`${m + 1}月`)
    }
    const maxDays = Math.max(...monthDays)

    // Build grid data: [dayIdx, monthIdx, value]
    const gridData = []
    for (let m = 0; m < 12; m++) {
      for (let d = 1; d <= maxDays; d++) {
        const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        const found = dates.find(item => item.date === dateStr)
        gridData.push([d - 1, m, found ? found.count : -1])
      }
    }

    return {
      tooltip: {
        position: 'top',
        formatter: p => {
          if (!p.data || p.data[2] === -1) return ''
          const dateStr = `${year}-${String(p.data[1] + 1).padStart(2, '0')}-${String(p.data[0] + 1).padStart(2, '0')}`
          return `${dateStr}<br/>${p.data[2]} 道题`
        }
      },
      grid: { left: 50, right: 20, top: 10, bottom: 10 },
      xAxis: {
        type: 'category',
        data: Array.from({ length: maxDays }, (_, i) => i + 1),
        axisLabel: { fontSize: 10 },
        splitArea: { show: true }
      },
      yAxis: {
        type: 'category',
        data: months,
        axisLabel: { fontSize: 11 },
        splitArea: { show: true }
      },
      visualMap: {
        min: 0, max: maxVal,
        calculable: true,
        orient: 'vertical',
        right: 0, top: 'center',
        inRange: { color: ['#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196127'] },
        pieces: [
          { min: 0, max: 0, color: '#f0f0f0' },
          { min: 1, max: Math.ceil(maxVal * 0.25), color: '#c6e48b' },
          { min: Math.ceil(maxVal * 0.25) + 1, max: Math.ceil(maxVal * 0.5), color: '#7bc96f' },
          { min: Math.ceil(maxVal * 0.5) + 1, max: Math.ceil(maxVal * 0.75), color: '#239a3b' },
          { min: Math.ceil(maxVal * 0.75) + 1, max: maxVal, color: '#196127' }
        ]
      },
      series: [{
        type: 'heatmap',
        data: gridData,
        label: { show: false },
        emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.3)' } }
      }]
    }
  } else {
    // 周视图：7 行（周一~周日），列按周数
    const weeks = []
    const now = new Date()
    const startOfYear = new Date(year, 0, 1)
    const daysFromStart = Math.floor((now - startOfYear) / 86400000)
    const totalWeeks = Math.ceil(daysFromStart / 7)

    const gridData = []
    // Monday=0, Sunday=6
    for (let w = 0; w <= totalWeeks; w++) {
      for (let dow = 0; dow < 7; dow++) {
        const date = new Date(year, 0, 1 + w * 7 + dow - startOfYear.getDay() + 1)
        if (date.getFullYear() !== year) continue
        const dateStr = date.toISOString().split('T')[0]
        const found = dates.find(item => item.date === dateStr)
        if (found) {
          gridData.push([w, dow, found.count])
        }
      }
    }

    return {
      tooltip: {
        position: 'top',
        formatter: p => p.data ? `${dailyData.value[p.data[4]?.split?.('T')?.[0]] || ''}<br/>${p.data[2] || 0} 道题` : ''
      },
      grid: { left: 45, right: 20, top: 10, bottom: 10 },
      xAxis: {
        type: 'category',
        data: Array.from({ length: totalWeeks + 1 }, (_, i) => `W${i + 1}`),
        axisLabel: { fontSize: 10, rotate: 45 },
        splitArea: { show: true }
      },
      yAxis: {
        type: 'category',
        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        axisLabel: { fontSize: 11 },
        splitArea: { show: true }
      },
      visualMap: {
        min: 0, max: maxVal,
        calculable: true,
        orient: 'vertical',
        right: 0, top: 'center',
        inRange: { color: ['#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196127'] }
      },
      series: [{
        type: 'heatmap',
        data: gridData,
        label: { show: false }
      }]
    }
  }
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

.calendar-wrapper {
  overflow-x: auto;
}
</style>
