<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { Row, Table } from '@tanstack/vue-table'
import type { TableColumn } from '@nuxt/ui'
import { getFaviconUrl } from '~/composables/useFavicon'

type VacancyRow = {
  id: number
  company: string
  position: string
  applyDate: string | null
  stageId: number | null
  stageName: string | null
  stageColor: string | null
  notes: string | null
  urlDou: string | null
  urlLinkedin: string | null
  urlSite: string | null
  createdAt: string | null
  updatedAt: string | null
  messagesCount: number
}

useSeoMeta({ title: 'Вакансії — hire-me' })

const store = useVacanciesStore()

const { data: stages } = await useFetch('/api/pipeline-stages')

onMounted(() => {
  store.fetchVacancies()
})

const stageOptions = computed(() => [
  { label: 'Всі стадії', value: null },
  ...(stages.value ?? []).map((s: { id: number, name: string }) => ({ label: s.name, value: s.id }))
])

// Row selection
const rowSelection = ref<Record<string, boolean>>({})
const selectedIds = computed(() => {
  return Object.entries(rowSelection.value)
    .filter(([, v]) => v)
    .map(([i]) => store.paginatedItems[Number(i)]?.id)
    .filter(Boolean) as number[]
})

watch(() => store.currentPage, () => {
  rowSelection.value = {}
})

// Delete — single
const confirmSingle = ref(false)
const pendingDeleteId = ref<number | null>(null)
const pendingDeleteCompany = ref('')
const deleting = ref(false)

function requestDeleteOne(id: number, company: string) {
  pendingDeleteId.value = id
  pendingDeleteCompany.value = company
  confirmSingle.value = true
}

async function confirmDeleteOne() {
  if (!pendingDeleteId.value) return
  deleting.value = true
  try {
    await $fetch(`/api/vacancies/${pendingDeleteId.value}`, { method: 'DELETE' })
    confirmSingle.value = false
    await store.fetchVacancies()
  } finally {
    deleting.value = false
  }
}

// Delete — bulk
const confirmBulk = ref(false)

async function confirmDeleteSelected() {
  if (!selectedIds.value.length) return
  deleting.value = true
  try {
    await Promise.all(selectedIds.value.map(id => $fetch(`/api/vacancies/${id}`, { method: 'DELETE' })))
    rowSelection.value = {}
    confirmBulk.value = false
    await store.fetchVacancies()
  } finally {
    deleting.value = false
  }
}

// New vacancy modal
const showModal = ref(false)
const form = reactive({ company: '', position: '' })
const saving = ref(false)

async function createVacancy() {
  if (!form.company || !form.position) return
  saving.value = true
  try {
    await $fetch('/api/vacancies', { method: 'POST', body: { company: form.company, position: form.position } })
    showModal.value = false
    form.company = ''
    form.position = ''
    await store.fetchVacancies()
  } finally {
    saving.value = false
  }
}

const UCheckbox = resolveComponent('UCheckbox')
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

const columns: TableColumn<VacancyRow>[] = [
  {
    id: 'select',
    header: ({ table }: { table: Table<VacancyRow> }) => h(UCheckbox, {
      'modelValue': table.getIsAllRowsSelected() ? true : table.getIsSomeRowsSelected() ? 'indeterminate' : false,
      'onUpdate:modelValue': (v: boolean) => table.toggleAllRowsSelected(v),
      'aria-label': 'Select all'
    }),
    cell: ({ row }: { row: Row<VacancyRow> }) => h(UCheckbox, {
      'modelValue': row.getIsSelected(),
      'onUpdate:modelValue': (v: boolean) => row.toggleSelected(v),
      'aria-label': 'Select row'
    }),
    meta: { class: { th: 'w-10', td: 'w-10' } }
  },
  { accessorKey: 'company', header: 'Компанія' },
  { accessorKey: 'position', header: 'Позиція' },
  { accessorKey: 'stage', header: 'Стадія' },
  { accessorKey: 'applyDate', header: 'Дата' },
  {
    id: 'actions',
    header: '',
    meta: { class: { th: 'w-20', td: 'w-20' } },
    cell: ({ row }: { row: Row<VacancyRow> }) => h('div', { class: 'flex items-center gap-1 justify-end' }, [
      h(UButton, {
        to: `/vacancies/${row.original.id}`,
        variant: 'ghost',
        icon: 'i-lucide-arrow-right',
        size: 'xs'
      }),
      h(UButton, {
        variant: 'ghost',
        icon: 'i-lucide-trash-2',
        size: 'xs',
        color: 'error',
        onClick: () => requestDeleteOne(row.original.id, row.original.company)
      })
    ])
  }
]
</script>

<template>
  <UContainer class="py-6">
    <PageHeader title="Вакансії">
      <div class="flex items-center gap-2">
        <UButton
          v-if="selectedIds.length"
          color="error"
          variant="soft"
          icon="i-lucide-trash-2"
          @click="confirmBulk = true"
        >
          Видалити ({{ selectedIds.length }})
        </UButton>
        <UButton
          icon="i-lucide-plus"
          @click="showModal = true"
        >
          Нова вакансія
        </UButton>
      </div>
    </PageHeader>

    <ClientOnly>
      <template #fallback>
        <div class="flex gap-3 mb-3">
          <USkeleton class="h-9 flex-1" />
          <USkeleton class="h-9 w-48" />
        </div>
        <div class="flex items-center gap-2 mb-4">
          <USkeleton class="h-8 w-10 rounded-lg" />
          <USkeleton class="h-8 w-32 rounded-lg" />
          <USkeleton class="h-8 w-36 rounded-lg" />
          <USkeleton class="h-4 w-4" />
          <USkeleton class="h-8 w-36 rounded-lg" />
        </div>
        <div
          class="rounded-[7px] bg-white dark:bg-[oklch(27.84%_0.027_257.53)] overflow-hidden"
          style="box-shadow: rgba(145,158,171,0.2) 0px 0px 2px 0px, rgba(145,158,171,0.12) 0px 12px 24px -4px;"
        >
          <div class="px-4 py-3 border-b border-[oklch(92.03%_0.015_260.73)] dark:border-[oklch(36.67%_0.041_262.29)] flex gap-6">
            <USkeleton class="h-4 w-4" />
            <USkeleton class="h-4 w-28" />
            <USkeleton class="h-4 w-40" />
            <USkeleton class="h-4 w-20" />
            <USkeleton class="h-4 w-24" />
          </div>
          <div
            v-for="i in 8"
            :key="i"
            class="px-4 py-3 border-b border-[oklch(92.03%_0.015_260.73)] dark:border-[oklch(36.67%_0.041_262.29)] last:border-0 flex gap-6 items-center"
          >
            <USkeleton class="h-4 w-4 shrink-0" />
            <USkeleton class="h-4 w-28" />
            <USkeleton class="h-4 w-44" />
            <USkeleton class="h-5 w-16 rounded-full" />
            <USkeleton class="h-4 w-20" />
          </div>
        </div>
      </template>

      <!-- Filters -->
      <div class="flex gap-3 mb-3">
        <UInput
          v-model="store.search"
          placeholder="Пошук по компанії / позиції…"
          icon="i-lucide-search"
          class="flex-1"
        />
        <USelect
          v-model="store.stageId"
          :items="stageOptions"
          value-key="value"
          label-key="label"
          class="w-48"
        />
      </div>

      <!-- Date filter -->
      <div class="flex items-center gap-2 mb-4 flex-wrap">
        <span class="text-sm text-[oklch(52.16%_0.047_260.80)] dark:text-[oklch(64.54%_0.049_258.74)] shrink-0">
          Дата:
        </span>
        <div class="flex rounded-lg overflow-hidden border border-[oklch(88.35%_0.02_264.36)] dark:border-[oklch(36.67%_0.041_262.29)]">
          <button
            v-for="preset in store.datePresets"
            :key="preset.label"
            class="px-3 py-1.5 text-xs font-medium transition-colors"
            :class="store.datePreset === preset.label
              ? 'bg-[oklch(65.33%_0.184_266.79)] text-white'
              : 'bg-white dark:bg-[oklch(27.84%_0.027_257.53)] text-[oklch(52.16%_0.047_260.80)] dark:text-[oklch(64.54%_0.049_258.74)] hover:bg-[oklch(65.33%_0.184_266.79/12.50%)] hover:text-[oklch(65.33%_0.184_266.79)] dark:hover:bg-[oklch(65.33%_0.184_266.79/12.50%)] dark:hover:text-[oklch(65.33%_0.184_266.79)]'"
            @click="store.applyPreset(preset.label, preset.days)"
          >
            {{ preset.label }}
          </button>
        </div>
        <UPopover v-model:open="store.dateFromOpen">
          <UButton
            variant="outline"
            icon="i-lucide-calendar"
            size="sm"
            color="neutral"
            class="w-36 justify-start font-normal"
          >
            {{ store.dateFrom || 'Від' }}
          </UButton>
          <template #content>
            <UCalendar v-model="store.dateFromValue" />
          </template>
        </UPopover>
        <span class="text-[oklch(64.54%_0.049_258.74)] text-sm">—</span>
        <UPopover v-model:open="store.dateToOpen">
          <UButton
            variant="outline"
            icon="i-lucide-calendar"
            size="sm"
            color="neutral"
            class="w-36 justify-start font-normal"
          >
            {{ store.dateTo || 'До' }}
          </UButton>
          <template #content>
            <UCalendar v-model="store.dateToValue" />
          </template>
        </UPopover>
        <UButton
          v-if="store.dateFrom || store.dateTo"
          variant="ghost"
          icon="i-lucide-x"
          size="sm"
          color="neutral"
          @click="store.clearDateFilter()"
        />
      </div>

      <!-- Table wrapped in card -->
      <div
        class="rounded-[7px] bg-white dark:bg-[oklch(27.84%_0.027_257.53)] overflow-hidden"
        style="box-shadow: rgba(145,158,171,0.2) 0px 0px 2px 0px, rgba(145,158,171,0.12) 0px 12px 24px -4px;"
      >
        <UTable
          v-model:row-selection="rowSelection"
          :data="store.paginatedItems"
          :columns="columns"
          :loading="store.loading"
        >
          <template #company-cell="{ row }">
            <NuxtLink
              :to="`/vacancies/${row.original.id}`"
              class="flex items-center gap-2 font-medium hover:underline"
            >
              <img
                v-if="getFaviconUrl(row.original.urlSite)"
                :src="getFaviconUrl(row.original.urlSite)!"
                class="w-4 h-4 rounded-sm shrink-0"
                :alt="row.original.company"
                @error="($event.target as HTMLImageElement).style.display = 'none'"
                @load="(e: Event) => { const img = e.target as HTMLImageElement; if (img.naturalWidth <= 16) img.style.display = 'none' }"
              >
              {{ row.original.company }}
            </NuxtLink>
          </template>

          <template #stage-cell="{ row }">
            <UBadge
              v-if="row.original.stageName"
              :style="{ backgroundColor: row.original.stageColor + '22', color: row.original.stageColor, borderColor: row.original.stageColor + '44' }"
              variant="outline"
              size="sm"
            >
              {{ row.original.stageName }}
            </UBadge>
          </template>

          <template #applyDate-cell="{ row }">
            {{ row.original.applyDate ?? '—' }}
          </template>
        </UTable>

        <!-- Pagination footer -->
        <div class="flex items-center justify-between px-4 py-3 border-t border-[oklch(92.03%_0.015_260.73)] dark:border-[oklch(36.67%_0.041_262.29)]">
          <span class="text-sm text-[oklch(52.16%_0.047_260.80)] dark:text-[oklch(64.54%_0.049_258.74)]">
            Показано {{ store.showingFrom }}–{{ store.showingTo }} з {{ store.totalItems }}
          </span>
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <span class="text-sm text-[oklch(52.16%_0.047_260.80)] dark:text-[oklch(64.54%_0.049_258.74)]">Рядків:</span>
              <USelect
                v-model="store.perPage"
                :items="store.perPageOptions"
                value-key="value"
                label-key="label"
                size="sm"
                class="w-20"
              />
            </div>
            <UPagination
              v-model:page="store.currentPage"
              :total="store.totalItems"
              :items-per-page="store.perPage"
              size="sm"
              :show-edges="true"
            />
          </div>
        </div>
      </div>
    </ClientOnly>

    <!-- Confirm delete single -->
    <ConfirmModal
      v-model:open="confirmSingle"
      title="Видалити вакансію?"
      :description="`Вакансія «${pendingDeleteCompany}» буде видалена разом з усіма пов'язаними даними. Цю дію неможливо скасувати.`"
      :loading="deleting"
      @confirm="confirmDeleteOne"
    />

    <!-- Confirm delete bulk -->
    <ConfirmModal
      v-model:open="confirmBulk"
      :title="`Видалити ${selectedIds.length} ${selectedIds.length === 1 ? 'вакансію' : selectedIds.length < 5 ? 'вакансії' : 'вакансій'}?`"
      :description="`Буде видалено ${selectedIds.length} ${selectedIds.length === 1 ? 'запис' : 'записів'} разом з усіма пов'язаними даними. Цю дію неможливо скасувати.`"
      :loading="deleting"
      @confirm="confirmDeleteSelected"
    />

    <!-- New vacancy modal -->
    <UModal
      v-model:open="showModal"
      title="Нова вакансія"
    >
      <template #body>
        <div class="space-y-4 p-4">
          <UFormField
            label="Компанія"
            required
          >
            <UInput
              v-model="form.company"
              placeholder="Назва компанії"
              autofocus
            />
          </UFormField>
          <UFormField
            label="Позиція"
            required
          >
            <UInput
              v-model="form.position"
              placeholder="PHP Developer"
            />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 p-4">
          <UButton
            variant="ghost"
            @click="showModal = false"
          >
            Скасувати
          </UButton>
          <UButton
            :loading="saving"
            :disabled="!form.company || !form.position"
            @click="createVacancy"
          >
            Створити
          </UButton>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>
