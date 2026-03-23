<script setup lang="ts">
defineProps<{ label: string, score: number | null | undefined }>()

function scoreColor(score: number | null | undefined): string {
  if (score == null) return 'text-gray-400'
  if (score >= 7) return 'text-green-600 dark:text-green-400'
  if (score >= 4) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}
</script>

<template>
  <div class="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
    <p class="text-xs text-gray-500 mb-1">
      {{ label }}
    </p>
    <p :class="['text-3xl font-bold', scoreColor(score)]">
      {{ score?.toFixed(1) ?? '—' }}
    </p>
    <p class="text-xs text-gray-400">
      / 10
    </p>
  </div>
</template>
