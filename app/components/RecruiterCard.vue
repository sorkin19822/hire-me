<script setup lang="ts">
defineProps<{
  recruiter: {
    id: number
    name: string
    telegram: string | null
    email: string | null
    linkedin: string | null
  }
}>()
</script>

<template>
  <div class="flex items-center gap-3 py-2">
    <UAvatar :alt="recruiter.name" size="sm" icon="i-lucide-user" />
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium truncate">
        {{ recruiter.name }}
      </p>
      <div class="flex flex-wrap gap-2 mt-1">
        <a
          v-if="recruiter.telegram"
          :href="`tg://resolve?domain=${encodeURIComponent(recruiter.telegram.replace('@', ''))}`"
          class="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline"
        >
          <UIcon name="i-simple-icons-telegram" class="w-3 h-3" />
          {{ recruiter.telegram }}
        </a>
        <a
          v-if="recruiter.email"
          :href="`mailto:${recruiter.email}`"
          class="inline-flex items-center gap-1 text-xs text-gray-500 hover:underline"
        >
          <UIcon name="i-lucide-mail" class="w-3 h-3" />
          {{ recruiter.email }}
        </a>
        <a
          v-if="recruiter.linkedin"
          :href="recruiter.linkedin"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 text-xs text-blue-700 hover:underline"
        >
          <UIcon name="i-simple-icons-linkedin" class="w-3 h-3" />
          LinkedIn
        </a>
      </div>
    </div>
  </div>
</template>
