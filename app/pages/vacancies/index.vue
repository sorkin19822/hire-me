<script setup lang="ts">
useSeoMeta({ title: 'Вакансії — hire-me' })

const search = ref('')
const stageFilter = ref<number | null>(null)

const { data: stages } = await useFetch('/api/pipeline-stages')

const { data: vacancies, refresh } = await useFetch('/api/vacancies', {
  query: computed(() => ({
    search: search.value || undefined,
    stage_id: stageFilter.value ?? undefined,
  })),
})

const stageOptions = computed(() => [
  { label: 'Всі стадії', value: null },
  ...(stages.value ?? []).map((s: { id: number, name: string }) => ({ label: s.name, value: s.id })),
])

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
  }
  finally {
    saving.value = false
  }
}

const columns = [
  { accessorKey: 'company', header: 'Компанія' },
  { accessorKey: 'position', header: 'Позиція' },
  { accessorKey: 'stage', header: 'Стадія' },
  { accessorKey: 'applyDate', header: 'Дата' },
  { id: 'actions', header: '' },
]
</script>

<template>
  <UContainer class="py-6">
    <PageHeader title="Вакансії">
      <UButton icon="i-lucide-plus" @click="showModal = true">
        Нова вакансія
      </UButton>
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

    <!-- Table -->
    <UTable
      :data="vacancies ?? []"
      :columns="columns"
      :loading="!vacancies"
    >
      <template #company-cell="{ row }">
        <NuxtLink :to="`/vacancies/${row.original.id}`" class="font-medium hover:underline">
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

      <template #actions-cell="{ row }">
        <UButton
          :to="`/vacancies/${row.original.id}`"
          variant="ghost"
          icon="i-lucide-arrow-right"
          size="xs"
        />
      </template>
    </UTable>

    <!-- New vacancy modal -->
    <UModal v-model:open="showModal" title="Нова вакансія">
      <template #body>
        <div class="space-y-4 p-4">
          <UFormField label="Компанія" required>
            <UInput v-model="form.company" placeholder="Назва компанії" autofocus />
          </UFormField>
          <UFormField label="Позиція" required>
            <UInput v-model="form.position" placeholder="PHP Developer" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 p-4">
          <UButton variant="ghost" @click="showModal = false">
            Скасувати
          </UButton>
          <UButton :loading="saving" :disabled="!form.company || !form.position" @click="createVacancy">
            Створити
          </UButton>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>
