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
  <div class="flex flex-row gap-3 overflow-x-auto kanban-scroll min-h-[calc(100vh-64px)] p-5 pb-8 items-start">
    <div
      v-for="stage in stages"
      :key="stage.id"
      class="flex-shrink-0 w-[272px] flex flex-col rounded-[7px] transition-all duration-200"
      :class="dragOverStageId === stage.id
        ? 'ring-2 ring-primary/40 bg-primary/5 dark:bg-primary/10'
        : 'bg-white/60 dark:bg-[oklch(27.84%_0.027_257.53)]/60'"
      style="box-shadow: rgba(145,158,171,0.10) 0px 1px 4px;"
      @dragover="onDragOver($event, stage.id)"
      @dragleave="onDragLeave"
      @drop="onDrop($event, stage.id)"
    >
      <!-- Column header -->
      <div class="flex items-center justify-between px-3 pt-3 pb-1.5">
        <div class="flex items-center gap-2 min-w-0">
          <span
            class="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white dark:ring-[oklch(27.84%_0.027_257.53)]"
            :style="{ backgroundColor: stage.color }"
          />
          <span class="text-[11px] font-bold uppercase tracking-widest text-[oklch(52.16%_0.047_260.80)] dark:text-[oklch(64.54%_0.049_258.74)] truncate">
            {{ stage.name }}
          </span>
        </div>
        <span
          class="text-[11px] font-bold tabular-nums px-1.5 py-0.5 rounded-full"
          :style="{
            backgroundColor: stage.color + '22',
            color: stage.color
          }"
        >
          {{ vacanciesForStage(stage.id).length }}
        </span>
      </div>

      <!-- Thin color accent bar -->
      <div
        class="mx-3 mb-2 h-[3px] rounded-full"
        :style="{ backgroundColor: stage.color + 'cc' }"
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
          class="text-[oklch(52.16%_0.047_260.80)] dark:text-[oklch(64.54%_0.049_258.74)] text-xs"
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
          class="flex flex-col items-center justify-center py-8 text-[oklch(87%_0.01_260)] dark:text-[oklch(40%_0.03_260)]"
        >
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center mb-2"
            :style="{ backgroundColor: stage.color + '18' }"
          >
            <UIcon
              name="i-lucide-inbox"
              class="w-5 h-5"
              :style="{ color: stage.color + 'aa' }"
            />
          </div>
          <p class="text-xs text-[oklch(70%_0.02_260)] dark:text-[oklch(50%_0.02_260)]">
            Немає вакансій
          </p>
        </div>
      </div>

      <!-- Quick add area -->
      <div class="px-2 pb-2">
        <template v-if="quickAdd.stageId === stage.id">
          <div
            class="space-y-1.5 bg-white dark:bg-[oklch(27.84%_0.027_257.53)] rounded-[7px] p-2"
            style="box-shadow: rgba(145,158,171,0.2) 0px 0px 2px 0px, rgba(145,158,171,0.12) 0px 12px 24px -4px;"
          >
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
              class="text-xs text-error"
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
            class="text-[oklch(70%_0.02_260)] hover:text-[oklch(32.70%_0.035_260.11)] dark:text-[oklch(50%_0.03_260)] dark:hover:text-white rounded-[7px] transition-colors"
            @click="openQuickAdd(stage.id)"
          >
            Додати вакансію
          </UButton>
        </template>
      </div>
    </div>
  </div>
</template>
