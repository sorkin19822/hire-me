<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template>
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-xl font-bold text-[oklch(32.70%_0.035_260.11)] dark:text-white">
        {{ title }}
      </h1>
    </div>
    <div class="flex items-center gap-2">
      <slot />
    </div>
  </div>
</template>
