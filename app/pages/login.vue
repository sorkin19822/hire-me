<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const { loggedIn } = useUserSession()

if (loggedIn.value) {
  await navigateTo('/')
}

const errorMsg = computed(() => {
  if (route.query.error === 'unauthorized') return 'Цей email не в списку дозволених. Зверніться до адміністратора.'
  if (route.query.error === 'oauth') return 'Помилка авторизації Google. Спробуйте ще раз.'
  return null
})
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
          v-if="errorMsg"
          color="error"
          variant="soft"
          :title="errorMsg"
          icon="i-lucide-alert-circle"
        />

        <UButton
          to="/auth/google"
          block
          size="lg"
          icon="i-simple-icons-google"
        >
          Увійти через Google
        </UButton>
      </div>
    </UCard>
  </div>
</template>
