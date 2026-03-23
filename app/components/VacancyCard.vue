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
</script>

<template>
  <NuxtLink
    :to="`/vacancies/${vacancy.id}`"
    draggable="true"
    class="group block p-3 rounded-xl bg-white dark:bg-gray-800
           shadow-[rgba(145,158,171,0.16)_0px_1px_4px] dark:shadow-[rgba(0,0,0,0.3)_0px_1px_4px]
           hover:shadow-[rgba(145,158,171,0.3)_0px_4px_16px_-2px] dark:hover:shadow-[rgba(0,0,0,0.5)_0px_4px_16px_-2px]
           hover:-translate-y-0.5
           transition-all duration-200 cursor-grab active:cursor-grabbing active:opacity-60 active:scale-95"
  >
    <!-- Company + messages badge -->
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold text-gray-800 dark:text-white truncate leading-snug">
          {{ vacancy.company }}
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5 leading-snug">
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
        <UIcon name="i-lucide-message-circle" class="w-3 h-3 mr-0.5" />
        {{ vacancy.messagesCount }}
      </UBadge>
    </div>

    <!-- Date -->
    <div v-if="vacancy.applyDate" class="flex items-center gap-1 mt-2.5">
      <UIcon name="i-lucide-calendar" class="w-3 h-3 text-gray-400 dark:text-gray-500 shrink-0" />
      <p class="text-xs text-gray-400 dark:text-gray-500">
        {{ vacancy.applyDate }}
      </p>
    </div>
  </NuxtLink>
</template>
