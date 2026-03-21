<script setup lang="ts">
useSeoMeta({ title: 'CV версії — hire-me' })

const { data: cvList, refresh } = await useFetch('/api/cv-versions')

const toast = useToast()
const importing = ref(false)
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

async function importFromDrive() {
  importing.value = true
  try {
    await $fetch('/api/integrations/gdrive', { method: 'POST' })
    toast.add({ title: 'CV імпортовано з Google Drive', color: 'success', icon: 'i-simple-icons-googledrive' })
    await refresh()
  }
  catch {
    toast.add({ title: 'Помилка імпорту з Google Drive', color: 'error', icon: 'i-lucide-alert-circle' })
  }
  finally {
    importing.value = false
  }
}

async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploading.value = true
  try {
    const form = new FormData()
    form.append('file', file)
    await $fetch('/api/cv-versions/upload', { method: 'POST', body: form })
    toast.add({ title: `CV завантажено: ${file.name}`, color: 'success', icon: 'i-lucide-file-text' })
    await refresh()
  }
  catch {
    toast.add({ title: 'Помилка завантаження CV', color: 'error', icon: 'i-lucide-alert-circle' })
  }
  finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

const columns = [
  { key: 'filename', label: 'Файл' },
  { key: 'importedAt', label: 'Імпортовано' },
  { key: 'status', label: 'Статус' },
]
</script>

<template>
  <UContainer class="py-6 max-w-3xl">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">
        CV версії
      </h1>
      <div class="flex gap-2">
        <UButton
          variant="soft"
          icon="i-simple-icons-googledrive"
          size="sm"
          :loading="importing"
          @click="importFromDrive"
        >
          З Google Drive
        </UButton>
        <UButton
          variant="soft"
          icon="i-lucide-upload"
          size="sm"
          :loading="uploading"
          @click="fileInput?.click()"
        >
          Завантажити .docx
        </UButton>
        <input
          ref="fileInput"
          type="file"
          accept=".docx"
          class="hidden"
          @change="handleFileUpload"
        >
      </div>
    </div>

    <UCard>
      <UTable :data="cvList ?? []" :columns="columns">
        <template #filename-cell="{ row }">
          <span class="font-medium text-sm">{{ row.filename }}</span>
          <span v-if="row.gdriveId" class="ml-2 text-xs text-gray-400">Drive</span>
        </template>
        <template #importedAt-cell="{ row }">
          <span class="text-sm text-gray-600 dark:text-gray-400">
            {{ row.importedAt?.slice(0, 16).replace('T', ' ') }}
          </span>
        </template>
        <template #status-cell="{ row }">
          <UBadge
            v-if="row.isActive"
            color="success"
            variant="soft"
            size="xs"
          >
            Активне
          </UBadge>
        </template>
      </UTable>

      <p v-if="!cvList?.length" class="text-sm text-gray-400 text-center py-4">
        Немає завантажених CV
      </p>
    </UCard>
  </UContainer>
</template>
