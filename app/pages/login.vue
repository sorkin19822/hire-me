<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const { loggedIn } = useUserSession()

if (loggedIn.value) {
  await navigateTo('/')
}

const errorMsg = computed(() => {
  if (route.query.error === 'unauthorized') return 'Цей email не в списку дозволених.'
  if (route.query.error === 'oauth') return 'Помилка авторизації Google. Спробуйте ще раз.'
  return null
})

const form = reactive({ email: '', password: '' })
const submitting = ref(false)
const credError = ref<string | null>(null)

async function submitCredentials() {
  credError.value = null
  submitting.value = true
  try {
    await $fetch('/auth/credentials', {
      method: 'POST',
      body: { email: form.email, password: form.password },
    })
    await navigateTo('/')
  }
  catch (err: unknown) {
    credError.value = (err as { data?: { statusMessage?: string } })?.data?.statusMessage ?? 'Невірний email або пароль'
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center p-4">
    <div class="bg-white shadow-lg rounded-2xl flex w-full max-w-4xl overflow-hidden">

      <!-- Left: form -->
      <div class="w-full lg:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
        <!-- Logo + title -->
        <div class="mb-8 text-center">
          <div class="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-xl mb-4">
            <svg class="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 class="text-2xl xl:text-3xl font-extrabold text-gray-900">
            hire-me
          </h1>
          <p class="text-sm text-gray-500 mt-1">
            Job Search CRM
          </p>
        </div>

        <!-- Error alert -->
        <div
          v-if="credError || errorMsg"
          class="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
        >
          {{ credError ?? errorMsg }}
        </div>

        <!-- Google button -->
        <a
          href="/auth/google"
          class="flex items-center justify-center gap-3 w-full py-3.5 px-6 bg-indigo-50 hover:bg-indigo-100 text-gray-800 font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-300 mb-6"
        >
          <span class="flex items-center justify-center w-7 h-7 bg-white rounded-full shadow-sm">
            <svg class="w-4 h-4" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
            </svg>
          </span>
          Увійти через Google
        </a>

        <!-- Divider -->
        <div class="relative mb-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-200" />
          </div>
          <div class="relative flex justify-center text-xs">
            <span class="px-3 bg-white text-gray-400 tracking-wide">або через email</span>
          </div>
        </div>

        <!-- Credentials form -->
        <form class="space-y-4" @submit.prevent="submitCredentials">
          <input
            v-model="form.email"
            type="email"
            placeholder="Email"
            autocomplete="email"
            required
            class="w-full px-5 py-4 rounded-xl bg-gray-100 border border-gray-200 placeholder-gray-500 text-sm font-medium focus:outline-none focus:border-gray-400 focus:bg-white transition-colors"
          >
          <input
            v-model="form.password"
            type="password"
            placeholder="Пароль (мін. 8 символів)"
            autocomplete="current-password"
            required
            class="w-full px-5 py-4 rounded-xl bg-gray-100 border border-gray-200 placeholder-gray-500 text-sm font-medium focus:outline-none focus:border-gray-400 focus:bg-white transition-colors"
          >

          <button
            type="submit"
            :disabled="submitting"
            class="w-full flex items-center justify-center gap-2 py-4 px-6 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white font-semibold text-sm tracking-wide rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 mt-2"
          >
            <svg v-if="submitting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14" />
            </svg>
            {{ submitting ? 'Вхід...' : 'Увійти' }}
          </button>
        </form>

        <p class="text-xs text-gray-400 text-center mt-6">
          Перший вхід — автоматична реєстрація
        </p>
      </div>

      <!-- Right: decorative panel (hidden on mobile) -->
      <div class="hidden lg:flex lg:w-1/2 bg-indigo-100 items-center justify-center p-12">
        <div class="text-center">
          <svg class="w-64 h-64 text-indigo-300 mx-auto mb-6" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 200 200">
            <!-- Briefcase body -->
            <rect x="30" y="70" width="140" height="100" rx="10" fill="currentColor" opacity="0.2" stroke="currentColor" stroke-width="2" />
            <!-- Briefcase handle -->
            <path d="M75 70 V55 Q75 45 85 45 H115 Q125 45 125 55 V70" fill="none" stroke="currentColor" stroke-width="2" />
            <!-- Latch -->
            <rect x="88" y="112" width="24" height="16" rx="4" fill="white" stroke="currentColor" stroke-width="2" />
            <!-- Papers inside -->
            <rect x="55" y="90" width="50" height="6" rx="2" fill="white" opacity="0.6" />
            <rect x="55" y="102" width="35" height="6" rx="2" fill="white" opacity="0.4" />
            <!-- Star/sparkle top right -->
            <circle cx="155" cy="50" r="5" fill="currentColor" opacity="0.4" />
            <circle cx="170" cy="35" r="3" fill="currentColor" opacity="0.3" />
            <circle cx="145" cy="30" r="4" fill="currentColor" opacity="0.5" />
            <!-- Checkmarks -->
            <circle cx="52" cy="155" r="10" fill="white" opacity="0.5" />
            <path d="M47 155 l3 3 l6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
          <h2 class="text-2xl font-bold text-indigo-700 mb-2">
            Твій Job Tracker
          </h2>
          <p class="text-indigo-400 text-sm leading-relaxed max-w-xs mx-auto">
            Відстежуй вакансії, рекрутерів та переписку в одному місці
          </p>
        </div>
      </div>

    </div>
  </div>
</template>
