<script setup lang="ts">
defineProps<{
  flags: string[]
  label: string
  type: 'success' | 'error'
}>()
</script>

<template>
  <div
    v-if="flags.length"
    class="space-y-1"
  >
    <p :class="['text-xs font-semibold', type === 'success' ? 'text-success' : 'text-error']">
      {{ label }}
    </p>
    <ul class="space-y-0.5">
      <li
        v-for="flag in flags"
        :key="flag"
        class="text-sm flex items-start gap-1"
      >
        <span class="mt-0.5 shrink-0">{{ type === 'success' ? '✅' : '🚩' }}</span>
        <span>{{ flag }}</span>
      </li>
    </ul>
  </div>
</template>
