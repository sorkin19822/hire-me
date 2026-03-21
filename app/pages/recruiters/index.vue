<script setup lang="ts">
useSeoMeta({ title: 'Рекрутери — hire-me' })

const search = ref('')

const { data: recruiters, refresh } = await useFetch('/api/recruiters')

const filtered = computed(() => {
  const s = search.value.toLowerCase()
  return (recruiters.value ?? []).filter((r: { name: string }) =>
    !s || r.name.toLowerCase().includes(s),
  )
})

async function deleteRecruiter(id: number) {
  await $fetch(`/api/recruiters/${id}`, { method: 'DELETE' })
  await refresh()
}

const columns = [
  { accessorKey: 'name', header: 'Ім\'я' },
  { accessorKey: 'telegram', header: 'Telegram' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'vacancy', header: 'Вакансія' },
  { id: 'actions', header: '' },
]
</script>

<template>
  <UContainer class="py-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">
        Рекрутери
      </h1>
    </div>

    <UInput
      v-model="search"
      placeholder="Пошук по імені…"
      icon="i-lucide-search"
      class="mb-4 max-w-sm"
    />

    <UTable :data="filtered" :columns="columns" :loading="!recruiters">
      <template #name-cell="{ row }">
        <RecruiterCard :recruiter="row.original" />
      </template>

      <template #telegram-cell="{ row }">
        <a
          v-if="row.original.telegram"
          :href="`tg://resolve?domain=${encodeURIComponent(row.original.telegram.replace('@', ''))}`"
          class="text-sm text-blue-500 hover:underline"
        >{{ row.original.telegram }}</a>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #email-cell="{ row }">
        <a
          v-if="row.original.email"
          :href="`mailto:${row.original.email}`"
          class="text-sm hover:underline"
        >{{ row.original.email }}</a>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #vacancy-cell="{ row }">
        <NuxtLink
          v-if="row.original.vacancyId"
          :to="`/vacancies/${row.original.vacancyId}`"
          class="text-sm text-primary hover:underline"
        >
          {{ row.original.vacancyCompany }}
        </NuxtLink>
        <span v-else class="text-gray-400">—</span>
      </template>

      <template #actions-cell="{ row }">
        <UButton
          variant="ghost"
          icon="i-lucide-trash-2"
          size="xs"
          color="error"
          @click="deleteRecruiter(row.original.id)"
        />
      </template>
    </UTable>
  </UContainer>
</template>
