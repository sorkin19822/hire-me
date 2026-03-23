<script setup lang="ts">
useSeoMeta({ title: 'Імпорт CSV — hire-me' })

const file = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const loading = ref(false)
const result = ref<{ total: number, imported: number } | null>(null)
const errorMsg = ref<string | null>(null)

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  file.value = input.files?.[0] ?? null
  result.value = null
  errorMsg.value = null
}

async function doImport() {
  if (!file.value) return
  loading.value = true
  errorMsg.value = null
  result.value = null

  try {
    const form = new FormData()
    form.append('file', file.value)
    const data = await $fetch<{ total: number, imported: number }>(
      '/api/import/csv',
      { method: 'POST', body: form }
    )
    result.value = data
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : 'Помилка імпорту'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UContainer class="py-10 max-w-xl">
    <div
      class="rounded-[7px] bg-white dark:bg-[oklch(27.84%_0.027_257.53)] overflow-hidden"
      style="box-shadow: rgba(145,158,171,0.2) 0px 0px 2px 0px, rgba(145,158,171,0.12) 0px 12px 24px -4px;"
    >
      <!-- Header -->
      <div class="px-6 py-4 border-b border-[oklch(92.03%_0.015_260.73)] dark:border-[oklch(36.67%_0.041_262.29)]">
        <h1 class="text-[15px] font-semibold text-[oklch(32.70%_0.035_260.11)] dark:text-white">
          Імпорт вакансій з CSV
        </h1>
        <p class="text-sm text-[oklch(52.16%_0.047_260.80)] dark:text-[oklch(64.54%_0.049_258.74)] mt-1">
          Завантаж CSV-файл з Google Sheets. Формат: без заголовку, 11 колонок.
        </p>
      </div>

      <!-- Body -->
      <div class="p-6 space-y-4">
        <input
          ref="fileInput"
          type="file"
          accept=".csv"
          class="hidden"
          @change="onFileChange"
        >
        <UButton
          variant="outline"
          icon="i-lucide-file-spreadsheet"
          block
          @click="fileInput?.click()"
        >
          {{ file ? file.name : 'Обрати CSV файл…' }}
        </UButton>

        <UButton
          :loading="loading"
          :disabled="!file || loading"
          icon="i-lucide-upload"
          block
          @click="doImport"
        >
          Імпортувати
        </UButton>

        <!-- Error -->
        <UAlert
          v-if="errorMsg"
          color="error"
          variant="soft"
          :title="errorMsg"
          icon="i-lucide-alert-circle"
        />

        <!-- Result -->
        <template v-if="result">
          <div class="grid grid-cols-2 gap-4 text-center">
            <div
              class="p-4 rounded-[7px]"
              style="background: oklch(65.33% 0.184 266.79 / 8%);"
            >
              <div class="text-2xl font-bold text-[oklch(32.70%_0.035_260.11)] dark:text-white">
                {{ result.total }}
              </div>
              <div class="text-sm text-[oklch(52.16%_0.047_260.80)] dark:text-[oklch(64.54%_0.049_258.74)]">
                Всього
              </div>
            </div>
            <div
              class="p-4 rounded-[7px]"
              style="background: oklch(80.48% 0.150 174.63 / 10%);"
            >
              <div class="text-2xl font-bold text-success">
                {{ result.imported }}
              </div>
              <div class="text-sm text-[oklch(52.16%_0.047_260.80)] dark:text-[oklch(64.54%_0.049_258.74)]">
                Імпортовано
              </div>
            </div>
          </div>

          <UButton
            v-if="result.imported > 0"
            to="/"
            variant="soft"
            icon="i-lucide-kanban"
            block
          >
            Перейти до Kanban
          </UButton>
        </template>
      </div>
    </div>
  </UContainer>
</template>
