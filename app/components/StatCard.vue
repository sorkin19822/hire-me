<script setup lang="ts">
defineProps<{
  label: string
  value: string | number | null | undefined
  colorClass?: string
  icon?: string
  iconBg?: string
}>()
</script>

<template>
  <div
    class="rounded-[7px] bg-white dark:bg-[oklch(27.84%_0.027_257.53)] p-5 flex items-start gap-4"
    style="box-shadow: rgba(145,158,171,0.2) 0px 0px 2px 0px, rgba(145,158,171,0.12) 0px 12px 24px -4px;"
  >
    <!-- Icon -->
    <div
      v-if="icon"
      class="w-12 h-12 rounded-[7px] flex items-center justify-center flex-shrink-0"
      :style="{ backgroundColor: iconBg ?? 'oklch(65.33% 0.184 266.79 / 12%)' }"
    >
      <UIcon
        :name="icon"
        class="w-6 h-6"
        :class="colorClass ?? 'text-primary'"
      />
    </div>
    <!-- Text -->
    <div class="flex-1 min-w-0">
      <p class="text-xs font-medium text-[oklch(52.16%_0.047_260.80)] dark:text-[oklch(64.54%_0.049_258.74)] uppercase tracking-wide mb-1">
        {{ label }}
      </p>
      <p :class="['text-3xl font-bold tracking-tight', colorClass ?? 'text-[oklch(32.70%_0.035_260.11)] dark:text-white']">
        <slot>{{ value ?? '—' }}</slot>
      </p>
    </div>
  </div>
</template>
