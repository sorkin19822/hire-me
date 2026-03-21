<script setup lang="ts">
const route = useRoute()
const id = route.params.id as string

const { data: vacancy, refresh } = await useFetch(`/api/vacancies/${id}`)
const { data: stages } = await useFetch('/api/pipeline-stages')

if (!vacancy.value) {
  throw createError({ statusCode: 404, statusMessage: 'Vacancy not found' })
}

useSeoMeta({ title: `${vacancy.value?.company} — hire-me` })

const stageOptions = computed(() =>
  (stages.value ?? []).map((s: { id: number, name: string, color: string }) => ({
    label: s.name,
    value: s.id,
  })),
)

const selectedStageId = ref(vacancy.value?.stageId ?? null)
const stageSaving = ref(false)

async function changeStage(newId: number | null) {
  stageSaving.value = true
  try {
    await $fetch(`/api/vacancies/${id}`, { method: 'PATCH', body: { stageId: newId } })
    await refresh()
  }
  finally {
    stageSaving.value = false
  }
}

watch(selectedStageId, (val) => {
  if (val !== vacancy.value?.stageId) changeStage(val)
})

// Edit notes inline
const editingNotes = ref(false)
const notesValue = ref(vacancy.value?.notes ?? '')
const notesSaving = ref(false)

async function saveNotes() {
  notesSaving.value = true
  try {
    await $fetch(`/api/vacancies/${id}`, { method: 'PATCH', body: { notes: notesValue.value || null } })
    editingNotes.value = false
    await refresh()
  }
  finally {
    notesSaving.value = false
  }
}
</script>

<template>
  <UContainer class="py-6 max-w-3xl">
    <div class="flex items-center gap-2 mb-6">
      <UButton to="/vacancies" variant="ghost" icon="i-lucide-arrow-left" size="sm">
        Вакансії
      </UButton>
    </div>

    <template v-if="vacancy">
      <div class="flex items-start justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold">
            {{ vacancy.company }}
          </h1>
          <p class="text-lg text-gray-600 dark:text-gray-400">
            {{ vacancy.position }}
          </p>
        </div>

        <div class="flex items-center gap-2">
          <USelect
            v-model="selectedStageId"
            :items="stageOptions"
            value-key="value"
            label-key="label"
            :loading="stageSaving"
            class="w-44"
          />
        </div>
      </div>

      <!-- Fields grid -->
      <UCard class="mb-4">
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-500">Дата відгуку</span>
            <p class="font-medium">
              {{ vacancy.applyDate ?? '—' }}
            </p>
          </div>
          <div>
            <span class="text-gray-500">Повідомлень</span>
            <p class="font-medium">
              {{ vacancy.messagesCount }}
            </p>
          </div>
          <div v-if="vacancy.urlDou">
            <span class="text-gray-500">DOU</span>
            <p><a :href="vacancy.urlDou" target="_blank" class="text-primary hover:underline">Відкрити</a></p>
          </div>
          <div v-if="vacancy.urlLinkedin">
            <span class="text-gray-500">LinkedIn</span>
            <p><a :href="vacancy.urlLinkedin" target="_blank" class="text-primary hover:underline">Відкрити</a></p>
          </div>
          <div v-if="vacancy.urlSite">
            <span class="text-gray-500">Сайт</span>
            <p><a :href="vacancy.urlSite" target="_blank" class="text-primary hover:underline">Відкрити</a></p>
          </div>
          <div>
            <span class="text-gray-500">Додано</span>
            <p class="font-medium">
              {{ vacancy.createdAt?.slice(0, 10) }}
            </p>
          </div>
        </div>
      </UCard>

      <!-- Notes -->
      <UCard class="mb-4">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="font-semibold">Нотатки</span>
            <UButton
              v-if="!editingNotes"
              variant="ghost"
              icon="i-lucide-pencil"
              size="xs"
              @click="editingNotes = true; notesValue = vacancy.notes ?? ''"
            />
          </div>
        </template>
        <div v-if="!editingNotes">
          <p v-if="vacancy.notes" class="text-sm whitespace-pre-wrap">
            {{ vacancy.notes }}
          </p>
          <p v-else class="text-sm text-gray-400">
            Нотатки відсутні
          </p>
        </div>
        <div v-else class="space-y-2">
          <UTextarea v-model="notesValue" :rows="4" autofocus />
          <div class="flex gap-2 justify-end">
            <UButton variant="ghost" size="sm" @click="editingNotes = false">
              Скасувати
            </UButton>
            <UButton size="sm" :loading="notesSaving" @click="saveNotes">
              Зберегти
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Recruiters placeholder -->
      <UCard class="mb-4">
        <template #header>
          <span class="font-semibold">Рекрутери</span>
        </template>
        <div v-if="vacancy.recruiters?.length">
          <div v-for="r in vacancy.recruiters" :key="r.id" class="flex items-center gap-2 py-1 text-sm">
            <UIcon name="i-lucide-user" />
            <span>{{ r.name }}</span>
            <span v-if="r.telegram" class="text-gray-400">{{ r.telegram }}</span>
          </div>
        </div>
        <p v-else class="text-sm text-gray-400">
          Рекрутери не додані
        </p>
      </UCard>

      <!-- Messages placeholder -->
      <UCard class="mb-4">
        <template #header>
          <span class="font-semibold">Повідомлення</span>
        </template>
        <p class="text-sm text-gray-400">
          Таймлайн повідомлень — буде у наступній ітерації
        </p>
      </UCard>

      <!-- AI analysis placeholder -->
      <UCard>
        <template #header>
          <span class="font-semibold">AI Аналіз</span>
        </template>
        <div v-if="vacancy.lastAnalysis">
          <p class="text-sm">
            {{ vacancy.lastAnalysis.summary }}
          </p>
        </div>
        <div v-else class="flex items-center justify-between">
          <p class="text-sm text-gray-400">
            Аналіз не виконано
          </p>
          <UButton variant="soft" icon="i-lucide-sparkles" size="sm" disabled>
            Аналізувати
          </UButton>
        </div>
      </UCard>
    </template>
  </UContainer>
</template>
