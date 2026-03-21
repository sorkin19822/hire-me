<script setup lang="ts">
useSeoMeta({ title: 'Аналітика — hire-me' })

const [{ data: stats }, { data: ganttRows }] = await Promise.all([
  useFetch('/api/analytics/stats'),
  useFetch('/api/analytics/gantt'),
])
</script>

<template>
  <UContainer class="py-6 max-w-5xl">
    <h1 class="text-2xl font-bold mb-6">
      Аналітика
    </h1>

    <!-- Stat cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
      <UCard>
        <p class="text-xs text-gray-500">
          Всього вакансій
        </p>
        <p class="text-3xl font-bold mt-1">
          {{ stats?.total ?? '—' }}
        </p>
      </UCard>
      <UCard>
        <p class="text-xs text-gray-500">
          Співбесіди
        </p>
        <p class="text-3xl font-bold mt-1 text-blue-600 dark:text-blue-400">
          {{ stats?.interviews ?? '—' }}
        </p>
      </UCard>
      <UCard>
        <p class="text-xs text-gray-500">
          Відмови
        </p>
        <p class="text-3xl font-bold mt-1 text-red-600 dark:text-red-400">
          {{ stats?.rejections ?? '—' }}
        </p>
      </UCard>
      <UCard>
        <p class="text-xs text-gray-500">
          Офери
        </p>
        <p class="text-3xl font-bold mt-1 text-green-600 dark:text-green-400">
          {{ stats?.offers ?? '—' }}
          <span class="text-sm font-normal text-gray-400 ml-1">
            ({{ stats?.conversionRate ?? 0 }}%)
          </span>
        </p>
      </UCard>
    </div>

    <!-- Funnel -->
    <UCard class="mb-8">
      <template #header>
        <span class="font-semibold">Воронка конверсії</span>
      </template>
      <FunnelChart v-if="stats?.byStage?.length" :stages="stats.byStage" />
      <p v-else class="text-sm text-gray-400">
        Немає даних
      </p>
    </UCard>

    <!-- Gantt -->
    <UCard>
      <template #header>
        <span class="font-semibold">Таймлайн вакансій</span>
      </template>
      <GanttChart v-if="ganttRows?.length" :rows="ganttRows" />
      <p v-else class="text-sm text-gray-400">
        Немає вакансій з датою відгуку
      </p>
    </UCard>
  </UContainer>
</template>
