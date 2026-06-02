<template>
  <div class="contribution-heatmap" :style="{ width: totalWidth + 'px' }">
    <!-- Month labels -->
    <div class="month-row">
      <span class="spacer" :style="{ width: labelWidth + 'px' }" />
      <div class="month-area">
        <span
          v-for="ml in gridData.monthLabels"
          :key="ml.col"
          class="month-label"
          :style="{ left: ml.left + 'px' }"
        >{{ ml.text }}</span>
      </div>
    </div>

    <div class="body-row">
      <!-- Day-of-week labels -->
      <div class="day-labels" :style="{ width: labelWidth + 'px' }">
        <span
          v-for="dl in dayLabels"
          :key="dl.row"
          class="day-label"
          :style="{ top: dl.top + 'px' }"
        >{{ dl.text }}</span>
      </div>

      <!-- Grid -->
      <div
        class="grid"
        :style="{ width: gridWidth + 'px', height: gridHeight + 'px' }"
        @mouseleave="hideTooltip"
      >
        <div
          v-for="cell in gridData.cells"
          :key="cell.key"
          class="cell"
          :class="`l${cell.level}`"
          :style="{ left: cell.left + 'px', top: cell.top + 'px' }"
          @mouseenter="onCellEnter($event, cell)"
        />
      </div>
    </div>

    <!-- Legend -->
    <div class="legend-row">
      <span class="spacer" />
      <div class="legend">
        <span>少</span>
        <span v-for="i in 5" :key="i" class="legend-cell" :class="`l${i - 1}`" />
        <span>多</span>
      </div>
    </div>

    <!-- Tooltip (fixed positioning escapes overflow) -->
    <div v-show="tip.visible" class="heatmap-tooltip" :style="tipStyle">
      <div class="tip-date">{{ tip.dateDisplay }}</div>
      <div>{{ tip.count }} 题 · 正确 {{ tip.correct }} 题</div>
      <div v-if="tip.count > 0">正确率 {{ tip.rate }}%</div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'

const STEP = 16
const CELL = 13
const GAP = 3
const NUM_WEEKS = 52

const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

const props = defineProps({
  data: { type: Array, default: () => [] },
  labelWidth: { type: Number, default: 34 },
})

function getLevel(count) {
  if (count === 0) return 0
  if (count <= 5) return 1
  if (count <= 15) return 2
  if (count <= 30) return 3
  return 4
}

function getMonday(date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return d
}

function fmtDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

const dateMap = computed(() => {
  const map = new Map()
  for (const d of props.data) {
    map.set(d.date, d)
  }
  return map
})

const gridData = computed(() => {
  const map = dateMap.value
  const now = new Date()
  const currMon = getMonday(now)
  const start = new Date(currMon)
  start.setDate(start.getDate() - (NUM_WEEKS - 1) * 7)

  const cells = []
  const labels = []
  let prevMonth = -1

  for (let col = 0; col < NUM_WEEKS; col++) {
    const mon = new Date(start)
    mon.setDate(mon.getDate() + col * 7)

    const m = mon.getMonth()
    if (m !== prevMonth) {
      labels.push({ text: MONTHS[m], left: col * STEP, col })
      prevMonth = m
    }

    for (let row = 0; row < 7; row++) {
      const d = new Date(mon)
      d.setDate(d.getDate() + row)
      const dateStr = fmtDate(d)
      const entry = map.get(dateStr)
      const count = entry?.count ?? 0
      const correct = entry?.correct ?? 0

      cells.push({
        key: dateStr,
        date: dateStr,
        count,
        correct,
        level: getLevel(count),
        left: col * STEP,
        top: row * STEP,
      })
    }
  }

  return { cells, monthLabels: labels }
})

const dayLabels = [
  { row: 0, text: '一', top: 0 },
  { row: 1, text: '二', top: 1 * STEP },
  { row: 2, text: '三', top: 2 * STEP },
  { row: 3, text: '四', top: 3 * STEP },
  { row: 4, text: '五', top: 4 * STEP },
  { row: 5, text: '六', top: 5 * STEP },
  { row: 6, text: '日', top: 6 * STEP },
]

const gridWidth = computed(() => NUM_WEEKS * STEP)
const gridHeight = computed(() => 7 * STEP)
const totalWidth = computed(() => props.labelWidth + gridWidth.value)

// ---- Tooltip ----
const tip = reactive({
  visible: false,
  dateDisplay: '',
  count: 0,
  correct: 0,
  rate: 0,
  x: 0,
  y: 0,
})

function onCellEnter(e, cell) {
  const [y, m, d] = cell.date.split('-')
  tip.dateDisplay = `${y}年${parseInt(m)}月${parseInt(d)}日`
  tip.count = cell.count
  tip.correct = cell.correct
  tip.rate = cell.count > 0 ? Math.round((cell.correct / cell.count) * 100) : 0
  tip.x = e.clientX
  tip.y = e.clientY
  tip.visible = true
}

function hideTooltip() {
  tip.visible = false
}

const tipStyle = computed(() => {
  if (!tip.visible) return {}
  return {
    left: tip.x + 'px',
    top: tip.y + 'px',
    transform: 'translate(-50%, -100%) translateY(-10px)',
  }
})
</script>

<style scoped>
.contribution-heatmap {
  --cell-size: 13px;
  --gap: 3px;
  --step: calc(var(--cell-size) + var(--gap));
  margin: 0 auto;
}

.month-row {
  display: flex;
  margin-bottom: 4px;
}

.spacer {
  flex-shrink: 0;
}

.month-area {
  position: relative;
  height: 18px;
}

.month-label {
  position: absolute;
  font-size: 11px;
  color: #909399;
  white-space: nowrap;
}

.body-row {
  display: flex;
}

.day-labels {
  position: relative;
  flex-shrink: 0;
}

.day-label {
  position: absolute;
  left: 0;
  right: 0;
  height: 16px;
  line-height: 16px;
  font-size: 11px;
  color: #909399;
  text-align: right;
  padding-right: 6px;
}

.grid {
  position: relative;
}

.cell {
  position: absolute;
  width: 13px;
  height: 13px;
  border-radius: 3px;
  cursor: pointer;
  transition: opacity 0.15s;
}

.cell:hover {
  opacity: 0.8;
}

.l0 { background-color: #ebedf0; }
.l1 { background-color: #dbeafe; }
.l2 { background-color: #93c5fd; }
.l3 { background-color: #3b82f6; }
.l4 { background-color: #1d4ed8; }

.legend-row {
  display: flex;
  align-items: center;
  margin-top: 8px;
}

.legend {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: #909399;
}

.legend-cell {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.heatmap-tooltip {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  background: #303133;
  color: #fff;
  font-size: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  line-height: 1.6;
}

.tip-date {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 2px;
}
</style>
