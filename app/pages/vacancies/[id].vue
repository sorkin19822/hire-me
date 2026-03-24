<script setup lang="ts">
import type { CalendarDate } from '@internationalized/date'
import { parseDate } from '@internationalized/date'
import { getFaviconUrl } from '~/composables/useFavicon'

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
    value: s.id
  }))
)

const selectedStageId = ref<number | undefined>(vacancy.value?.stageId ?? undefined)
const stageSaving = ref(false)

async function changeStage(newId: number | null) {
  stageSaving.value = true
  try {
    await $fetch(`/api/vacancies/${id}`, { method: 'PATCH', body: { stageId: newId } })
    await refresh()
  } finally {
    stageSaving.value = false
  }
}

watch(selectedStageId, (val) => {
  if (val !== vacancy.value?.stageId) changeStage(val ?? null)
})

// Edit company/position
const editingTitle = ref(false)
const titleForm = reactive({ company: '', position: '' })
const titleSaving = ref(false)

async function saveTitle() {
  if (!titleForm.company) return
  titleSaving.value = true
  try {
    await $fetch(`/api/vacancies/${id}`, {
      method: 'PATCH',
      body: { company: titleForm.company, position: titleForm.position || null }
    })
    editingTitle.value = false
    await refresh()
  } finally {
    titleSaving.value = false
  }
}

// Apply date picker
const applyDateOpen = ref(false)
const applyDateValue = computed({
  get() {
    if (!vacancy.value?.applyDate) return undefined
    try {
      return parseDate(vacancy.value.applyDate)
    } catch { return undefined }
  },
  set(val: CalendarDate | undefined) {
    if (!val) return
    const str = val.toString()
    if (str === vacancy.value?.applyDate) return
    $fetch(`/api/vacancies/${id}`, { method: 'PATCH', body: { applyDate: str } })
      .then(() => {
        refresh()
        applyDateOpen.value = false
      })
  }
})

// CV version selector (0 = no CV, USelect doesn't support null as value)
const cvOptions = computed(() =>
  [{ label: '— без CV —', value: 0 }, ...(cvList.value ?? []).map((cv: { id: number, filename: string, comment: string | null }) => ({
    label: cv.comment ? `${cv.filename} — ${cv.comment}` : cv.filename,
    value: cv.id
  }))]
)

const selectedCvId = ref<number>(vacancy.value?.cvVersionId ?? 0)
const cvSaving = ref(false)

watch(selectedCvId, async (val) => {
  cvSaving.value = true
  try {
    await $fetch(`/api/vacancies/${id}`, { method: 'PATCH', body: { cvVersionId: val || null } })
    await refresh()
  } finally {
    cvSaving.value = false
  }
})

// Edit links inline
const editingLinks = ref(false)
const linksValue = reactive({
  urlDou: vacancy.value?.urlDou ?? '',
  urlSite: vacancy.value?.urlSite ?? ''
})
const linksSaving = ref(false)

async function saveLinks() {
  linksSaving.value = true
  try {
    await $fetch(`/api/vacancies/${id}`, {
      method: 'PATCH',
      body: {
        urlDou: linksValue.urlDou || null,
        urlSite: linksValue.urlSite || null
      }
    })
    editingLinks.value = false
    await refresh()
  } finally {
    linksSaving.value = false
  }
}

// Edit description inline
const editingDescription = ref(false)
const descriptionValue = ref(vacancy.value?.description ?? '')
const descriptionSaving = ref(false)

async function saveDescription() {
  descriptionSaving.value = true
  try {
    await $fetch(`/api/vacancies/${id}`, { method: 'PATCH', body: { description: descriptionValue.value || null } })
    editingDescription.value = false
    await refresh()
  } finally {
    descriptionSaving.value = false
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

const editingRecruiter = ref<{ id: number, name: string, telegram: string | null, email: string | null, linkedin: string | null } | null>(null)

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
        linkedin: recruiterForm.linkedin || undefined
      }
    })
    showAddRecruiter.value = false
    Object.assign(recruiterForm, { name: '', telegram: '', email: '', linkedin: '' })
    await refreshRecruiters()
  } finally {
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
  } finally {
    notesSaving.value = false
  }
}
</script>

<template>
  <UContainer class="py-6 max-w-3xl">
    <div class="flex items-center gap-2 mb-6">
      <UButton
        to="/vacancies"
        variant="ghost"
        icon="i-lucide-arrow-left"
        size="sm"
      >
        Вакансії
      </UButton>
    </div>

    <template v-if="vacancy">
      <div class="flex items-start justify-between mb-6">
        <div class="flex-1 min-w-0 mr-4">
          <div
            v-if="!editingTitle"
            class="group flex items-start gap-2"
          >
            <img
              v-if="getFaviconUrl(vacancy.urlSite)"
              :src="getFaviconUrl(vacancy.urlSite)!"
              class="w-6 h-6 rounded-sm mt-1 shrink-0"
              :alt="vacancy.company"
              @error="($event.target as HTMLImageElement).style.display = 'none'"
            >
            <div>
              <h1 class="text-2xl font-bold text-[oklch(32.70%_0.035_260.11)] dark:text-white">
                {{ vacancy.company }}
              </h1>
              <p class="text-lg text-[oklch(52.16%_0.047_260.80)] dark:text-[oklch(64.54%_0.049_258.74)]">
                {{ vacancy.position }}
              </p>
            </div>
            <UButton
              variant="ghost"
              icon="i-lucide-pencil"
              size="xs"
              class="mt-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              @click="editingTitle = true; Object.assign(titleForm, { company: vacancy.company ?? '', position: vacancy.position ?? '' })"
            />
          </div>
          <div
            v-else
            class="flex flex-col gap-2"
          >
            <UInput
              v-model="titleForm.company"
              placeholder="Назва компанії"
              autofocus
              class="text-xl font-bold"
            />
            <UInput
              v-model="titleForm.position"
              placeholder="Посада"
            />
            <div class="flex gap-2">
              <UButton
                variant="ghost"
                size="sm"
                @click="editingTitle = false"
              >
                Скасувати
              </UButton>
              <UButton
                size="sm"
                :loading="titleSaving"
                :disabled="!titleForm.company"
                @click="saveTitle"
              >
                Зберегти
              </UButton>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <UTooltip
            text="Поточний етап розгляду вашої кандидатури"
            :delay-duration="400"
          >
            <UIcon
              name="i-lucide-help-circle"
              class="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0"
            />
          </UTooltip>
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
      <UCard
        class="mb-4 rounded-[7px] border-0"
        style="box-shadow: rgba(145,158,171,0.2) 0px 0px 2px 0px, rgba(145,158,171,0.12) 0px 12px 24px -4px;"
      >
        <div class="grid grid-cols-2 gap-6 text-sm">
          <div class="flex flex-col gap-1.5">
            <div class="flex items-center gap-1">
              <span class="text-sm font-medium text-[oklch(52.16%_0.047_260.80)] dark:text-[oklch(64.54%_0.049_258.74)]">Дата відгуку</span>
              <UTooltip
                text="Дата, коли ви подали заявку на цю вакансію"
                :delay-duration="400"
              >
                <UIcon
                  name="i-lucide-help-circle"
                  class="w-3.5 h-3.5 text-gray-400 dark:text-gray-500"
                />
              </UTooltip>
            </div>
            <UPopover v-model:open="applyDateOpen">
              <UButton
                variant="ghost"
                icon="i-lucide-calendar"
                size="xs"
                class="justify-start px-0 font-medium text-dark dark:text-white"
              >
                {{ vacancy.applyDate ?? 'Вибрати дату' }}
              </UButton>
              <template #content>
                <UCalendar v-model="applyDateValue" />
              </template>
            </UPopover>
          </div>
          <div class="flex flex-col gap-1.5">
            <div class="flex items-center gap-1">
              <span class="text-sm font-medium text-[oklch(52.16%_0.047_260.80)] dark:text-[oklch(64.54%_0.049_258.74)]">Повідомлень</span>
              <UTooltip
                text="Кількість повідомлень у листуванні з рекрутером"
                :delay-duration="400"
              >
                <UIcon
                  name="i-lucide-help-circle"
                  class="w-3.5 h-3.5 text-gray-400 dark:text-gray-500"
                />
              </UTooltip>
            </div>
            <p class="font-medium text-[oklch(32.70%_0.035_260.11)] dark:text-white">
              {{ vacancy.messagesCount }}
            </p>
          </div>
          <div class="flex flex-col gap-1.5">
            <div class="flex items-center gap-1">
              <span class="text-sm font-medium text-[oklch(52.16%_0.047_260.80)] dark:text-[oklch(64.54%_0.049_258.74)]">Додано</span>
              <UTooltip
                text="Дата додавання вакансії до системи"
                :delay-duration="400"
              >
                <UIcon
                  name="i-lucide-help-circle"
                  class="w-3.5 h-3.5 text-gray-400 dark:text-gray-500"
                />
              </UTooltip>
            </div>
            <p class="font-medium text-[oklch(32.70%_0.035_260.11)] dark:text-white">
              {{ vacancy.createdAt?.slice(0, 10) }}
            </p>
          </div>
          <div class="col-span-2 flex flex-col gap-1.5">
            <div class="flex items-center gap-1">
              <span class="text-sm font-medium text-[oklch(52.16%_0.047_260.80)] dark:text-[oklch(64.54%_0.049_258.74)]">Версія CV</span>
              <UTooltip
                text="Резюме, яке ви надіслали на цю вакансію"
                :delay-duration="400"
              >
                <UIcon
                  name="i-lucide-help-circle"
                  class="w-3.5 h-3.5 text-gray-400 dark:text-gray-500"
                />
              </UTooltip>
            </div>
            <div class="flex items-center gap-2 mt-1">
              <USelect
                v-model="selectedCvId"
                :items="cvOptions"
                value-key="value"
                label-key="label"
                :loading="cvSaving"
                class="flex-1"
                size="sm"
              />
              <UButton
                v-if="selectedCvId"
                :href="`/api/cv-versions/${selectedCvId}/file`"
                target="_blank"
                external
                variant="ghost"
                icon="i-lucide-eye"
                size="sm"
              />
            </div>
          </div>
        </div>
      </UCard>

      <!-- Links -->
      <UCard
        class="mb-4 rounded-[7px] border-0"
        style="box-shadow: rgba(145,158,171,0.2) 0px 0px 2px 0px, rgba(145,158,171,0.12) 0px 12px 24px -4px;"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <span class="text-[15px] font-semibold text-[oklch(32.70%_0.035_260.11)] dark:text-white">Посилання</span>
              <UTooltip
                text="Посилання на оголошення вакансії та сайт компанії"
                :delay-duration="400"
              >
                <UIcon
                  name="i-lucide-help-circle"
                  class="w-4 h-4 text-gray-400 dark:text-gray-500"
                />
              </UTooltip>
            </div>
            <UButton
              v-if="!editingLinks"
              variant="ghost"
              icon="i-lucide-pencil"
              size="xs"
              @click="editingLinks = true; Object.assign(linksValue, { urlDou: vacancy.urlDou ?? '', urlSite: vacancy.urlSite ?? '' })"
            />
          </div>
        </template>

        <div
          v-if="!editingLinks"
          class="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Посилання на вакансію</span>
            <UButton
              v-if="vacancy.urlDou"
              :href="vacancy.urlDou"
              target="_blank"
              variant="link"
              size="xs"
              icon="i-lucide-external-link"
              class="justify-start"
            >
              Відкрити
            </UButton>
            <span
              v-else
              class="text-sm text-gray-400 dark:text-gray-500"
            >—</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Сайт компанії</span>
            <UButton
              v-if="vacancy.urlSite"
              :href="vacancy.urlSite"
              target="_blank"
              variant="link"
              size="xs"
              icon="i-lucide-external-link"
              class="justify-start"
            >
              Відкрити
            </UButton>
            <span
              v-else
              class="text-sm text-gray-400 dark:text-gray-500"
            >—</span>
          </div>
        </div>

        <div
          v-else
          class="flex flex-col gap-4"
        >
          <div class="grid grid-cols-1 gap-3">
            <UFormField label="Посилання на вакансію">
              <UInput
                v-model="linksValue.urlDou"
                placeholder="https://jobs.dou.ua/... або будь-яке інше"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Сайт компанії">
              <UInput
                v-model="linksValue.urlSite"
                placeholder="https://company.com"
                class="w-full"
              />
            </UFormField>
          </div>
          <div class="flex gap-2 justify-end">
            <UButton
              variant="ghost"
              size="sm"
              @click="editingLinks = false"
            >
              Скасувати
            </UButton>
            <UButton
              size="sm"
              :loading="linksSaving"
              @click="saveLinks"
            >
              Зберегти
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Description -->
      <UCard
        class="mb-4 rounded-[7px] border-0"
        style="box-shadow: rgba(145,158,171,0.2) 0px 0px 2px 0px, rgba(145,158,171,0.12) 0px 12px 24px -4px;"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <span class="text-[15px] font-semibold text-[oklch(32.70%_0.035_260.11)] dark:text-white">Опис вакансії</span>
              <UTooltip
                text="Повний текст оголошення — використовується для AI аналізу"
                :delay-duration="400"
              >
                <UIcon
                  name="i-lucide-help-circle"
                  class="w-4 h-4 text-gray-400 dark:text-gray-500"
                />
              </UTooltip>
            </div>
            <UButton
              v-if="!editingDescription"
              variant="ghost"
              icon="i-lucide-pencil"
              size="xs"
              @click="editingDescription = true; descriptionValue = vacancy.description ?? ''"
            />
          </div>
        </template>
        <div v-if="!editingDescription">
          <!-- eslint-disable vue/no-v-html -->
          <div
            v-if="vacancy.description"
            class="prose-content"
            v-html="vacancy.description"
          />
          <!-- eslint-enable vue/no-v-html -->
          <p
            v-else
            class="text-sm text-gray-400 dark:text-gray-500"
          >
            Опис відсутній
          </p>
        </div>
        <div
          v-else
          class="flex flex-col gap-4"
        >
          <ClientOnly>
            <RichTextEditor
              v-model="descriptionValue"
              class="w-full"
            />
          </ClientOnly>
          <div class="flex gap-2 justify-end">
            <UButton
              variant="ghost"
              size="sm"
              @click="editingDescription = false"
            >
              Скасувати
            </UButton>
            <UButton
              size="sm"
              :loading="descriptionSaving"
              @click="saveDescription"
            >
              Зберегти
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Notes -->
      <UCard
        class="mb-4 rounded-[7px] border-0"
        style="box-shadow: rgba(145,158,171,0.2) 0px 0px 2px 0px, rgba(145,158,171,0.12) 0px 12px 24px -4px;"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <span class="text-[15px] font-semibold text-[oklch(32.70%_0.035_260.11)] dark:text-white">Нотатки</span>
              <UTooltip
                text="Особисті нотатки про вакансію: враження від співбесіди, умови, питання тощо"
                :delay-duration="400"
              >
                <UIcon
                  name="i-lucide-help-circle"
                  class="w-4 h-4 text-gray-400 dark:text-gray-500"
                />
              </UTooltip>
            </div>
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
          <p
            v-if="vacancy.notes"
            class="text-sm whitespace-pre-wrap text-[oklch(32.70%_0.035_260.11)] dark:text-white"
          >
            {{ vacancy.notes }}
          </p>
          <p
            v-else
            class="text-sm text-gray-400 dark:text-gray-500"
          >
            Нотатки відсутні
          </p>
        </div>
        <div
          v-else
          class="flex flex-col gap-6"
        >
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
            <UButton
              variant="ghost"
              size="sm"
              @click="editingNotes = false"
            >
              Скасувати
            </UButton>
            <UButton
              size="sm"
              :loading="notesSaving"
              @click="saveNotes"
            >
              Зберегти
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Recruiters -->
      <UCard
        class="mb-4 rounded-[7px] border-0"
        style="box-shadow: rgba(145,158,171,0.2) 0px 0px 2px 0px, rgba(145,158,171,0.12) 0px 12px 24px -4px;"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <span class="text-[15px] font-semibold text-[oklch(32.70%_0.035_260.11)] dark:text-white">Рекрутери</span>
              <UTooltip
                text="Контакти рекрутерів по цій вакансії. Можна синхронізувати листування з Telegram"
                :delay-duration="400"
              >
                <UIcon
                  name="i-lucide-help-circle"
                  class="w-4 h-4 text-gray-400 dark:text-gray-500"
                />
              </UTooltip>
            </div>
            <UButton
              variant="ghost"
              icon="i-lucide-plus"
              size="xs"
              @click="showAddRecruiter = !showAddRecruiter"
            />
          </div>
        </template>

        <!-- Add recruiter form -->
        <div
          v-if="showAddRecruiter"
          class="mb-4"
        >
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-4">
            <UFormField
              label="Ім'я"
              required
            >
              <UInput
                v-model="recruiterForm.name"
                placeholder="Ім'я рекрутера"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Telegram">
              <UInput
                v-model="recruiterForm.telegram"
                placeholder="@username"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Email">
              <UInput
                v-model="recruiterForm.email"
                type="email"
                placeholder="email@example.com"
                class="w-full"
              />
            </UFormField>
            <UFormField label="LinkedIn">
              <UInput
                v-model="recruiterForm.linkedin"
                placeholder="https://linkedin.com/in/..."
                class="w-full"
              />
            </UFormField>
          </div>
          <div class="flex justify-end gap-2">
            <UButton
              variant="ghost"
              color="error"
              @click="showAddRecruiter = false"
            >
              Скасувати
            </UButton>
            <UButton
              :loading="recruiterSaving"
              :disabled="!recruiterForm.name"
              @click="addRecruiter"
            >
              Зберегти
            </UButton>
          </div>
        </div>

        <div v-if="recruitersList?.length">
          <div
            v-for="r in recruitersList"
            :key="r.id"
            class="flex items-center justify-between border-b last:border-0 border-[oklch(92.03%_0.015_260.73)] dark:border-[oklch(36.67%_0.041_262.29)]"
          >
            <RecruiterCard
              :recruiter="r"
              :vacancy-id="Number(id)"
              @synced="timeline?.refresh()"
            />
            <div class="flex items-center gap-1 shrink-0">
              <UButton
                variant="ghost"
                icon="i-lucide-pencil"
                size="xs"
                @click="editingRecruiter = r"
              />
              <UButton
                variant="ghost"
                icon="i-lucide-trash-2"
                size="xs"
                color="error"
                @click="deleteRecruiter(r.id)"
              />
            </div>
          </div>
        </div>

        <RecruiterFormModal
          v-if="editingRecruiter"
          :open="!!editingRecruiter"
          :recruiter="editingRecruiter"
          @update:open="(v) => { if (!v) editingRecruiter = null }"
          @saved="refreshRecruiters()"
        />
        <p
          v-else-if="!showAddRecruiter"
          class="text-sm text-gray-400 dark:text-gray-500"
        >
          Рекрутери не додані
        </p>
      </UCard>

      <!-- Messages timeline -->
      <UCard
        class="mb-4 rounded-[7px] border-0"
        style="box-shadow: rgba(145,158,171,0.2) 0px 0px 2px 0px, rgba(145,158,171,0.12) 0px 12px 24px -4px;"
      >
        <template #header>
          <div class="flex items-center gap-1.5">
            <span class="text-[15px] font-semibold text-[oklch(32.70%_0.035_260.11)] dark:text-white">Переписка</span>
            <UTooltip
              text="Хронологія повідомлень з рекрутером. Імпортується з Telegram або вводиться вручну"
              :delay-duration="400"
            >
              <UIcon
                name="i-lucide-help-circle"
                class="w-4 h-4 text-gray-400 dark:text-gray-500"
              />
            </UTooltip>
          </div>
        </template>
        <MessagesTimeline
          ref="timeline"
          :vacancy-id="Number(id)"
        />
        <ManualMessageForm
          :vacancy-id="Number(id)"
          :recruiters="(recruitersList ?? []).map((r: { id: number, name: string }) => ({ id: r.id, name: r.name }))"
          class="mt-4"
          @saved="timeline?.refresh()"
        />
      </UCard>

      <!-- AI analysis -->
      <UCard
        class="rounded-[7px] border-0"
        style="box-shadow: rgba(145,158,171,0.2) 0px 0px 2px 0px, rgba(145,158,171,0.12) 0px 12px 24px -4px;"
      >
        <template #header>
          <div class="flex items-center gap-1.5">
            <span class="text-[15px] font-semibold text-[oklch(32.70%_0.035_260.11)] dark:text-white">AI Аналіз</span>
            <UTooltip
              text="Автоматичний аналіз компанії та рекрутера на основі листування. Генерує промпт для Claude AI"
              :delay-duration="400"
            >
              <UIcon
                name="i-lucide-help-circle"
                class="w-4 h-4 text-gray-400 dark:text-gray-500"
              />
            </UTooltip>
          </div>
        </template>
        <AIAnalysisCard
          :vacancy-id="Number(id)"
          :initial-analysis="vacancy.lastAnalysis"
        />
      </UCard>
    </template>
  </UContainer>
</template>
