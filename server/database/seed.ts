import { useDatabase } from './index'
import { pipelineStages, vacancies } from './schema'

const STAGES = [
  { name: 'Відгук', order: 0, color: '#6366f1', isTerminal: false },
  { name: 'HR', order: 1, color: '#8b5cf6', isTerminal: false },
  { name: "Тех. інтерв'ю", order: 2, color: '#a855f7', isTerminal: false },
  { name: 'CTO', order: 3, color: '#d946ef', isTerminal: false },
  { name: 'Тест', order: 4, color: '#ec4899', isTerminal: false },
  { name: 'Оффер', order: 5, color: '#10b981', isTerminal: false },
  { name: 'Відмова', order: 6, color: '#ef4444', isTerminal: true },
  { name: 'Без відповіді', order: 7, color: '#94a3b8', isTerminal: true },
]

const VACANCIES = [
  { company: 'Grammarly', position: 'Senior PHP Developer', applyDate: '2026-01-05', urlSite: 'https://grammarly.com', urlDou: 'https://djinni.co/jobs/1001', stageIdx: 6 },
  { company: 'Preply', position: 'Middle PHP Developer', applyDate: '2026-01-10', urlSite: 'https://preply.com', urlDou: 'https://djinni.co/jobs/1002', stageIdx: 1 },
  { company: 'Liqpay', position: 'Backend PHP Developer', applyDate: '2026-01-14', urlSite: 'https://liqpay.ua', urlDou: 'https://djinni.co/jobs/1003', stageIdx: 2 },
  { company: 'Rozetka', position: 'PHP Developer (Symfony)', applyDate: '2026-01-18', urlSite: 'https://rozetka.com.ua', urlDou: 'https://djinni.co/jobs/1004', stageIdx: 7 },
  { company: 'Ajax Systems', position: 'PHP Backend Engineer', applyDate: '2026-01-22', urlSite: 'https://ajax.systems', urlDou: 'https://djinni.co/jobs/1005', stageIdx: 3 },
  { company: 'Reface', position: 'PHP Developer', applyDate: '2026-01-28', urlSite: 'https://reface.app', urlDou: 'https://djinni.co/jobs/1006', stageIdx: 1 },
  { company: 'MacPaw', position: 'Strong Junior PHP Developer', applyDate: '2026-02-02', urlSite: 'https://macpaw.com', urlDou: 'https://djinni.co/jobs/1007', stageIdx: 6 },
  { company: 'Monobank', position: 'Backend Developer (PHP/Go)', applyDate: '2026-02-06', urlSite: 'https://monobank.ua', urlDou: 'https://djinni.co/jobs/1008', stageIdx: 2 },
  { company: 'EPAM Ukraine', position: 'PHP Engineer', applyDate: '2026-02-10', urlSite: 'https://epam.com', urlDou: 'https://djinni.co/jobs/1009', stageIdx: 4 },
  { company: 'Intellias', position: 'PHP Developer (Laravel)', applyDate: '2026-02-13', urlSite: 'https://intellias.com', urlDou: 'https://djinni.co/jobs/1010', stageIdx: 1 },
  { company: 'SoftServe', position: 'Middle PHP Developer', applyDate: '2026-02-17', urlSite: 'https://softserveinc.com', urlDou: 'https://djinni.co/jobs/1011', stageIdx: 7 },
  { company: 'GlobalLogic', position: 'PHP Backend Developer', applyDate: '2026-02-20', urlSite: 'https://globallogic.com', urlDou: 'https://djinni.co/jobs/1012', stageIdx: 3 },
  { company: 'Ciklum', position: 'PHP Developer (Yii2)', applyDate: '2026-02-24', urlSite: 'https://ciklum.com', urlDou: 'https://djinni.co/jobs/1013', stageIdx: 2 },
  { company: 'Sigma Software', position: 'Senior PHP Developer', applyDate: '2026-02-27', urlSite: 'https://sigma.software', urlDou: 'https://djinni.co/jobs/1014', stageIdx: 5 },
  { company: 'Netpeak', position: 'PHP Developer', applyDate: '2026-03-03', urlSite: 'https://netpeak.net', urlDou: 'https://djinni.co/jobs/1015', stageIdx: 1 },
  { company: 'Uklon', position: 'PHP Backend Engineer', applyDate: '2026-03-06', urlSite: 'https://uklon.com.ua', urlDou: 'https://djinni.co/jobs/1016', stageIdx: 6 },
  { company: 'Nova Poshta Digital', position: 'PHP Developer (Symfony/API)', applyDate: '2026-03-09', urlSite: 'https://novaposhta.ua', urlDou: 'https://djinni.co/jobs/1017', stageIdx: 2 },
  { company: 'Depositphotos', position: 'Middle/Senior PHP Developer', applyDate: '2026-03-12', urlSite: 'https://depositphotos.com', urlDou: 'https://djinni.co/jobs/1018', stageIdx: 3 },
  { company: 'Boosters', position: 'PHP Developer', applyDate: '2026-03-15', urlSite: 'https://boosters.pro', urlDou: 'https://djinni.co/jobs/1019', stageIdx: 0 },
  { company: 'Jooble', position: 'PHP Backend Developer', applyDate: '2026-03-18', urlSite: 'https://jooble.org', urlDou: 'https://djinni.co/jobs/1020', stageIdx: 1 },
]

async function seed() {
  const db = useDatabase()

  // Pipeline stages
  const existingStages = db.select().from(pipelineStages).all()
  if (existingStages.length > 0) {
    console.log(`ℹ️  pipeline_stages: вже містить ${existingStages.length} записів, пропускаємо.`)
  }
  else {
    db.insert(pipelineStages).values(STAGES).run()
    console.log(`✅ pipeline_stages: додано ${STAGES.length} стадій`)
  }

  // Sample vacancies
  const existingVacancies = db.select().from(vacancies).all()
  if (existingVacancies.length > 0) {
    console.log(`ℹ️  vacancies: вже містить ${existingVacancies.length} записів, пропускаємо.`)
  }
  else {
    const stages = db.select().from(pipelineStages).all()
    const rows = VACANCIES.map(v => ({
      company: v.company,
      position: v.position,
      applyDate: v.applyDate,
      urlSite: v.urlSite,
      urlDou: v.urlDou,
      stageId: stages[v.stageIdx]?.id ?? stages[0]!.id,
    }))
    db.insert(vacancies).values(rows).run()
    console.log(`✅ vacancies: додано ${rows.length} тестових вакансій`)
  }

  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
