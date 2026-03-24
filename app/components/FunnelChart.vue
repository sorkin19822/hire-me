<script setup lang="ts">
interface StageData {
  id: number
  name: string
  color: string
  order: number
  isTerminal: boolean
  count: number
}

const props = defineProps<{ stages: StageData[] }>()

const maxCount = computed(() => Math.max(...props.stages.map(s => s.count), 1))

function barWidth(count: number): string {
  return `${Math.round((count / maxCount.value) * 100)}%`
}

function dropOff(index: number): string | null {
  if (index === 0) return null
  const curr = props.stages[index]!
  const prev = props.stages[index - 1]!
  if (curr.isTerminal || prev.isTerminal) return null
  if (prev.count === 0) return null
  const pct = Math.round((curr.count / prev.count) * 100)
  return `${pct}% від попередньої`
}
</script>

<template>
  <div class="space-y-2">
    <div
      v-for="(stage, index) in stages"
      :key="stage.id"
      class="flex items-center gap-3"
    >
      <div class="w-32 text-right text-xs text-gray-500 truncate shrink-0">
        {{ stage.name }}
      </div>
      <div class="flex-1 relative h-7">
        <div
          class="absolute inset-y-0 left-0 rounded flex items-center px-2 transition-all"
          :style="{ width: barWidth(stage.count), backgroundColor: stage.color, opacity: stage.isTerminal ? '0.6' : '1' }"
        >
          <span
            v-if="stage.count > 0"
            class="text-white text-xs font-medium whitespace-nowrap"
          >
            {{ stage.count }}
          </span>
        </div>
        <span
          v-if="stage.count === 0"
          class="absolute left-2 inset-y-0 flex items-center text-xs text-gray-400"
        >
          0
        </span>
      </div>
      <div class="w-28 text-xs text-gray-400 shrink-0">
        {{ dropOff(index) }}
      </div>
    </div>
  </div>
</template>
