<script setup lang="ts">
useSeoMeta({ title: 'Рекрутери — hire-me' })

const search = ref('')

const { data: recruiters, refresh } = await useFetch('/api/recruiters')

const filtered = computed(() => {
  const s = search.value.toLowerCase()
  return (recruiters.value ?? []).filter((r: { name: string }) =>
    !s || r.name.toLowerCase().includes(s)
  )
})

// Delete with confirmation
const confirmDeleteId = ref<number | null>(null)
const deleting = ref(false)

async function confirmDelete() {
  if (!confirmDeleteId.value) return
  deleting.value = true
  try {
    await $fetch(`/api/recruiters/${confirmDeleteId.value}`, { method: 'DELETE' })
    confirmDeleteId.value = null
    await refresh()
  } finally {
    deleting.value = false
  }
}

// Edit modal
type Recruiter = { id: number, name: string, telegram: string | null, email: string | null, linkedin: string | null }
const editingRecruiter = ref<Recruiter | null>(null)

const columns = [
  { accessorKey: 'name', header: 'Ім\'я' },
  { accessorKey: 'telegram', header: 'Telegram' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'vacancy', header: 'Вакансія' },
  { id: 'actions', header: '' }
]
</script>

<template>
  <UContainer class="py-6">
    <PageHeader title="Рекрутери" />

    <UInput
      v-model="search"
      placeholder="Пошук по імені…"
      icon="i-lucide-search"
      class="mb-4 max-w-sm"
    />

    <div
      class="rounded-[7px] bg-white dark:bg-[oklch(27.84%_0.027_257.53)] overflow-hidden"
      style="box-shadow: rgba(145,158,171,0.2) 0px 0px 2px 0px, rgba(145,158,171,0.12) 0px 12px 24px -4px;"
    >
      <UTable
        :data="filtered"
        :columns="columns"
        :loading="!recruiters"
      >
        <template #name-cell="{ row }">
          <RecruiterCard :recruiter="row.original" />
        </template>

        <template #telegram-cell="{ row }">
          <UButton
            v-if="row.original.telegram"
            :href="`tg://resolve?domain=${encodeURIComponent(row.original.telegram.replace('@', ''))}`"
            variant="link"
            size="xs"
            icon="i-simple-icons-telegram"
          >
            {{ row.original.telegram }}
          </UButton>
          <span
            v-else
            class="text-gray-400"
          >—</span>
        </template>

        <template #email-cell="{ row }">
          <UButton
            v-if="row.original.email"
            :href="`mailto:${row.original.email}`"
            variant="link"
            size="xs"
            icon="i-lucide-mail"
            color="neutral"
          >
            {{ row.original.email }}
          </UButton>
          <span
            v-else
            class="text-gray-400"
          >—</span>
        </template>

        <template #vacancy-cell="{ row }">
          <NuxtLink
            v-if="row.original.vacancyId"
            :to="`/vacancies/${row.original.vacancyId}`"
            class="text-sm text-primary hover:underline"
          >
            {{ row.original.vacancyCompany }}
          </NuxtLink>
          <span
            v-else
            class="text-gray-400"
          >—</span>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex items-center gap-1">
            <UButton
              variant="ghost"
              icon="i-lucide-pencil"
              size="xs"
              @click="editingRecruiter = row.original"
            />
            <UButton
              variant="ghost"
              icon="i-lucide-trash-2"
              size="xs"
              color="error"
              @click="confirmDeleteId = row.original.id"
            />
          </div>
        </template>
      </UTable>
    </div>

    <!-- Edit modal -->
    <RecruiterFormModal
      v-if="editingRecruiter"
      :open="!!editingRecruiter"
      :recruiter="editingRecruiter"
      @update:open="(v) => { if (!v) editingRecruiter = null }"
      @saved="refresh()"
    />

    <!-- Delete confirmation -->
    <ConfirmModal
      :open="confirmDeleteId !== null"
      title="Видалити рекрутера?"
      description="Цю дію неможливо скасувати. Рекрутер буде видалений разом із усіма пов'язаними даними."
      :loading="deleting"
      @update:open="(v) => { if (!v) confirmDeleteId = null }"
      @confirm="confirmDelete"
    />
  </UContainer>
</template>
