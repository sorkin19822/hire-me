<script setup lang="ts">
useSeoMeta({ title: 'Налаштування — hire-me' })

interface TelegramStatus {
  connected: boolean
}

const status = ref<TelegramStatus>({ connected: false })
const statusLoading = ref(true)

const phone = ref('')
const code = ref('')
const codeSent = ref(false)
const sendingCode = ref(false)
const verifying = ref(false)
const error = ref<string | null>(null)

async function fetchStatus() {
  statusLoading.value = true
  try {
    const data = await $fetch<TelegramStatus>('/api/integrations/telegram/status')
    status.value = data
  } catch {
    status.value = { connected: false }
  } finally {
    statusLoading.value = false
  }
}

async function sendCode() {
  if (!phone.value.trim()) {
    error.value = 'Введіть номер телефону'
    return
  }
  error.value = null
  sendingCode.value = true
  try {
    await $fetch('/api/integrations/telegram/auth', {
      method: 'POST',
      body: { phone: phone.value.trim() }
    })
    codeSent.value = true
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Помилка надсилання коду'
  } finally {
    sendingCode.value = false
  }
}

async function verify() {
  if (!code.value.trim()) {
    error.value = 'Введіть код підтвердження'
    return
  }
  error.value = null
  verifying.value = true
  try {
    await $fetch('/api/integrations/telegram/verify', {
      method: 'POST',
      body: { code: code.value.trim() }
    })
    codeSent.value = false
    phone.value = ''
    code.value = ''
    await fetchStatus()
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Помилка підтвердження коду'
  } finally {
    verifying.value = false
  }
}

function goBack() {
  codeSent.value = false
  code.value = ''
  error.value = null
}

onMounted(() => {
  fetchStatus()
})
</script>

<template>
  <UContainer class="py-10 max-w-2xl">
    <div class="space-y-6">
      <!-- Page title -->
      <div>
        <h1 class="text-xl font-bold text-[oklch(32.70%_0.035_260.11)] dark:text-white">
          Налаштування
        </h1>
        <p class="text-sm text-[oklch(52.16%_0.047_260.80)] dark:text-[oklch(64.54%_0.049_258.74)] mt-1">
          Управління підключеннями та інтеграціями
        </p>
      </div>

      <!-- Telegram card -->
      <div
        class="rounded-[7px] bg-white dark:bg-[oklch(27.84%_0.027_257.53)] overflow-hidden"
        style="box-shadow: rgba(145,158,171,0.2) 0px 0px 2px 0px, rgba(145,158,171,0.12) 0px 12px 24px -4px;"
      >
        <!-- Card header -->
        <div class="px-6 py-4 border-b border-[oklch(92.03%_0.015_260.73)] dark:border-[oklch(36.67%_0.041_262.29)] flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div
              class="w-9 h-9 rounded-lg flex items-center justify-center"
              style="background: oklch(65% 0.18 230 / 12%);"
            >
              <UIcon
                name="i-lucide-send"
                class="w-5 h-5 text-[oklch(55%_0.18_230)]"
              />
            </div>
            <div>
              <h2 class="text-[15px] font-semibold text-[oklch(32.70%_0.035_260.11)] dark:text-white">
                Telegram
              </h2>
              <p class="text-xs text-[oklch(52.16%_0.047_260.80)] dark:text-[oklch(64.54%_0.049_258.74)]">
                MTProto автентифікація для отримання повідомлень
              </p>
            </div>
          </div>
          <template v-if="!statusLoading">
            <UBadge
              v-if="status.connected"
              color="success"
              variant="soft"
              icon="i-lucide-check-circle"
            >
              Підключено
            </UBadge>
            <UBadge
              v-else
              color="error"
              variant="soft"
              icon="i-lucide-x-circle"
            >
              Не підключено
            </UBadge>
          </template>
          <UIcon
            v-else
            name="i-lucide-loader-circle"
            class="w-5 h-5 animate-spin text-[oklch(52.16%_0.047_260.80)]"
          />
        </div>

        <!-- Card body -->
        <div class="p-6">
          <!-- Connected state -->
          <div
            v-if="status.connected"
            class="flex items-center gap-3 p-4 rounded-[7px]"
            style="background: oklch(80.48% 0.150 174.63 / 8%);"
          >
            <UIcon
              name="i-lucide-check-circle"
              class="w-5 h-5 text-success flex-shrink-0"
            />
            <p class="text-sm text-[oklch(32.70%_0.035_260.11)] dark:text-white">
              Telegram акаунт підключено. Імпорт повідомлень від рекрутерів доступний.
            </p>
          </div>

          <!-- Not connected: auth form -->
          <div
            v-else
            class="space-y-4"
          >
            <!-- Step 1: phone input -->
            <div
              v-if="!codeSent"
              class="space-y-3"
            >
              <p class="text-sm text-[oklch(52.16%_0.047_260.80)] dark:text-[oklch(64.54%_0.049_258.74)]">
                Введіть номер телефону, пов'язаний з вашим Telegram акаунтом. На нього буде надіслано SMS-код.
              </p>
              <div class="flex gap-3">
                <UInput
                  v-model="phone"
                  placeholder="+380501234567"
                  icon="i-lucide-phone"
                  size="md"
                  class="flex-1"
                  :disabled="sendingCode"
                  @keyup.enter="sendCode"
                />
                <UButton
                  :loading="sendingCode"
                  :disabled="sendingCode"
                  icon="i-lucide-send"
                  @click="sendCode"
                >
                  Надіслати код
                </UButton>
              </div>
            </div>

            <!-- Step 2: code verification -->
            <div
              v-else
              class="space-y-3"
            >
              <div
                class="flex items-center gap-2 p-3 rounded-[7px]"
                style="background: oklch(65.33% 0.184 266.79 / 8%);"
              >
                <UIcon
                  name="i-lucide-info"
                  class="w-4 h-4 text-primary flex-shrink-0"
                />
                <p class="text-sm text-[oklch(32.70%_0.035_260.11)] dark:text-white">
                  Код надіслано на <strong>{{ phone }}</strong>
                </p>
              </div>
              <div class="flex gap-3">
                <UInput
                  v-model="code"
                  placeholder="12345"
                  icon="i-lucide-key"
                  size="md"
                  class="flex-1"
                  :disabled="verifying"
                  @keyup.enter="verify"
                />
                <UButton
                  :loading="verifying"
                  :disabled="verifying"
                  icon="i-lucide-check"
                  @click="verify"
                >
                  Підтвердити
                </UButton>
                <UButton
                  variant="ghost"
                  icon="i-lucide-arrow-left"
                  :disabled="verifying"
                  @click="goBack"
                >
                  Назад
                </UButton>
              </div>
            </div>

            <!-- Error alert -->
            <UAlert
              v-if="error"
              color="error"
              variant="soft"
              :title="error"
              icon="i-lucide-alert-circle"
            />
          </div>
        </div>
      </div>
    </div>
  </UContainer>
</template>
