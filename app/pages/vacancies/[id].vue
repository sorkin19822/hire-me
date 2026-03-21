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

// Messages timeline ref
const timeline = ref<{ refresh: () => Promise<void> } | null>(null)

// Recruiters
const { data: recruitersList, refresh: refreshRecruiters } = await useFetch(`/api/recruiters?vacancy_id=${id}`)

const showAddRecruiter = ref(false)
const recruiterForm = reactive({ name: '', telegram: '', email: '', linkedin: '' })
const recruiterSaving = ref(false)

async function addRecruiter() {
  if (!recruiterForm.name) return
  recruiterSaving.value = true
  try {
    await $fetch('/api/recruiters', {
      method: 'POST',
      body: {
        vacancyId: Number(id),
        name: recruiterForm.name,
        telegram: recruiterForm.telegram || undefined,
        email: recruiterForm.email || undefined,
        linkedin: recruiterForm.linkedin || undefined,
      },
    })
    showAddRecruiter.value = false
    Object.assign(recruiterForm, { name: '', telegram: '', email: '', linkedin: '' })
    await refreshRecruiters()
  }
  finally {
    recruiterSaving.value = false
  }
}

async function deleteRecruiter(recruiterId: number) {
  await $fetch(`/api/recruiters/${recruiterId}`, { method: 'DELETE' })
  await refreshRecruiters()
}

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

      <!-- Recruiters -->
      <UCard class="mb-4">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="font-semibold">Рекрутери</span>
            <UButton
              variant="ghost"
              icon="i-lucide-plus"
              size="xs"
              @click="showAddRecruiter = !showAddRecruiter"
            />
          </div>
        </template>

        <!-- Add recruiter form -->
        <div v-if="showAddRecruiter" class="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 space-y-2">
          <UInput v-model="recruiterForm.name" placeholder="Ім'я *" size="sm" />
          <UInput v-model="recruiterForm.telegram" placeholder="@telegram" size="sm" />
          <UInput v-model="recruiterForm.email" placeholder="email@example.com" size="sm" type="email" />
          <UInput v-model="recruiterForm.linkedin" placeholder="LinkedIn URL" size="sm" />
          <div class="flex gap-2 justify-end">
            <UButton size="xs" variant="ghost" @click="showAddRecruiter = false">
              Скасувати
            </UButton>
            <UButton size="xs" :loading="recruiterSaving" :disabled="!recruiterForm.name" @click="addRecruiter">
              Додати
            </UButton>
          </div>
        </div>

        <div v-if="recruitersList?.length">
          <div
            v-for="r in recruitersList"
            :key="r.id"
            class="flex items-center justify-between border-b last:border-0 border-gray-100 dark:border-gray-700"
          >
            <RecruiterCard :recruiter="r" />
            <UButton
              variant="ghost"
              icon="i-lucide-trash-2"
              size="xs"
              color="error"
              class="shrink-0"
              @click="deleteRecruiter(r.id)"
            />
          </div>
        </div>
        <p v-else-if="!showAddRecruiter" class="text-sm text-gray-400">
          Рекрутери не додані
        </p>
      </UCard>

      <!-- Messages timeline -->
      <UCard class="mb-4">
        <template #header>
          <span class="font-semibold">Переписка</span>
        </template>
        <MessagesTimeline ref="timeline" :vacancy-id="Number(id)" />
        <ManualMessageForm
          :vacancy-id="Number(id)"
          :recruiters="(recruitersList ?? []).map((r: { id: number, name: string }) => ({ id: r.id, name: r.name }))"
          class="mt-4"
          @saved="timeline?.refresh()"
        />
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
