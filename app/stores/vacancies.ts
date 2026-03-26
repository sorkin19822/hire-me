import type { CalendarDate } from '@internationalized/date'
import { parseDate } from '@internationalized/date'

type VacancyRow = {
  id: number
  company: string
  position: string
  applyDate: string | null
  stageId: number | null
  stageName: string | null
  stageColor: string | null
  notes: string | null
  urlDou: string | null
  urlLinkedin: string | null
  urlSite: string | null
  createdAt: string | null
  updatedAt: string | null
  messagesCount: number
}

export const useVacanciesStore = defineStore('vacancies', () => {
  // Filters
  const search = ref('')
  const stageId = ref<number | null>(null)
  const dateFrom = ref('')
  const dateTo = ref('')
  const datePreset = ref('')
  const dateFromOpen = ref(false)
  const dateToOpen = ref(false)

  // Pagination
  const currentPage = ref(1)
  const perPage = ref(10)
  const perPageOptions = [
    { label: '10', value: 10 },
    { label: '25', value: 25 },
    { label: '50', value: 50 },
    { label: '100', value: 100 }
  ]

  // Data
  const items = ref<VacancyRow[]>([])
  const loading = ref(false)

  // Fetch from server
  async function fetchVacancies() {
    loading.value = true
    try {
      const data = await $fetch<VacancyRow[]>('/api/vacancies', {
        query: {
          search: search.value || undefined,
          stage_id: stageId.value ?? undefined,
          date_from: dateFrom.value || undefined,
          date_to: dateTo.value || undefined
        }
      })
      items.value = data
    } finally {
      loading.value = false
    }
  }

  // Reset page and refetch on filter change
  watch([search, stageId, dateFrom, dateTo], () => {
    currentPage.value = 1
    fetchVacancies()
  })

  // Pagination computed
  const totalItems = computed(() => items.value.length)
  const showingFrom = computed(() => totalItems.value === 0 ? 0 : (currentPage.value - 1) * perPage.value + 1)
  const showingTo = computed(() => Math.min(currentPage.value * perPage.value, totalItems.value))
  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * perPage.value
    return items.value.slice(start, start + perPage.value)
  })

  watch(perPage, () => {
    currentPage.value = 1
  })

  // Date presets
  const datePresets = [
    { label: '7д', days: 7 },
    { label: '30д', days: 30 },
    { label: '3м', days: 90 },
    { label: '1р', days: 365 }
  ]

  function applyPreset(label: string, days: number) {
    if (datePreset.value === label) {
      clearDateFilter()
      return
    }
    datePreset.value = label
    const from = new Date()
    from.setDate(from.getDate() - days)
    dateFrom.value = from.toISOString().slice(0, 10)
    dateTo.value = new Date().toISOString().slice(0, 10)
  }

  function clearDateFilter() {
    dateFrom.value = ''
    dateTo.value = ''
    datePreset.value = ''
  }

  // CalendarDate computed for UCalendar
  const dateFromValue = computed({
    get: (): CalendarDate | undefined => {
      try {
        return dateFrom.value ? parseDate(dateFrom.value) : undefined
      } catch {
        return undefined
      }
    },
    set(val: CalendarDate | undefined) {
      dateFrom.value = val ? val.toString() : ''
      dateFromOpen.value = false
    }
  })

  const dateToValue = computed({
    get: (): CalendarDate | undefined => {
      try {
        return dateTo.value ? parseDate(dateTo.value) : undefined
      } catch {
        return undefined
      }
    },
    set(val: CalendarDate | undefined) {
      dateTo.value = val ? val.toString() : ''
      dateToOpen.value = false
    }
  })

  return {
    search,
    stageId,
    dateFrom,
    dateTo,
    datePreset,
    dateFromOpen,
    dateToOpen,
    currentPage,
    perPage,
    perPageOptions,
    items,
    loading,
    totalItems,
    showingFrom,
    showingTo,
    paginatedItems,
    datePresets,
    dateFromValue,
    dateToValue,
    fetchVacancies,
    applyPreset,
    clearDateFilter
  }
})
