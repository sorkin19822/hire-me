import { useDatabase } from './index'
import { pipelineStages } from './schema'

const STAGES = [
  { name: 'Відгук', order: 0, color: '#6366f1', isTerminal: false },
  { name: 'HR', order: 1, color: '#8b5cf6', isTerminal: false },
  { name: "Тех. інтерв'ю", order: 2, color: '#a855f7', isTerminal: false },
  { name: 'CTO', order: 3, color: '#d946ef', isTerminal: false },
  { name: 'Тест', order: 4, color: '#ec4899', isTerminal: false },
  { name: 'Оффер', order: 5, color: '#10b981', isTerminal: false },
  { name: 'Відмова', order: 6, color: '#ef4444', isTerminal: true },
]

async function seed() {
  const db = useDatabase()

  const existing = db.select().from(pipelineStages).all()
  if (existing.length > 0) {
    console.log(`ℹ️  Seed: pipeline_stages вже містить ${existing.length} записів, пропускаємо.`)
    process.exit(0)
  }

  db.insert(pipelineStages).values(STAGES).run()

  console.log('✅ Seed: pipeline_stages заповнено (7 стадій)')
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
