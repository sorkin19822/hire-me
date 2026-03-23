<script setup lang="ts">
import { CalendarDate, parseDate, today, getLocalTimeZone } from '@internationalized/date'

const props = defineProps<{
  vacancyId: number
  recruiters: { id: number, name: string }[]
}>()

const emit = defineEmits<{ saved: [] }>()

const content = ref('')
const direction = ref<'in' | 'out'>('in')
const recruiterId = ref<number | null>(null)
const saving = ref(false)
const error = ref<string | null>(null)

// Date picker
const datePickerOpen = ref(false)
const selectedDate = ref<CalendarDate>(today(getLocalTimeZone()))
const timeValue = ref('')

onMounted(() => {
  timeValue.value = new Date().toTimeString().slice(0, 5)
})

const dateLabel = computed(() => {
  const t = today(getLocalTimeZone())
  if (selectedDate.value.toString() === t.toString()) return `Сьогодні, ${timeValue.value}`
  return `${selectedDate.value.toString()}, ${timeValue.value}`
})

function onDateSelect(val: CalendarDate | undefined) {
  if (val) {
    selectedDate.value = val
    datePickerOpen.value = false
  }
}

const recruiterOptions = computed(() => [
  { label: 'Без рекрутера', value: null },
  ...props.recruiters.map(r => ({ label: r.name, value: r.id })),
])

async function submit() {
  if (!content.value.trim()) return
  saving.value = true
  error.value = null
  try {
    const [h, m] = timeValue.value.split(':').map(Number)
    const d = new Date(selectedDate.value.year, selectedDate.value.month - 1, selectedDate.value.day, h, m)
    const sentAtIso = d.toISOString()

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
    <!-- Row 1: direction + recruiter + date -->
    <div class="flex flex-wrap items-center gap-2">
      <UButton
        size="sm"
        :variant="direction === 'in' ? 'solid' : 'outline'"
        icon="i-lucide-arrow-down-left"
        @click="direction = 'in'"
      >
        Вхідне
      </UButton>
      <UButton
        size="sm"
        :variant="direction === 'out' ? 'solid' : 'outline'"
        icon="i-lucide-arrow-up-right"
        @click="direction = 'out'"
      >
        Вихідне
      </UButton>

      <USelect
        v-model="recruiterId"
        :items="recruiterOptions"
        value-key="value"
        label-key="label"
        size="sm"
        class="min-w-36 flex-1"
      />

      <!-- Date + time picker -->
      <div class="flex items-center gap-1">
        <UPopover v-model:open="datePickerOpen">
          <UButton
            variant="outline"
            icon="i-lucide-calendar"
            size="sm"
          >
            {{ dateLabel }}
          </UButton>
          <template #content>
            <UCalendar :model-value="selectedDate" @update:model-value="onDateSelect" />
          </template>
        </UPopover>
        <UInput
          v-model="timeValue"
          type="time"
          size="sm"
          class="w-24"
        />
      </div>
    </div>

    <!-- Row 2: textarea -->
    <UTextarea
      v-model="content"
      placeholder="Текст повідомлення…"
      :rows="3"
      class="w-full"
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

    <!-- Row 3: submit -->
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
