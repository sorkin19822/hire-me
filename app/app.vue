<script setup lang="ts">
useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: { lang: 'uk' }
})

useSeoMeta({
  title: 'hire-me — Job Search CRM',
  description: 'Personal CRM for tracking vacancies, interviews and recruiter conversations'
})

const { loggedIn, user, clear } = useUserSession()

async function logout() {
  await clear()
  await navigateTo('/login')
}
</script>

<template>
  <UApp>
    <UHeader>
      <template #left>
        <NuxtLink to="/" class="text-xl font-bold text-primary">
          hire-me
        </NuxtLink>
      </template>

      <template #right>
        <nav class="flex items-center gap-1">
          <UButton to="/" variant="ghost" icon="i-lucide-kanban" size="sm">
            Kanban
          </UButton>
          <UButton to="/vacancies" variant="ghost" icon="i-lucide-briefcase" size="sm">
            Вакансії
          </UButton>
          <UButton to="/recruiters" variant="ghost" icon="i-lucide-users" size="sm">
            Рекрутери
          </UButton>
          <UButton to="/analytics" variant="ghost" icon="i-lucide-chart-bar" size="sm">
            Аналітика
          </UButton>
          <UButton to="/cv-versions" variant="ghost" icon="i-lucide-file-text" size="sm">
            CV
          </UButton>
          <UButton to="/import" variant="ghost" icon="i-lucide-upload" size="sm">
            Імпорт
          </UButton>
          <UColorModeButton size="sm" />
          <template v-if="loggedIn">
            <UAvatar
              v-if="user?.avatar"
              :src="user.avatar"
              :alt="user.name ?? user.email"
              size="xs"
            />
            <UButton
              variant="ghost"
              icon="i-lucide-log-out"
              size="sm"
              title="Вийти"
              @click="logout"
            />
          </template>
        </nav>
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>
  </UApp>
</template>
