<script setup lang="ts">
interface GanttRow {
  id: number
  company: string
  position: string
  applyDate: string | null
  updatedAt: string
  stageColor: string | null
  stageName: string | null
}

const props = defineProps<{ rows: GanttRow[] }>()

const validRows = computed(() =>
  props.rows.filter(r => r.applyDate && !isNaN(new Date(r.applyDate).getTime()))
)

const todayStart = new Date()
todayStart.setHours(0, 0, 0, 0)
const todayMs = todayStart.getTime()

const timeRange = computed(() => {
  if (!validRows.value.length) return { min: todayMs, max: todayMs }
  const starts = validRows.value.map(r => new Date(r.applyDate!).getTime())
  const ends = validRows.value.map(r => new Date(r.updatedAt).getTime())
  return {
    min: Math.min(...starts),
    max: Math.max(...ends, todayMs)
  }
})

function barStyle(row: GanttRow): Record<string, string> {
  const { min, max } = timeRange.value
  const span = max - min || 1
  const start = new Date(row.applyDate!).getTime()
  const end = new Date(row.updatedAt).getTime()

  const left = ((start - min) / span) * 100
  const width = Math.max(((end - start) / span) * 100, 1)

  return {
    left: `${left.toFixed(1)}%`,
    width: `${width.toFixed(1)}%`,
    backgroundColor: row.stageColor ?? '#6366f1'
  }
}

// Axis tick labels: monthly
const axisTicks = computed(() => {
  const { min, max } = timeRange.value
  const span = max - min || 1
  const ticks: Array<{ label: string, pct: number }> = []

  const start = new Date(min)
  start.setDate(1)
  start.setHours(0, 0, 0, 0)

  const cur = new Date(start)
  while (cur.getTime() <= max) {
    const pct = ((cur.getTime() - min) / span) * 100
    if (pct >= 0 && pct <= 100) {
      ticks.push({
        label: cur.toLocaleDateString('uk-UA', { month: 'short', year: '2-digit' }),
        pct
      })
    }
    cur.setMonth(cur.getMonth() + 1)
  }
  return ticks
})
</script>

<template>
  <div class="overflow-x-auto">
    <div
      v-if="!validRows.length"
      class="text-sm text-gray-400 py-4 text-center"
    >
      Немає вакансій з датою відгуку
    </div>
    <div
      v-else
      class="min-w-[600px]"
    >
      <!-- Axis -->
      <div class="relative h-6 mb-1 ml-40">
        <span
          v-for="tick in axisTicks"
          :key="tick.label"
          class="absolute text-xs text-gray-400 -translate-x-1/2"
          :style="{ left: `${tick.pct}%` }"
        >
          {{ tick.label }}
        </span>
      </div>

      <!-- Rows -->
      <div class="space-y-1">
        <div
          v-for="row in validRows"
          :key="row.id"
          class="flex items-center gap-2 h-7"
        >
          <NuxtLink
            :to="`/vacancies/${row.id}`"
            class="w-40 text-right text-xs text-gray-600 dark:text-gray-400 truncate shrink-0 hover:text-primary"
            :title="`${row.company} — ${row.position}`"
          >
            {{ row.company }}
          </NuxtLink>
          <div class="flex-1 relative h-5 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
            <div
              class="absolute inset-y-0 rounded opacity-80"
              :style="barStyle(row)"
              :title="row.stageName ?? ''"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
