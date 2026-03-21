<script setup lang="ts">
useSeoMeta({ title: 'Імпорт CSV — hire-me' })

const file = ref<File | null>(null)
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
      { method: 'POST', body: form },
    )
    result.value = data
  }
  catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : 'Помилка імпорту'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <UContainer class="py-10 max-w-xl">
    <UCard>
      <template #header>
        <h1 class="text-xl font-semibold">
          Імпорт вакансій з CSV
        </h1>
        <p class="text-sm text-gray-500 mt-1">
          Завантаж CSV-файл з Google Sheets. Формат: без заголовку, 11 колонок.
        </p>
      </template>

      <div class="space-y-4">
        <input
          type="file"
          accept=".csv"
          class="block w-full text-sm text-gray-700 dark:text-gray-300
                 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700
                 hover:file:bg-primary-100 dark:file:bg-primary-900 dark:file:text-primary-300"
          @change="onFileChange"
        >

        <UButton
          :loading="loading"
          :disabled="!file || loading"
          icon="i-lucide-upload"
          block
          @click="doImport"
        >
          Імпортувати
        </UButton>
      </div>

      <!-- Error -->
      <UAlert
        v-if="errorMsg"
        color="error"
        variant="soft"
        :title="errorMsg"
        icon="i-lucide-alert-circle"
        class="mt-4"
      />

      <!-- Result -->
      <template v-if="result">
        <div class="grid grid-cols-2 gap-4 mt-6 text-center">
          <div class="p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
            <div class="text-2xl font-bold">
              {{ result.total }}
            </div>
            <div class="text-sm text-gray-500">
              Всього
            </div>
          </div>
          <div class="p-4 rounded-lg bg-green-50 dark:bg-green-900/30">
            <div class="text-2xl font-bold text-green-600 dark:text-green-400">
              {{ result.imported }}
            </div>
            <div class="text-sm text-gray-500">
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
          class="mt-4"
        >
          Перейти до Kanban
        </UButton>
      </template>
    </UCard>
  </UContainer>
</template>
