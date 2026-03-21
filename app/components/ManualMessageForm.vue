<script setup lang="ts">
const props = defineProps<{
  vacancyId: number
  recruiters: { id: number, name: string }[]
}>()

const emit = defineEmits<{ saved: [] }>()

const content = ref('')
const direction = ref<'in' | 'out'>('in')
const recruiterId = ref<number | null>(null)
const sentAt = ref(new Date().toISOString().slice(0, 16))
const saving = ref(false)
const error = ref<string | null>(null)

const recruiterOptions = computed(() => [
  { label: 'Без рекрутера', value: null },
  ...props.recruiters.map(r => ({ label: r.name, value: r.id })),
])

async function submit() {
  if (!content.value.trim()) return
  saving.value = true
  error.value = null
  try {
    let sentAtIso: string | undefined
    if (sentAt.value) {
      const d = new Date(sentAt.value)
      if (isNaN(d.getTime())) throw new Error('Невірний формат дати')
      sentAtIso = d.toISOString()
    }

    await $fetch('/api/messages', {
      method: 'POST',
      body: {
        vacancyId: props.vacancyId,
        recruiterId: recruiterId.value ?? undefined,
        source: 'manual',
        direction: direction.value,
        content: content.value.trim(),
        sentAt: sentAtIso,
      },
    })
    content.value = ''
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
  <div class="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
    <!-- Direction toggle -->
    <div class="flex items-center gap-2">
      <span class="text-sm text-gray-500">Напрямок:</span>
      <UButtonGroup size="sm">
        <UButton
          :variant="direction === 'in' ? 'solid' : 'outline'"
          icon="i-lucide-arrow-down-left"
          @click="direction = 'in'"
        >
          Вхідне
        </UButton>
        <UButton
          :variant="direction === 'out' ? 'solid' : 'outline'"
          icon="i-lucide-arrow-up-right"
          @click="direction = 'out'"
        >
          Вихідне
        </UButton>
      </UButtonGroup>
    </div>

    <!-- Recruiter + date row -->
    <div class="flex gap-2">
      <USelect
        v-model="recruiterId"
        :items="recruiterOptions"
        value-key="value"
        label-key="label"
        size="sm"
        class="flex-1"
      />
      <UInput
        v-model="sentAt"
        type="datetime-local"
        size="sm"
        class="flex-1"
      />
    </div>

    <!-- Text -->
    <UTextarea
      v-model="content"
      placeholder="Текст повідомлення…"
      :rows="3"
      @keydown.ctrl.enter="submit"
      @keydown.meta.enter="submit"
    />

    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      :title="error"
      icon="i-lucide-alert-circle"
    />

    <div class="flex justify-end">
      <UButton
        :loading="saving"
        :disabled="!content.trim()"
        icon="i-lucide-send"
        size="sm"
        @click="submit"
      >
        Зберегти
      </UButton>
    </div>
  </div>
</template>
