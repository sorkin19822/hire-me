<script setup lang="ts">
interface AnalysisResult {
  companyScore: number | null
  recruiterScore: number | null
  redFlags: string[]
  greenFlags: string[]
  summary: string | null
  createdAt?: string
}

const props = defineProps<{ vacancyId: number }>()

const analysisData = ref<AnalysisResult | null>(null)
const loading = ref(false)
const running = ref(false)

async function fetchAnalysis() {
  loading.value = true
  try {
    analysisData.value = await $fetch<AnalysisResult>(`/api/analysis/${props.vacancyId}`)
  }
  catch {
    analysisData.value = null
  }
  finally {
    loading.value = false
  }
}

async function runAnalysis() {
  running.value = true
  try {
    analysisData.value = await $fetch<AnalysisResult>(`/api/analysis/${props.vacancyId}`, { method: 'POST' })
  }
  catch {
    // Keep existing data on error
  }
  finally {
    running.value = false
  }
}

function scoreColor(score: number | null): string {
  if (score === null) return 'text-gray-400'
  if (score >= 7) return 'text-green-600 dark:text-green-400'
  if (score >= 4) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

onMounted(fetchAnalysis)
</script>

<template>
  <div>
    <div v-if="loading" class="flex justify-center py-4">
      <UIcon name="i-lucide-loader-circle" class="w-5 h-5 animate-spin text-gray-400" />
    </div>

    <div v-else-if="analysisData" class="space-y-4">
      <!-- Scores -->
      <div class="grid grid-cols-2 gap-4">
        <div class="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
          <p class="text-xs text-gray-500 mb-1">
            Оцінка компанії
          </p>
          <p :class="['text-3xl font-bold', scoreColor(analysisData.companyScore)]">
            {{ analysisData.companyScore?.toFixed(1) ?? '—' }}
          </p>
          <p class="text-xs text-gray-400">
            / 10
          </p>
        </div>
        <div class="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
          <p class="text-xs text-gray-500 mb-1">
            Оцінка рекрутера
          </p>
          <p :class="['text-3xl font-bold', scoreColor(analysisData.recruiterScore)]">
            {{ analysisData.recruiterScore?.toFixed(1) ?? '—' }}
          </p>
          <p class="text-xs text-gray-400">
            / 10
          </p>
        </div>
      </div>

      <!-- Summary -->
      <p v-if="analysisData.summary" class="text-sm text-gray-700 dark:text-gray-300">
        {{ analysisData.summary }}
      </p>

      <!-- Flags -->
      <div v-if="analysisData.greenFlags?.length" class="space-y-1">
        <p class="text-xs font-semibold text-green-600 dark:text-green-400">
          Позитивне
        </p>
        <ul class="space-y-0.5">
          <li
            v-for="flag in analysisData.greenFlags"
            :key="flag"
            class="text-sm flex items-start gap-1"
          >
            <span class="mt-0.5 shrink-0">✅</span>
            <span>{{ flag }}</span>
          </li>
        </ul>
      </div>

      <div v-if="analysisData.redFlags?.length" class="space-y-1">
        <p class="text-xs font-semibold text-red-600 dark:text-red-400">
          Тривожні сигнали
        </p>
        <ul class="space-y-0.5">
          <li
            v-for="flag in analysisData.redFlags"
            :key="flag"
            class="text-sm flex items-start gap-1"
          >
            <span class="mt-0.5 shrink-0">🚩</span>
            <span>{{ flag }}</span>
          </li>
        </ul>
      </div>

      <p v-if="analysisData.createdAt" class="text-xs text-gray-400">
        Оновлено: {{ analysisData.createdAt?.slice(0, 16).replace('T', ' ') }}
      </p>

      <UButton
        variant="soft"
        icon="i-lucide-refresh-cw"
        size="sm"
        :loading="running"
        @click="runAnalysis"
      >
        Оновити аналіз
      </UButton>
    </div>

    <div v-else class="flex items-center justify-between">
      <p class="text-sm text-gray-400">
        Аналіз не виконано
      </p>
      <UButton
        variant="soft"
        icon="i-lucide-sparkles"
        size="sm"
        :loading="running"
        @click="runAnalysis"
      >
        Аналізувати
      </UButton>
    </div>
  </div>
</template>
