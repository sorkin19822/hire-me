<script setup lang="ts">
useSeoMeta({ title: 'Kanban — hire-me' })

interface Stage {
  id: number
  name: string
  color: string
  order: number
  isTerminal: boolean
}

interface Vacancy {
  id: number
  company: string
  position: string
  applyDate: string | null
  stageId: number | null
  messagesCount: number
}

const { data: stages } = await useFetch<Stage[]>('/api/pipeline-stages')
const { data: allVacancies, refresh } = await useFetch<Vacancy[]>('/api/vacancies')

// Per-column expanded state
const expandedColumns = ref<Set<number>>(new Set())
const COLUMN_LIMIT = 20

function vacanciesForStage(stageId: number): Vacancy[] {
  return (allVacancies.value ?? []).filter(v => v.stageId === stageId)
}

function visibleVacancies(stageId: number): Vacancy[] {
  const all = vacanciesForStage(stageId)
  return expandedColumns.value.has(stageId) ? all : all.slice(0, COLUMN_LIMIT)
}

function toggleExpand(stageId: number) {
  const s = new Set(expandedColumns.value)
  if (s.has(stageId)) s.delete(stageId)
  else s.add(stageId)
  expandedColumns.value = s
}

// ── Drag and drop ────────────────────────────────────────────────────────────

const draggingId = ref<number | null>(null)
const dragOverStageId = ref<number | null>(null)

function onDragStart(e: DragEvent, vacancyId: number) {
  draggingId.value = vacancyId
  e.dataTransfer?.setData('text/plain', String(vacancyId))
}

function onDragOver(e: DragEvent, stageId: number) {
  e.preventDefault()
  dragOverStageId.value = stageId
}

function onDragLeave() {
  dragOverStageId.value = null
}

function onDragEnd() {
  draggingId.value = null
  dragOverStageId.value = null
}

async function onDrop(e: DragEvent, stageId: number) {
  e.preventDefault()
  dragOverStageId.value = null

  const id = draggingId.value
  draggingId.value = null
  if (!id) return

  const vacancy = allVacancies.value?.find(v => v.id === id)
  if (!vacancy || vacancy.stageId === stageId) return

  // Optimistic update
  const prevStageId = vacancy.stageId
  vacancy.stageId = stageId

  try {
    await $fetch(`/api/vacancies/${id}`, { method: 'PATCH', body: { stageId } })
  } catch {
    // Rollback on failure
    vacancy.stageId = prevStageId
  }
}

// ── Quick add ────────────────────────────────────────────────────────────────

const quickAdd = reactive<{ stageId: number | null, company: string, position: string }>({
  stageId: null,
  company: '',
  position: ''
})
const quickAddSaving = ref(false)
const quickAddError = ref<string | null>(null)

function openQuickAdd(stageId: number) {
  quickAdd.stageId = stageId
  quickAdd.company = ''
  quickAdd.position = ''
  quickAddError.value = null
}

function closeQuickAdd() {
  quickAdd.stageId = null
}

async function submitQuickAdd() {
  if (!quickAdd.company || !quickAdd.position || !quickAdd.stageId) return
  quickAddSaving.value = true
  quickAddError.value = null
  try {
    await $fetch('/api/vacancies', {
      method: 'POST',
      body: { company: quickAdd.company, position: quickAdd.position, stageId: quickAdd.stageId }
    })
    closeQuickAdd()
    await refresh()
  } catch {
    quickAddError.value = 'Помилка збереження'
  } finally {
    quickAddSaving.value = false
  }
}
</script>

<template>
  <div class="flex flex-row gap-3 overflow-x-auto min-h-[calc(100vh-64px)] p-4 pb-8 items-start bg-gray-50 dark:bg-gray-900/40">
    <div
      v-for="stage in stages"
      :key="stage.id"
      class="flex-shrink-0 w-[272px] flex flex-col rounded-2xl transition-all duration-200"
      :class="dragOverStageId === stage.id
        ? 'ring-2 ring-primary-400 bg-primary-50/80 dark:bg-primary-950/30'
        : 'bg-gray-100/80 dark:bg-gray-800/40'"
      @dragover="onDragOver($event, stage.id)"
      @dragleave="onDragLeave"
      @drop="onDrop($event, stage.id)"
    >
      <!-- Column header -->
      <div class="flex items-center justify-between px-3 pt-3 pb-2">
        <div class="flex items-center gap-2 min-w-0">
          <span
            class="w-2 h-2 rounded-full shrink-0"
            :style="{ backgroundColor: stage.color }"
          />
          <span class="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300 truncate">
            {{ stage.name }}
          </span>
        </div>
        <span class="text-xs font-semibold text-gray-400 dark:text-gray-500 tabular-nums">
          {{ vacanciesForStage(stage.id).length }}
        </span>
      </div>

      <!-- Thin color accent bar -->
      <div
        class="mx-3 mb-2 h-0.5 rounded-full opacity-60"
        :style="{ backgroundColor: stage.color }"
      />

      <!-- Cards -->
      <div class="flex-1 flex flex-col gap-2 px-2 pb-2 overflow-y-auto max-h-[calc(100vh-210px)]">
        <VacancyCard
          v-for="v in visibleVacancies(stage.id)"
          :key="v.id"
          :vacancy="v"
          draggable="true"
          @dragstart="onDragStart($event, v.id)"
          @dragend="onDragEnd"
        />

        <!-- Show more -->
        <UButton
          v-if="vacanciesForStage(stage.id).length > COLUMN_LIMIT"
          variant="ghost"
          size="xs"
          block
          class="text-gray-400 dark:text-gray-500 text-xs"
          @click="toggleExpand(stage.id)"
        >
          <template v-if="!expandedColumns.has(stage.id)">
            Показати всі {{ vacanciesForStage(stage.id).length }}
          </template>
          <template v-else>
            Згорнути
          </template>
        </UButton>

        <!-- Empty state -->
        <div
          v-if="vacanciesForStage(stage.id).length === 0"
          class="flex flex-col items-center justify-center py-6 text-gray-300 dark:text-gray-600"
        >
          <UIcon
            name="i-lucide-inbox"
            class="w-6 h-6 mb-1.5"
          />
          <p class="text-xs">
            Немає вакансій
          </p>
        </div>
      </div>

      <!-- Quick add area -->
      <div class="px-2 pb-2">
        <template v-if="quickAdd.stageId === stage.id">
          <div class="space-y-1.5 bg-white dark:bg-gray-800 rounded-xl p-2 shadow-sm">
            <UInput
              v-model="quickAdd.company"
              placeholder="Компанія"
              size="sm"
              autofocus
              @keydown.escape="closeQuickAdd"
            />
            <UInput
              v-model="quickAdd.position"
              placeholder="Позиція"
              size="sm"
              @keydown.enter="submitQuickAdd"
              @keydown.escape="closeQuickAdd"
            />
            <div class="flex gap-1">
              <UButton
                size="xs"
                :loading="quickAddSaving"
                :disabled="!quickAdd.company || !quickAdd.position"
                class="flex-1"
                @click="submitQuickAdd"
              >
                Додати
              </UButton>
              <UButton
                size="xs"
                variant="ghost"
                icon="i-lucide-x"
                @click="closeQuickAdd"
              />
            </div>
            <p
              v-if="quickAddError"
              class="text-xs text-red-500"
            >
              {{ quickAddError }}
            </p>
          </div>
        </template>
        <template v-else>
          <UButton
            variant="ghost"
            icon="i-lucide-plus"
            size="xs"
            block
            class="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-xl"
            @click="openQuickAdd(stage.id)"
          >
            Додати вакансію
          </UButton>
        </template>
      </div>
    </div>
  </div>
</template>
