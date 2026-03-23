<script setup lang="ts">
const props = defineProps<{
  open: boolean
  recruiter: {
    id: number
    name: string
    telegram: string | null
    email: string | null
    linkedin: string | null
  }
}>()

const emit = defineEmits<{ 'update:open': [value: boolean]; saved: [] }>()

const form = reactive({ name: '', telegram: '', email: '', linkedin: '' })
const saving = ref(false)
const error = ref<string | null>(null)

watch(() => props.open, (val) => {
  if (val) {
    Object.assign(form, {
      name: props.recruiter.name,
      telegram: props.recruiter.telegram ?? '',
      email: props.recruiter.email ?? '',
      linkedin: props.recruiter.linkedin ?? '',
    })
    error.value = null
  }
})

async function save() {
  if (!form.name) return
  saving.value = true
  error.value = null
  try {
    await $fetch(`/api/recruiters/${props.recruiter.id}`, {
      method: 'PATCH',
      body: {
        name: form.name,
        telegram: form.telegram || null,
        email: form.email || null,
        linkedin: form.linkedin || null,
      },
    })
    emit('update:open', false)
    emit('saved')
  }
  catch {
    error.value = 'Помилка збереження'
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal
    :open="open"
    title="Редагувати рекрутера"
    :close="false"
    :dismissible="true"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 p-4">
        <UFormField label="Ім'я" required class="sm:col-span-2">
          <UInput v-model="form.name" placeholder="Ім'я рекрутера" class="w-full" />
        </UFormField>
        <UFormField label="Telegram">
          <UInput v-model="form.telegram" placeholder="@username" class="w-full" />
        </UFormField>
        <UFormField label="Email">
          <UInput v-model="form.email" type="email" placeholder="email@example.com" class="w-full" />
        </UFormField>
        <UFormField label="LinkedIn" class="sm:col-span-2">
          <UInput v-model="form.linkedin" placeholder="https://linkedin.com/in/..." class="w-full" />
        </UFormField>
        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          :title="error"
          icon="i-lucide-alert-circle"
          class="sm:col-span-2"
        />
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2 p-4">
        <UButton variant="ghost" @click="emit('update:open', false)">
          Скасувати
        </UButton>
        <UButton :loading="saving" :disabled="!form.name" @click="save">
          Зберегти
        </UButton>
      </div>
    </template>
  </UModal>
</template>
