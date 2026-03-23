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

// Comment editing
const editingCommentId = ref<number | null>(null)
const commentValue = ref('')
const commentSaving = ref(false)

function startEditComment(cv: { id: number, comment: string | null }) {
  editingCommentId.value = cv.id
  commentValue.value = cv.comment ?? ''
}

async function saveComment(id: number) {
  commentSaving.value = true
  try {
    await $fetch(`/api/cv-versions/${id}`, {
      method: 'PATCH',
      body: { comment: commentValue.value || null },
    })
    editingCommentId.value = null
    await refresh()
  }
  finally {
    commentSaving.value = false
  }
}

// Delete
const confirmDeleteId = ref<number | null>(null)
const confirmDeleteName = ref('')
const deleting = ref(false)

function requestDelete(cv: { id: number, filename: string }) {
  confirmDeleteId.value = cv.id
  confirmDeleteName.value = cv.filename
}

async function confirmDelete() {
  if (!confirmDeleteId.value) return
  deleting.value = true
  try {
    await $fetch(`/api/cv-versions/${confirmDeleteId.value}`, { method: 'DELETE' })
    confirmDeleteId.value = null
    await refresh()
  }
  finally {
    deleting.value = false
  }
}
</script>

<template>
  <UContainer class="py-6 max-w-3xl">
    <PageHeader title="CV версії">
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
          Завантажити CV
        </UButton>
        <input
          ref="fileInput"
          type="file"
          accept=".docx,.pdf"
          class="hidden"
          @change="handleFileUpload"
        >
      </div>
    </PageHeader>

    <UCard>
      <div v-if="cvList?.length" class="divide-y divide-gray-100 dark:divide-gray-800">
        <div
          v-for="cv in cvList"
          :key="cv.id"
          class="py-3 flex items-start gap-3"
        >
          <!-- Icon -->
          <UIcon
            :name="cv.filename?.toLowerCase().endsWith('.pdf') ? 'i-lucide-file-text' : 'i-lucide-file'"
            class="w-5 h-5 mt-0.5 shrink-0 text-gray-400"
          />

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-medium text-sm text-gray-900 dark:text-white truncate">{{ cv.filename }}</span>
              <UBadge v-if="cv.isActive" color="success" variant="soft" size="xs">Активне</UBadge>
              <span v-if="cv.gdriveId" class="text-xs text-gray-400">Drive</span>
            </div>
            <p class="text-xs text-gray-400 mt-0.5">
              {{ cv.importedAt?.slice(0, 16).replace('T', ' ') }}
            </p>

            <!-- Comment view -->
            <div v-if="editingCommentId !== cv.id" class="mt-1.5 flex items-center gap-1">
              <span v-if="cv.comment" class="text-sm text-gray-600 dark:text-gray-400">{{ cv.comment }}</span>
              <span v-else class="text-xs text-gray-400 italic">Коментар відсутній</span>
              <UButton
                variant="ghost"
                icon="i-lucide-pencil"
                size="xs"
                class="opacity-0 group-hover:opacity-100 ml-1"
                @click="startEditComment(cv)"
              />
            </div>

            <!-- Comment edit -->
            <div v-else class="mt-1.5 flex items-center gap-2">
              <UInput
                v-model="commentValue"
                placeholder="Додайте коментар…"
                size="xs"
                class="flex-1"
                autofocus
                @keydown.enter="saveComment(cv.id)"
                @keydown.escape="editingCommentId = null"
              />
              <UButton size="xs" :loading="commentSaving" @click="saveComment(cv.id)">
                Зберегти
              </UButton>
              <UButton size="xs" variant="ghost" @click="editingCommentId = null">
                Скасувати
              </UButton>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1 shrink-0">
            <UButton
              variant="ghost"
              icon="i-lucide-pencil"
              size="xs"
              @click="startEditComment(cv)"
            />
            <UButton
              variant="ghost"
              icon="i-lucide-trash-2"
              size="xs"
              color="error"
              @click="requestDelete(cv)"
            />
          </div>
        </div>
      </div>

      <p v-else class="text-sm text-gray-400 text-center py-4">
        Немає завантажених CV
      </p>
    </UCard>

    <ConfirmModal
      v-model:open="!!confirmDeleteId"
      title="Видалити CV?"
      :description="`Файл «${confirmDeleteName}» буде видалено. Цю дію неможливо скасувати.`"
      :loading="deleting"
      @confirm="confirmDelete"
      @update:open="(v) => { if (!v) confirmDeleteId = null }"
    />
  </UContainer>
</template>
