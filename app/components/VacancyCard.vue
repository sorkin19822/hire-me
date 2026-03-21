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
    class="block p-3 rounded-lg border border-gray-200 dark:border-gray-700
           bg-white dark:bg-gray-900 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
  >
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0">
        <p class="font-semibold text-sm truncate">
          {{ vacancy.company }}
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
          {{ vacancy.position }}
        </p>
      </div>
      <UBadge
        v-if="vacancy.messagesCount > 0"
        color="neutral"
        variant="soft"
        size="xs"
        class="shrink-0"
      >
        {{ vacancy.messagesCount }}
      </UBadge>
    </div>
    <p v-if="vacancy.applyDate" class="text-xs text-gray-400 mt-2">
      {{ vacancy.applyDate }}
    </p>
  </NuxtLink>
</template>
