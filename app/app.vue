<script setup lang="ts">
import { uk } from '@nuxt/ui/locale'

useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [
    { rel: 'icon', href: '/favicon.ico' },
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' }
  ],
  htmlAttrs: { lang: 'uk' }
})

useSeoMeta({
  title: 'hire-me — Job Search CRM',
  description: 'Personal CRM for tracking vacancies, interviews and recruiter conversations'
})

const { loggedIn, user, clear } = useUserSession()
const route = useRoute()

const showLogoutConfirm = ref(false)
const loggingOut = ref(false)

async function logout() {
  loggingOut.value = true
  try {
    await clear()
    await navigateTo('/login')
  } finally {
    loggingOut.value = false
    showLogoutConfirm.value = false
  }
}

const navItems = [
  { to: '/', icon: 'i-lucide-kanban', label: 'Kanban' },
  { to: '/vacancies', icon: 'i-lucide-briefcase', label: 'Вакансії' },
  { to: '/recruiters', icon: 'i-lucide-users', label: 'Рекрутери' },
  { to: '/analytics', icon: 'i-lucide-bar-chart-2', label: 'Аналітика' },
  { to: '/cv-versions', icon: 'i-lucide-file-text', label: 'CV' },
  { to: '/import', icon: 'i-lucide-upload', label: 'Імпорт' },
  { to: '/settings', icon: 'i-lucide-settings', label: 'Налаштування' }
]

function isActive(to: string) {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}

const isLoginPage = computed(() => route.path === '/login')
</script>

<template>
  <UApp :locale="uk">
    <!-- Login page — no sidebar layout -->
    <NuxtPage v-if="isLoginPage" />

    <!-- Main app layout with sidebar -->
    <div
      v-else
      class="flex h-screen overflow-hidden bg-[oklch(98.07%_0.005_247.88)] dark:bg-[oklch(22%_0.02_257.53)]"
    >
      <!-- Sidebar -->
      <aside
        class="flex-shrink-0 w-[220px] flex flex-col border-r border-[oklch(92.03%_0.015_260.73)] dark:border-[oklch(36.67%_0.041_262.29)] bg-white dark:bg-[oklch(27.84%_0.027_257.53)]"
        style="box-shadow: rgba(145,158,171,0.08) 2px 0 8px 0;"
      >
        <!-- Logo -->
        <div class="flex items-center gap-2.5 px-5 h-16 border-b border-[oklch(92.03%_0.015_260.73)] dark:border-[oklch(36.67%_0.041_262.29)] flex-shrink-0">
          <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <UIcon
              name="i-lucide-briefcase"
              class="w-4 h-4 text-white"
            />
          </div>
          <span class="text-[15px] font-bold text-[oklch(32.70%_0.035_260.11)] dark:text-white tracking-tight">
            hire<span class="text-primary">-me</span>
          </span>
        </div>

        <!-- Nav -->
        <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 px-3 py-2 rounded-[7px] text-sm font-medium transition-all duration-150"
            :class="isActive(item.to)
              ? 'bg-primary/10 text-primary dark:bg-primary/15 dark:text-violet-300 font-semibold'
              : 'text-[oklch(52.16%_0.047_260.80)] dark:text-[oklch(64.54%_0.049_258.74)] hover:bg-[oklch(96%_0.008_260)] dark:hover:bg-[oklch(32%_0.03_260)] hover:text-[oklch(32.70%_0.035_260.11)] dark:hover:text-white'"
          >
            <UIcon
              :name="item.icon"
              class="w-[18px] h-[18px] flex-shrink-0"
            />
            {{ item.label }}
          </NuxtLink>
        </nav>

        <!-- User section -->
        <div class="px-3 pb-4 pt-3 border-t border-[oklch(92.03%_0.015_260.73)] dark:border-[oklch(36.67%_0.041_262.29)] space-y-1">
          <UColorModeButton
            variant="ghost"
            size="sm"
            class="w-full justify-start px-3 text-[oklch(52.16%_0.047_260.80)] dark:text-[oklch(64.54%_0.049_258.74)]"
          />
          <template v-if="loggedIn">
            <div class="flex items-center gap-2 px-3 py-2">
              <UAvatar
                v-if="user?.avatar"
                :src="user.avatar"
                :alt="user?.name ?? user?.email ?? ''"
                size="xs"
                class="flex-shrink-0"
              />
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium text-[oklch(32.70%_0.035_260.11)] dark:text-white truncate">
                  {{ user?.name ?? user?.email }}
                </p>
              </div>
              <UButton
                variant="ghost"
                icon="i-lucide-log-out"
                size="xs"
                title="Вийти"
                class="flex-shrink-0 text-[oklch(52.16%_0.047_260.80)] hover:text-error dark:text-[oklch(64.54%_0.049_258.74)]"
                @click="showLogoutConfirm = true"
              />
            </div>
          </template>
        </div>
      </aside>

      <!-- Main content area -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <!-- Top bar -->
        <header
          class="flex-shrink-0 h-16 flex items-center justify-between px-6 border-b border-[oklch(92.03%_0.015_260.73)] dark:border-[oklch(36.67%_0.041_262.29)] bg-white dark:bg-[oklch(27.84%_0.027_257.53)]"
        >
          <div class="flex items-center gap-2">
            <h2 class="text-[15px] font-semibold text-[oklch(32.70%_0.035_260.11)] dark:text-white">
              {{ navItems.find(n => isActive(n.to))?.label ?? 'hire-me' }}
            </h2>
          </div>
          <div class="flex items-center gap-2">
            <template v-if="loggedIn">
              <span class="text-xs text-[oklch(52.16%_0.047_260.80)] dark:text-[oklch(64.54%_0.049_258.74)] hidden sm:block">
                {{ user?.email }}
              </span>
              <UAvatar
                v-if="user?.avatar"
                :src="user.avatar"
                :alt="user?.name ?? user?.email ?? ''"
                size="xs"
              />
            </template>
          </div>
        </header>

        <!-- Page content -->
        <main class="flex-1 overflow-auto">
          <NuxtPage />
        </main>
      </div>
    </div>

    <ConfirmModal
      v-model:open="showLogoutConfirm"
      title="Вийти з системи?"
      description="Ви впевнені, що хочете завершити сеанс? Для повторного входу знадобиться авторизація."
      confirm-label="Вийти"
      confirm-color="warning"
      :loading="loggingOut"
      @confirm="logout"
    />
  </UApp>
</template>
