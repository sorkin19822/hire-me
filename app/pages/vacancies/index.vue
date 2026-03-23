<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { Row, Table } from '@tanstack/vue-table'
import { getFaviconUrl } from '~/composables/useFavicon'

type VacancyRow = {
  id: number
  company: string
  position: string
  stageName: string | null
  stageColor: string | null
  applyDate: string | null
  urlSite: string | null
}

useSeoMeta({ title: 'Вакансії — hire-me' })

const search = ref('')
const stageFilter = ref<number | null>(null)

const { data: stages } = await useFetch('/api/pipeline-stages')

const { data: vacancies, refresh } = await useFetch('/api/vacancies', {
  query: computed(() => ({
    search: search.value || undefined,
    stage_id: stageFilter.value ?? undefined
  }))
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
    .map(([i]) => (vacancies.value ?? [])[Number(i)]?.id)
    .filter(Boolean) as number[]
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
    await refresh()
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
    await refresh()
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
    await refresh()
  } finally {
    saving.value = false
  }
}

const UCheckbox = resolveComponent('UCheckbox')
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')

const columns = [
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

    <!-- Filters -->
    <div class="flex gap-3 mb-4">
      <UInput
        v-model="search"
        placeholder="Пошук по компанії / позиції…"
        icon="i-lucide-search"
        class="flex-1"
      />
      <USelect
        v-model="stageFilter"
        :items="stageOptions"
        value-key="value"
        label-key="label"
        class="w-48"
      />
    </div>

    <!-- Table wrapped in card -->
    <div
      class="rounded-[7px] bg-white dark:bg-[oklch(27.84%_0.027_257.53)] overflow-hidden"
      style="box-shadow: rgba(145,158,171,0.2) 0px 0px 2px 0px, rgba(145,158,171,0.12) 0px 12px 24px -4px;"
    >
      <UTable
        v-model:row-selection="rowSelection"
        :data="vacancies ?? []"
        :columns="columns"
        :loading="!vacancies"
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
    </div>

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
