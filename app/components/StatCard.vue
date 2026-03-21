<script setup lang="ts">
defineProps<{
  label: string
  value: string | number | null | undefined
  colorClass?: string
}>()
</script>

<template>
  <UCard>
    <p class="text-xs text-gray-500">
      {{ label }}
    </p>
    <p :class="['text-3xl font-bold mt-1', colorClass]">
      <slot>{{ value ?? '—' }}</slot>
    </p>
  </UCard>
</template>
