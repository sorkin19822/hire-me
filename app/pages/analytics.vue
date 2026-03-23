<script setup lang="ts">
useSeoMeta({ title: 'Аналітика — hire-me' })

const [{ data: stats }, { data: ganttRows }] = await Promise.all([
  useFetch('/api/analytics/stats'),
  useFetch('/api/analytics/gantt')
])
</script>

<template>
  <UContainer class="py-6 max-w-5xl">
    <PageHeader title="Аналітика" />

    <!-- Stat cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
      <StatCard
        label="Всього вакансій"
        :value="stats?.total"
        icon="i-lucide-briefcase"
        icon-bg="oklch(65.33% 0.184 266.79 / 12%)"
        color-class="text-primary"
      />
      <StatCard
        label="Співбесіди"
        :value="stats?.interviews"
        icon="i-lucide-users"
        icon-bg="oklch(68.98% 0.165 257.10 / 12%)"
        color-class="text-info"
      />
      <StatCard
        label="Відмови"
        :value="stats?.rejections"
        icon="i-lucide-x-circle"
        icon-bg="oklch(74.75% 0.144 35.82 / 12%)"
        color-class="text-error"
      />
      <StatCard
        label="Офери"
        :value="stats?.offers"
        icon="i-lucide-trophy"
        icon-bg="oklch(80.48% 0.150 174.63 / 12%)"
        color-class="text-success"
      >
        {{ stats?.offers ?? '—' }}
        <span class="text-sm font-normal text-[oklch(52.16%_0.047_260.80)] dark:text-[oklch(64.54%_0.049_258.74)] ml-1">({{ stats?.conversionRate ?? 0 }}%)</span>
      </StatCard>
    </div>

    <!-- Funnel -->
    <div
      class="rounded-[7px] bg-white dark:bg-[oklch(27.84%_0.027_257.53)] mb-6 overflow-hidden"
      style="box-shadow: rgba(145,158,171,0.2) 0px 0px 2px 0px, rgba(145,158,171,0.12) 0px 12px 24px -4px;"
    >
      <div class="flex items-center px-6 py-4 border-b border-[oklch(92.03%_0.015_260.73)] dark:border-[oklch(36.67%_0.041_262.29)]">
        <UIcon
          name="i-lucide-filter"
          class="w-4 h-4 text-primary mr-2"
        />
        <span class="text-[15px] font-semibold text-[oklch(32.70%_0.035_260.11)] dark:text-white">Воронка конверсії</span>
      </div>
      <div class="p-6">
        <FunnelChart
          v-if="stats?.byStage?.length"
          :stages="stats.byStage"
        />
        <p
          v-else
          class="text-sm text-[oklch(52.16%_0.047_260.80)] dark:text-[oklch(64.54%_0.049_258.74)]"
        >
          Немає даних
        </p>
      </div>
    </div>

    <!-- Gantt -->
    <div
      class="rounded-[7px] bg-white dark:bg-[oklch(27.84%_0.027_257.53)] overflow-hidden"
      style="box-shadow: rgba(145,158,171,0.2) 0px 0px 2px 0px, rgba(145,158,171,0.12) 0px 12px 24px -4px;"
    >
      <div class="flex items-center px-6 py-4 border-b border-[oklch(92.03%_0.015_260.73)] dark:border-[oklch(36.67%_0.041_262.29)]">
        <UIcon
          name="i-lucide-gantt-chart"
          class="w-4 h-4 text-primary mr-2"
        />
        <span class="text-[15px] font-semibold text-[oklch(32.70%_0.035_260.11)] dark:text-white">Таймлайн вакансій</span>
      </div>
      <div class="p-6">
        <GanttChart
          v-if="ganttRows?.length"
          :rows="ganttRows"
        />
        <p
          v-else
          class="text-sm text-[oklch(52.16%_0.047_260.80)] dark:text-[oklch(64.54%_0.049_258.74)]"
        >
          Немає вакансій з датою відгуку
        </p>
      </div>
    </div>
  </UContainer>
</template>
