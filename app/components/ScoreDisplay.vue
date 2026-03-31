<script setup lang="ts">
defineProps<{ label: string, score: number | null | undefined }>()

function scoreColor(score: number | null | undefined): string {
  if (score == null) return 'text-muted'
  if (score >= 7) return 'text-success'
  if (score >= 4) return 'text-warning'
  return 'text-error'
}
</script>

<template>
  <div class="text-center p-3 rounded-lg bg-elevated">
    <p class="text-xs text-muted mb-1">
      {{ label }}
    </p>
    <p :class="['text-3xl font-bold', scoreColor(score)]">
      {{ score?.toFixed(1) ?? '—' }}
    </p>
    <p class="text-xs text-muted">
      / 10
    </p>
  </div>
</template>
