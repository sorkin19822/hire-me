<script setup lang="ts">
const route = useRoute()
const id = route.params.id as string

const { data: vacancy, refresh } = await useFetch(`/api/vacancies/${id}`)
const { data: stages } = await useFetch('/api/pipeline-stages')
const { data: cvList } = await useFetch('/api/cv-versions')

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

// CV version selector
const cvOptions = computed(() =>
  [{ label: '— без CV —', value: null as number | null }].concat(
    (cvList.value ?? []).map((cv: { id: number, filename: string }) => ({
      label: cv.filename,
      value: cv.id as number | null,
    })),
  ),
)

const selectedCvId = ref<number | null>(vacancy.value?.cvVersionId ?? null)
const cvSaving = ref(false)

async function changeCv(newId: number | null) {
  cvSaving.value = true
  try {
    await $fetch(`/api/vacancies/${id}`, { method: 'PATCH', body: { cvVersionId: newId } })
    await refresh()
  }
  finally {
    cvSaving.value = false
  }
}

watch(selectedCvId, (val) => {
  if (val !== vacancy.value?.cvVersionId) changeCv(val)
})

// Edit links inline
const editingLinks = ref(false)
const linksValue = reactive({
  urlDou: vacancy.value?.urlDou ?? '',
  urlSite: vacancy.value?.urlSite ?? '',
})
const linksSaving = ref(false)

async function saveLinks() {
  linksSaving.value = true
  try {
    await $fetch(`/api/vacancies/${id}`, {
      method: 'PATCH',
      body: {
        urlDou: linksValue.urlDou || null,
        urlSite: linksValue.urlSite || null,
      },
    })
    editingLinks.value = false
    await refresh()
  }
  finally {
    linksSaving.value = false
  }
}

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
          <h1 class="text-2xl font-bold text-dark dark:text-white">
            {{ vacancy.company }}
          </h1>
          <p class="text-lg text-gray-500 dark:text-gray-400">
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
      <UCard class="mb-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-none">
        <div class="grid grid-cols-2 gap-6 text-sm">
          <div class="flex flex-col gap-1.5">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Дата відгуку</span>
            <p class="font-medium text-dark dark:text-white">
              {{ vacancy.applyDate ?? '—' }}
            </p>
          </div>
          <div class="flex flex-col gap-1.5">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Повідомлень</span>
            <p class="font-medium text-dark dark:text-white">
              {{ vacancy.messagesCount }}
            </p>
          </div>
          <div class="flex flex-col gap-1.5">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Додано</span>
            <p class="font-medium text-dark dark:text-white">
              {{ vacancy.createdAt?.slice(0, 10) }}
            </p>
          </div>
          <div class="col-span-2 flex flex-col gap-1.5">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Версія CV</span>
            <USelect
              v-model="selectedCvId"
              :items="cvOptions"
              value-key="value"
              label-key="label"
              :loading="cvSaving"
              class="mt-1 w-full"
              size="sm"
            />
          </div>
        </div>
      </UCard>

      <!-- Links -->
      <UCard class="mb-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-none">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="text-lg font-semibold text-dark dark:text-white">Посилання</span>
            <UButton
              v-if="!editingLinks"
              variant="ghost"
              icon="i-lucide-pencil"
              size="xs"
              @click="editingLinks = true; Object.assign(linksValue, { urlDou: vacancy.urlDou ?? '', urlSite: vacancy.urlSite ?? '' })"
            />
          </div>
        </template>

        <div v-if="!editingLinks" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Посилання на вакансію</span>
            <UButton v-if="vacancy.urlDou" :href="vacancy.urlDou" target="_blank" variant="link" size="xs" icon="i-lucide-external-link" class="justify-start">
              Відкрити
            </UButton>
            <span v-else class="text-sm text-gray-400 dark:text-gray-500">—</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Сайт компанії</span>
            <UButton v-if="vacancy.urlSite" :href="vacancy.urlSite" target="_blank" variant="link" size="xs" icon="i-lucide-external-link" class="justify-start">
              Відкрити
            </UButton>
            <span v-else class="text-sm text-gray-400 dark:text-gray-500">—</span>
          </div>
        </div>

        <div v-else class="flex flex-col gap-4">
          <div class="grid grid-cols-1 gap-3">
            <UFormField label="Посилання на вакансію">
              <UInput v-model="linksValue.urlDou" placeholder="https://jobs.dou.ua/... або будь-яке інше" class="w-full" />
            </UFormField>
            <UFormField label="Сайт компанії">
              <UInput v-model="linksValue.urlSite" placeholder="https://company.com" class="w-full" />
            </UFormField>
          </div>
          <div class="flex gap-2 justify-end">
            <UButton variant="ghost" size="sm" @click="editingLinks = false">
              Скасувати
            </UButton>
            <UButton size="sm" :loading="linksSaving" @click="saveLinks">
              Зберегти
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Notes -->
      <UCard class="mb-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-none">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="text-lg font-semibold text-dark dark:text-white">Нотатки</span>
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
          <p v-if="vacancy.notes" class="text-sm whitespace-pre-wrap text-dark dark:text-white">
            {{ vacancy.notes }}
          </p>
          <p v-else class="text-sm text-gray-400 dark:text-gray-500">
            Нотатки відсутні
          </p>
        </div>
        <div v-else class="flex flex-col gap-6">
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300 block">
              Нотатки
            </label>
            <UTextarea
              v-model="notesValue"
              :rows="4"
              autofocus
              placeholder="Додайте нотатки про вакансію..."
              class="w-full rounded-md border border-gray-200 dark:border-gray-600 bg-transparent px-3 py-2 text-sm shadow-none transition-[color,box-shadow] placeholder:text-gray-400 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-0"
            />
          </div>
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
      <UCard class="mb-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-none">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="text-lg font-semibold text-dark dark:text-white">Рекрутери</span>
            <UButton
              variant="ghost"
              icon="i-lucide-plus"
              size="xs"
              @click="showAddRecruiter = !showAddRecruiter"
            />
          </div>
        </template>

        <!-- Add recruiter form -->
        <div v-if="showAddRecruiter" class="mb-4">
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-4">
            <UFormField label="Ім'я" required>
              <UInput v-model="recruiterForm.name" placeholder="Ім'я рекрутера" class="w-full" />
            </UFormField>
            <UFormField label="Telegram">
              <UInput v-model="recruiterForm.telegram" placeholder="@username" class="w-full" />
            </UFormField>
            <UFormField label="Email">
              <UInput v-model="recruiterForm.email" type="email" placeholder="email@example.com" class="w-full" />
            </UFormField>
            <UFormField label="LinkedIn">
              <UInput v-model="recruiterForm.linkedin" placeholder="https://linkedin.com/in/..." class="w-full" />
            </UFormField>
          </div>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" color="error" @click="showAddRecruiter = false">
              Скасувати
            </UButton>
            <UButton :loading="recruiterSaving" :disabled="!recruiterForm.name" @click="addRecruiter">
              Зберегти
            </UButton>
          </div>
        </div>

        <div v-if="recruitersList?.length">
          <div
            v-for="r in recruitersList"
            :key="r.id"
            class="flex items-center justify-between border-b last:border-0 border-gray-100 dark:border-gray-700"
          >
            <RecruiterCard
              :recruiter="r"
              :vacancy-id="Number(id)"
              @synced="timeline?.refresh()"
            />
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
        <p v-else-if="!showAddRecruiter" class="text-sm text-gray-400 dark:text-gray-500">
          Рекрутери не додані
        </p>
      </UCard>

      <!-- Messages timeline -->
      <UCard class="mb-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-none">
        <template #header>
          <span class="text-lg font-semibold text-dark dark:text-white">Переписка</span>
        </template>
        <MessagesTimeline ref="timeline" :vacancy-id="Number(id)" />
        <ManualMessageForm
          :vacancy-id="Number(id)"
          :recruiters="(recruitersList ?? []).map((r: { id: number, name: string }) => ({ id: r.id, name: r.name }))"
          class="mt-4"
          @saved="timeline?.refresh()"
        />
      </UCard>

      <!-- AI analysis -->
      <UCard class="rounded-lg border border-gray-200 dark:border-gray-700 shadow-none">
        <template #header>
          <span class="text-lg font-semibold text-dark dark:text-white">AI Аналіз</span>
        </template>
        <AIAnalysisCard :vacancy-id="Number(id)" />
      </UCard>
    </template>
  </UContainer>
</template>
