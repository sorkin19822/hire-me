/**
 * Global $fetch error interceptor.
 * Shows a toast notification for every failed API request automatically,
 * so individual callers don't need their own error handling.
 */
export default defineNuxtPlugin(() => {
  const toast = useToast()

  globalThis.$fetch = $fetch.create({
    onResponseError({ response }) {
      const status = response.status
      const msg: string
        = response._data?.message
          || response._data?.statusMessage
          || response.statusText
          || 'Невідома помилка'

      toast.add({
        title: status >= 500 ? 'Помилка сервера' : 'Помилка',
        description: msg,
        color: 'error',
        icon: 'i-lucide-alert-circle',
        duration: 6000
      })
    }
  })
})
