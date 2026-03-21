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

const toast = useToast()

// Stored result
const analysisData = ref<AnalysisResult | null>(null)
const loadingResult = ref(false)

// Prompt panel
const showPromptPanel = ref(false)
const lang = ref<'uk' | 'en'>('uk')
const promptText = ref('')
const loadingPrompt = ref(false)

// Paste panel
const showPastePanel = ref(false)
const pasteText = ref('')
const saving = ref(false)

async function fetchStoredAnalysis() {
  loadingResult.value = true
  try {
    analysisData.value = await $fetch<AnalysisResult>(`/api/analysis/${props.vacancyId}`)
  }
  catch {
    analysisData.value = null
  }
  finally {
    loadingResult.value = false
  }
}

async function generatePrompt() {
  loadingPrompt.value = true
  try {
    const data = await $fetch<{ prompt: string }>(`/api/analysis/prompt/${props.vacancyId}?lang=${lang.value}`)
    promptText.value = data.prompt
    showPromptPanel.value = true
    showPastePanel.value = false
  }
  catch {
    toast.add({ title: 'Не вдалося згенерувати промпт', color: 'error', icon: 'i-lucide-alert-circle' })
  }
  finally {
    loadingPrompt.value = false
  }
}

async function copyPrompt() {
  await navigator.clipboard.writeText(promptText.value)
  toast.add({ title: 'Промпт скопійовано', color: 'success', icon: 'i-lucide-clipboard-check' })
}

async function saveResult() {
  if (!pasteText.value.trim()) return
  saving.value = true
  try {
    analysisData.value = await $fetch<AnalysisResult>(`/api/analysis/${props.vacancyId}`, {
      method: 'POST',
      body: { result: pasteText.value },
    })
    showPastePanel.value = false
    showPromptPanel.value = false
    pasteText.value = ''
    toast.add({ title: 'Аналіз збережено', color: 'success', icon: 'i-lucide-check' })
  }
  catch (err: unknown) {
    const msg = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Помилка збереження'
    toast.add({ title: msg, color: 'error', icon: 'i-lucide-alert-circle' })
  }
  finally {
    saving.value = false
  }
}

function scoreColor(score: number | null): string {
  if (score === null) return 'text-gray-400'
  if (score >= 7) return 'text-green-600 dark:text-green-400'
  if (score >= 4) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

onMounted(fetchStoredAnalysis)
</script>

<template>
  <div class="space-y-4">
    <!-- Stored result -->
    <div v-if="loadingResult" class="flex justify-center py-4">
      <UIcon name="i-lucide-loader-circle" class="w-5 h-5 animate-spin text-gray-400" />
    </div>

    <div v-else-if="analysisData" class="space-y-4">
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

      <p v-if="analysisData.summary" class="text-sm text-gray-700 dark:text-gray-300">
        {{ analysisData.summary }}
      </p>

      <div v-if="analysisData.greenFlags?.length" class="space-y-1">
        <p class="text-xs font-semibold text-green-600 dark:text-green-400">
          Позитивне
        </p>
        <ul class="space-y-0.5">
          <li v-for="flag in analysisData.greenFlags" :key="flag" class="text-sm flex items-start gap-1">
            <span class="mt-0.5 shrink-0">✅</span><span>{{ flag }}</span>
          </li>
        </ul>
      </div>

      <div v-if="analysisData.redFlags?.length" class="space-y-1">
        <p class="text-xs font-semibold text-red-600 dark:text-red-400">
          Тривожні сигнали
        </p>
        <ul class="space-y-0.5">
          <li v-for="flag in analysisData.redFlags" :key="flag" class="text-sm flex items-start gap-1">
            <span class="mt-0.5 shrink-0">🚩</span><span>{{ flag }}</span>
          </li>
        </ul>
      </div>

      <p v-if="analysisData.createdAt" class="text-xs text-gray-400">
        Оновлено: {{ analysisData.createdAt?.slice(0, 16).replace('T', ' ') }}
      </p>
    </div>

    <!-- Action buttons -->
    <div class="flex flex-wrap items-center gap-2">
      <!-- Language toggle -->
      <div class="flex rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden text-xs">
        <button
          :class="['px-3 py-1.5 transition-colors', lang === 'uk' ? 'bg-primary text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-800']"
          @click="lang = 'uk'"
        >
          UA
        </button>
        <button
          :class="['px-3 py-1.5 transition-colors', lang === 'en' ? 'bg-primary text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-800']"
          @click="lang = 'en'"
        >
          EN
        </button>
      </div>

      <UButton
        variant="soft"
        icon="i-lucide-sparkles"
        size="sm"
        :loading="loadingPrompt"
        @click="generatePrompt"
      >
        {{ analysisData ? 'Оновити аналіз' : 'Аналізувати' }}
      </UButton>

      <UButton
        v-if="showPromptPanel"
        variant="soft"
        icon="i-lucide-clipboard-paste"
        size="sm"
        @click="showPastePanel = !showPastePanel"
      >
        Вставити відповідь
      </UButton>
    </div>

    <!-- Prompt editor -->
    <div v-if="showPromptPanel" class="space-y-2">
      <div class="flex items-center justify-between">
        <p class="text-xs font-semibold text-gray-500">
          Промпт — скопіюй і встав у claude.ai
        </p>
        <UButton variant="ghost" icon="i-lucide-copy" size="xs" @click="copyPrompt">
          Копіювати
        </UButton>
      </div>
      <UTextarea
        v-model="promptText"
        :rows="12"
        class="font-mono text-xs w-full"
      />
    </div>

    <!-- Paste response -->
    <div v-if="showPastePanel" class="space-y-2">
      <p class="text-xs font-semibold text-gray-500">
        Встав JSON-відповідь від Claude:
      </p>
      <UTextarea
        v-model="pasteText"
        :rows="8"
        placeholder='{ "company_score": 8, "recruiter_score": 7, ... }'
        class="font-mono text-xs w-full"
        autofocus
      />
      <div class="flex gap-2 justify-end">
        <UButton variant="ghost" size="sm" @click="showPastePanel = false; pasteText = ''">
          Скасувати
        </UButton>
        <UButton
          size="sm"
          :loading="saving"
          :disabled="!pasteText.trim()"
          @click="saveResult"
        >
          Зберегти
        </UButton>
      </div>
    </div>
  </div>
</template>
