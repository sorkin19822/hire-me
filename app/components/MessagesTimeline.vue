<script setup lang="ts">
const props = defineProps<{
  vacancyId: number
}>()

const emit = defineEmits<{ refresh: [] }>()

const { data: messages, refresh } = useFetch(
  () => `/api/messages?vacancy_id=${props.vacancyId}`
)

defineExpose({ refresh })

const sourceColor: Record<string, 'error' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'neutral'> = {
  telegram: 'info',
  email: 'warning',
  manual: 'neutral'
}

const sourceLabel: Record<string, string> = {
  telegram: 'Telegram',
  email: 'Email',
  manual: 'Вручну'
}

async function deleteMessage(id: number) {
  await $fetch(`/api/messages/${id}`, { method: 'DELETE' })
  await refresh()
  emit('refresh')
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('uk-UA', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}
</script>

<template>
  <div class="space-y-3">
    <p
      v-if="!messages?.length"
      class="text-sm text-gray-400 text-center py-4"
    >
      Повідомлень ще немає
    </p>

    <div
      v-for="msg in messages"
      :key="msg.id"
      class="flex items-end gap-2"
      :class="msg.direction === 'out' ? 'justify-end' : 'justify-start'"
    >
      <!-- Recruiter avatar for incoming messages -->
      <UAvatar
        v-if="msg.direction === 'in'"
        :src="msg.recruiterAvatar ?? undefined"
        :alt="msg.recruiterName ?? ''"
        size="xs"
        icon="i-lucide-user"
        class="shrink-0 mb-5"
      />

      <div
        class="max-w-[75%] group relative"
        :class="msg.direction === 'out' ? 'items-end' : 'items-start'"
      >
        <!-- Bubble -->
        <div
          class="rounded-2xl px-4 py-2.5 text-sm"
          :class="msg.direction === 'out'
            ? 'bg-primary-500 text-white rounded-br-sm'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm'"
        >
          <p class="whitespace-pre-wrap break-words">
            {{ msg.content }}
          </p>
        </div>

        <!-- Meta -->
        <div
          class="flex items-center gap-1.5 mt-1 px-1"
          :class="msg.direction === 'out' ? 'justify-end' : 'justify-start'"
        >
          <UBadge
            :color="sourceColor[msg.source] ?? 'neutral'"
            variant="soft"
            size="xs"
          >
            {{ sourceLabel[msg.source] ?? msg.source }}
          </UBadge>
          <span
            v-if="msg.recruiterName"
            class="text-xs text-gray-400"
          >{{ msg.recruiterName }}</span>
          <span class="text-xs text-gray-400">{{ formatDate(msg.sentAt) }}</span>

          <!-- Delete -->
          <UButton
            variant="ghost"
            icon="i-lucide-x"
            size="xs"
            color="error"
            class="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
            @click="deleteMessage(msg.id)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
