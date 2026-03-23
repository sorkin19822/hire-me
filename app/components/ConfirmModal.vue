<script setup lang="ts">
defineProps<{
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  confirmColor?: 'error' | 'warning' | 'primary'
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'confirm': []
}>()
</script>

<template>
  <UModal
    :open="open"
    :title="title"
    :description="description"
    :close="false"
    :dismissible="false"
    @update:open="emit('update:open', $event)"
  >
    <template #footer>
      <div class="flex justify-end gap-2 p-4">
        <UButton
          variant="ghost"
          @click="emit('update:open', false)"
        >
          Скасувати
        </UButton>
        <UButton
          :color="confirmColor ?? 'error'"
          :loading="loading"
          @click="emit('confirm')"
        >
          {{ confirmLabel ?? 'Видалити' }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
