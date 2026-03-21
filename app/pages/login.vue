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
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
    <UCard class="w-full max-w-sm">
      <template #header>
        <div class="text-center py-2">
          <h1 class="text-2xl font-bold text-primary">
            hire-me
          </h1>
          <p class="text-sm text-gray-500 mt-1">
            Job Search CRM
          </p>
        </div>
      </template>

      <div class="space-y-4 py-2">
        <UAlert
          v-if="errorMsg || credError"
          color="error"
          variant="soft"
          :title="credError ?? errorMsg ?? ''"
          icon="i-lucide-alert-circle"
        />

        <!-- Credentials form -->
        <form class="space-y-3" @submit.prevent="submitCredentials">
          <UInput
            v-model="form.email"
            type="email"
            placeholder="Email"
            autocomplete="email"
            required
          />
          <UInput
            v-model="form.password"
            type="password"
            placeholder="Пароль (мін. 8 символів)"
            autocomplete="current-password"
            required
          />
          <UButton
            type="submit"
            block
            size="lg"
            :loading="submitting"
            icon="i-lucide-log-in"
          >
            Увійти
          </UButton>
        </form>

        <UDivider label="або" />

        <!-- Google OAuth -->
        <UButton
          to="/auth/google"
          block
          size="lg"
          variant="outline"
          icon="i-simple-icons-google"
        >
          Увійти через Google
        </UButton>

        <p class="text-xs text-gray-400 text-center">
          Перший вхід з email+паролем — автоматична реєстрація
        </p>
      </div>
    </UCard>
  </div>
</template>
