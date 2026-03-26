<script setup lang="ts">
defineProps<{
  vacancy: {
    id: number
    company: string
    position: string
    applyDate: string | null
    messagesCount: number
  }
}>()

const hovered = ref(false)
</script>

<template>
  <NuxtLink
    :to="`/vacancies/${vacancy.id}`"
    draggable="true"
    class="group block p-3 rounded-[7px] bg-white dark:bg-[oklch(32%_0.03_260)]
           hover:-translate-y-0.5 active:opacity-60 active:scale-95
           transition-all duration-150 cursor-grab active:cursor-grabbing"
    :style="{ boxShadow: hovered ? 'rgba(145,158,171,0.28) 0px 4px 16px -2px' : 'rgba(145,158,171,0.16) 0px 1px 4px 0px' }"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <!-- Company + messages badge -->
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0 flex-1">
        <p class="text-[13px] font-semibold text-[oklch(32.70%_0.035_260.11)] dark:text-white truncate leading-snug">
          {{ vacancy.company }}
        </p>
        <p class="text-[12px] text-[oklch(52.16%_0.047_260.80)] dark:text-[oklch(64.54%_0.049_258.74)] truncate mt-0.5 leading-snug">
          {{ vacancy.position }}
        </p>
      </div>
      <UBadge
        v-if="vacancy.messagesCount > 0"
        color="neutral"
        variant="soft"
        size="xs"
        class="shrink-0 mt-0.5"
      >
        <UIcon
          name="i-lucide-message-circle"
          class="w-3 h-3 mr-0.5"
        />
        {{ vacancy.messagesCount }}
      </UBadge>
    </div>

    <!-- Date -->
    <div
      v-if="vacancy.applyDate"
      class="flex items-center gap-1 mt-2.5 pt-2.5 border-t border-[oklch(92.03%_0.015_260.73)] dark:border-[oklch(36.67%_0.041_262.29)]"
    >
      <UIcon
        name="i-lucide-calendar"
        class="w-3 h-3 text-[oklch(70%_0.02_260)] dark:text-[oklch(50%_0.03_260)] shrink-0"
      />
      <p class="text-[11px] text-[oklch(70%_0.02_260)] dark:text-[oklch(50%_0.03_260)]">
        {{ vacancy.applyDate }}
      </p>
    </div>
  </NuxtLink>
</template>
