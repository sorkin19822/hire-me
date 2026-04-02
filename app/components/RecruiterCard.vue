<script setup lang="ts">
const props = defineProps<{
  recruiter: {
    id: number
    name: string
    telegram: string | null
    email: string | null
    linkedin: string | null
    tgAvatar?: string | null
  }
  vacancyId?: number
}>()

const emit = defineEmits<{ synced: [] }>()

const toast = useToast()
const syncing = ref(false)
const syncingEmail = ref(false)

async function syncTelegram(force = false) {
  if (!props.recruiter.telegram || !props.vacancyId) return
  syncing.value = true
  try {
    const result = await $fetch<{ imported: number, total: number }>('/api/integrations/telegram', {
      method: 'POST',
      body: {
        recruiterId: props.recruiter.id,
        vacancyId: props.vacancyId,
        telegramUsername: props.recruiter.telegram,
        ...(force ? { force: true } : {})
      }
    })
    toast.add({
      title: `Telegram: завантажено ${result.imported} нових повідомлень`,
      color: 'success',
      icon: 'i-simple-icons-telegram'
    })
    emit('synced')
  } finally {
    syncing.value = false
  }
}

const telegramSyncItems = [[
  { label: 'Синхронізувати нові', icon: 'i-lucide-refresh-cw', onSelect: () => syncTelegram() },
  { label: 'Перезавантажити все', icon: 'i-lucide-rotate-ccw', onSelect: () => syncTelegram(true) }
]]

async function syncEmail() {
  if (!props.recruiter.email || !props.vacancyId) return
  syncingEmail.value = true
  try {
    const result = await $fetch<{ imported: number, total: number }>('/api/integrations/imap', {
      method: 'POST',
      body: {
        recruiterId: props.recruiter.id,
        vacancyId: props.vacancyId,
        email: props.recruiter.email
      }
    })
    toast.add({
      title: `Email: завантажено ${result.imported} нових повідомлень`,
      color: 'success',
      icon: 'i-lucide-mail'
    })
    emit('synced')
  } catch {
    toast.add({ title: 'Помилка синхронізації Email', color: 'error', icon: 'i-lucide-alert-circle' })
  } finally {
    syncingEmail.value = false
  }
}
</script>

<template>
  <div class="flex items-center gap-3 py-2">
    <UAvatar
      :src="recruiter.tgAvatar ?? undefined"
      :alt="recruiter.name"
      size="sm"
      icon="i-lucide-user"
    />
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium truncate">
        {{ recruiter.name }}
      </p>
      <div class="flex flex-wrap gap-2 mt-1">
        <UButton
          v-if="recruiter.telegram"
          :href="`tg://resolve?domain=${encodeURIComponent(recruiter.telegram.replace('@', ''))}`"
          variant="link"
          size="xs"
          icon="i-simple-icons-telegram"
        >
          {{ recruiter.telegram }}
        </UButton>
        <UButton
          v-if="recruiter.email"
          :href="`mailto:${recruiter.email}`"
          variant="link"
          size="xs"
          icon="i-lucide-mail"
          color="neutral"
        >
          {{ recruiter.email }}
        </UButton>
        <UButton
          v-if="recruiter.linkedin"
          :href="recruiter.linkedin"
          target="_blank"
          rel="noopener noreferrer"
          variant="link"
          size="xs"
          icon="i-simple-icons-linkedin"
        >
          LinkedIn
        </UButton>
      </div>
    </div>

    <!-- Telegram sync dropdown — only when telegram is set and vacancyId provided -->
    <UDropdownMenu
      v-if="recruiter.telegram && vacancyId"
      :items="telegramSyncItems"
    >
      <UButton
        variant="ghost"
        icon="i-simple-icons-telegram"
        size="xs"
        :loading="syncing"
        title="Telegram: синхронізувати"
        @click.prevent="syncTelegram()"
      />
    </UDropdownMenu>

    <!-- Email sync button — only when email is set and vacancyId provided -->
    <UButton
      v-if="recruiter.email && vacancyId"
      variant="ghost"
      icon="i-lucide-mail"
      size="xs"
      :loading="syncingEmail"
      title="Завантажити Email"
      @click.prevent="syncEmail"
    />
  </div>
</template>
