<template>
  <div class="heatmap-container">
    <div class="heatmap-controls">
      <div class="control-item">
        <label>带宽 <span class="val">{{ bandwidth }}</span>px</label>
        <el-slider v-model="bandwidth" :min="10" :max="80" :step="1" @input="scheduleRender" />
      </div>
      <div class="control-item">
        <label>强度 <span class="val">{{ intensity.toFixed(1) }}</span></label>
        <el-slider v-model="intensity" :min="0.5" :max="2.0" :step="0.1" @input="scheduleRender" />
      </div>
      <div class="control-item">
        <label>阈值 <span class="val">{{ threshold.toFixed(3) }}</span></label>
        <el-slider v-model="threshold" :min="0" :max="0.1" :step="0.005" @input="scheduleRender" />
      </div>
      <div class="point-count">{{ points.length }} 个数据点</div>
    </div>

    <div class="canvas-wrapper" ref="wrapperRef">
      <canvas ref="canvasRef" :width="canvasWidth" :height="canvasHeight" />
      <!-- 色阶图例 -->
      <div class="legend">
        <span class="legend-label">低</span>
        <div
          v-for="(c, i) in COLORS"
          :key="i"
          class="legend-block"
          :style="{ background: c }"
        />
        <span class="legend-label">高</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps({
  points: { type: Array, default: () => [] },
  width: { type: Number, default: 800 },
  height: { type: Number, default: 400 },
})

const canvasRef = ref(null)
const wrapperRef = ref(null)
const bandwidth = ref(35)
const intensity = ref(1.0)
const threshold = ref(0.005)

// 感知均匀色阶（6 阶）
const COLORS = [
  'rgba(0,0,0,0)',
  'rgba(0,0,140,0.6)',
  'rgba(40,120,200,0.8)',
  'rgba(100,220,120,0.9)',
  'rgba(255,240,50,0.95)',
  'rgba(255,100,20,1)',
]

// Canvas 实际尺寸（加 padding 避免边缘截断）
const PADDING = 80
const BLUR_RADIUS = 2.5

const canvasWidth = computed(() => props.width + PADDING * 2)
const canvasHeight = computed(() => props.height + PADDING * 2)

let renderTimer = null

const scheduleRender = () => {
  if (renderTimer) cancelAnimationFrame(renderTimer)
  renderTimer = requestAnimationFrame(() => {
    renderTimer = null
    draw()
  })
}

watch(() => props.points, () => { scheduleRender() }, { deep: true, immediate: true })
onMounted(() => { if (props.points.length > 0) draw() })

// ── 高斯模糊辅助函数（近似 3σ 盒型） ──
function gaussianBlur(imageData, width, height, radius) {
  const src = new Uint8ClampedArray(imageData.data)
  const dst = imageData.data
  const r = Math.max(1, Math.round(radius))
  const len = width * height * 4

  // 水平方向
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let rAcc = 0, gAcc = 0, bAcc = 0, aAcc = 0, weightSum = 0
      for (let dx = -r; dx <= r; dx++) {
        const sx = Math.min(width - 1, Math.max(0, x + dx))
        const idx = (y * width + sx) * 4
        const w = r + 1 - Math.abs(dx) // 三角权重
        rAcc += src[idx] * w
        gAcc += src[idx + 1] * w
        bAcc += src[idx + 2] * w
        aAcc += src[idx + 3] * w
        weightSum += w
      }
      const idx = (y * width + x) * 4
      dst[idx]     = rAcc / weightSum
      dst[idx + 1] = gAcc / weightSum
      dst[idx + 2] = bAcc / weightSum
      dst[idx + 3] = aAcc / weightSum
    }
  }

  // 复制到 src 用于垂直方向
  src.set(dst)

  // 垂直方向
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let rAcc = 0, gAcc = 0, bAcc = 0, aAcc = 0, weightSum = 0
      for (let dy = -r; dy <= r; dy++) {
        const sy = Math.min(height - 1, Math.max(0, y + dy))
        const idx = (sy * width + x) * 4
        const w = r + 1 - Math.abs(dy)
        rAcc += src[idx] * w
        gAcc += src[idx + 1] * w
        bAcc += src[idx + 2] * w
        aAcc += src[idx + 3] * w
        weightSum += w
      }
      const idx = (y * width + x) * 4
      dst[idx]     = rAcc / weightSum
      dst[idx + 1] = gAcc / weightSum
      dst[idx + 2] = bAcc / weightSum
      dst[idx + 3] = aAcc / weightSum
    }
  }
}

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const w = canvasWidth.value
  const h = canvasHeight.value
  const pts = props.points
  if (!pts || pts.length === 0) return

  const bw = bandwidth.value
  const inten = intensity.value
  const thresh = threshold.value

  // ── Step 1: 清空 Canvas（完全透明） ──
  ctx.clearRect(0, 0, w, h)

  // ── Step 2: 绘制径向渐变圆，'lighter' 叠加 ──
  ctx.globalCompositeOperation = 'lighter'

  // 预创建渐变模板（translate 到圆心位置）
  const gradCache = new Map()

  for (const p of pts) {
    const weight = p.weight || 1
    const cx = p.x + PADDING
    const cy = p.y + PADDING
    const r = bw

    // 获取该权重对应的色阶颜色索引（非线性映射，低权重更暗）
    const raw = Math.min(1, (weight / 5) * inten)
    const mapped = Math.pow(raw, 0.6)
    const colorIdx = Math.max(1, Math.min(COLORS.length - 1, Math.round(mapped * (COLORS.length - 1))))

    // 从缓存获取渐变着色模板，或创建
    let stops = gradCache.get(colorIdx)
    if (!stops) {
      const baseColor = parseRgba(COLORS[colorIdx])
      stops = [
        { pos: 0, color: `rgba(${baseColor.r},${baseColor.g},${baseColor.b},${baseColor.a})` },
        { pos: 0.5, color: `rgba(${baseColor.r},${baseColor.g},${baseColor.b},${baseColor.a * 0.4})` },
        { pos: 1, color: 'rgba(0,0,0,0)' }
      ]
      gradCache.set(colorIdx, stops)
    }

    ctx.save()
    ctx.translate(cx, cy)
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r)
    stops.forEach(s => grad.addColorStop(s.pos, s.color))
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()
    ctx.restore()
  }

  ctx.globalCompositeOperation = 'source-over'

  // ── Step 3: 获取像素数据做颜色映射 + 阈值 + 模糊 ──
  const imageData = ctx.getImageData(0, 0, w, h)
  const data = imageData.data

  // 3a. 高斯模糊
  gaussianBlur(imageData, w, h, BLUR_RADIUS)

  // 3b. 颜色映射 + 阈值
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]

    // 亮度归一化密度值 [0, 1]
    const density = Math.min(1, (r + g + b) / (255 * 3) * inten)

    if (density < thresh) {
      data[i + 3] = 0
      continue
    }

    // 非线性映射：低密度更暗，高密度更饱和
    const mapped = Math.pow(density, 0.7)
    const idx = Math.min(COLORS.length - 1, Math.floor(mapped * (COLORS.length - 1)))
    const color = parseRgba(COLORS[idx])

    data[i]     = color.r
    data[i + 1] = color.g
    data[i + 2] = color.b
    data[i + 3] = Math.round(color.a * 255 * Math.min(1, density * 1.5))
  }

  ctx.putImageData(imageData, 0, 0)

  // ── Step 4: 裁剪 padding 边距 ──
  // 实际展示区域 = inner canvas
}

function parseRgba(str) {
  // rgba(r,g,b,a) 解析
  const m = str.match(/rgba?\((\d+),(\d+),(\d+)(?:,([\d.]+))?\)/)
  if (!m) return { r: 0, g: 0, b: 0, a: 1 }
  return {
    r: parseInt(m[1]),
    g: parseInt(m[2]),
    b: parseInt(m[3]),
    a: m[4] !== undefined ? parseFloat(m[4]) : 1
  }
}
</script>

<style scoped>
.heatmap-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.heatmap-controls {
  display: flex;
  gap: 24px;
  align-items: center;
  flex-wrap: wrap;
}

.control-item {
  flex: 1;
  min-width: 140px;
}

.control-item label {
  font-size: 12px;
  color: #909399;
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.control-item .val {
  color: #409EFF;
  font-weight: 600;
}

.point-count {
  font-size: 12px;
  color: #c0c4cc;
  white-space: nowrap;
}

.canvas-wrapper {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

canvas {
  border-radius: 8px;
  background: transparent;
  max-width: 100%;
}

.legend {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding-top: 4px;
}

.legend-block {
  width: 14px;
  height: 14px;
  border-radius: 2px;
}

.legend-label {
  font-size: 10px;
  color: #909399;
}
</style>
