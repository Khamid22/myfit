import { BookOpen, ChevronRight, Database, Download, Dumbbell, ImageDown, ListChecks, Pencil, RotateCcw, ShieldCheck, Trash2, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useApp } from '../../app/context'
import { useMeta, useWeights } from '../../hooks/data'
import { ACTIVITY_LEVELS, calculatedTargets, estimateEnergy } from '../../domain/profile/energy'
import type { Targets, ThemePref } from '../../domain/models'
import { int, parseNum } from '../../lib/format'
import { backupFileName, deleteEverything, exportData, exportPhotos, importData, importPhotos, parseBackup, saveJsonFile, summarize } from '../../storage/backup/backup'
import { profileRepo } from '../../storage/repositories/profile'
import { applyTheme } from '../../app/theme'
import { useFeedback } from '../../ui/feedback'
import { Page } from '../../ui/Page'
import { Button, Card, cx, Field, NumberInput, SectionTitle, Segmented } from '../../ui/primitives'
import { PersonalSheet } from './PersonalSheet'
import { BackLink } from '../../ui/BackLink'

export function profileEnergyInput(p: ReturnType<typeof useApp>['profile'], currentKg: number) {
  return {
    sex: p.sex,
    age: new Date().getFullYear() - p.birthYear,
    heightCm: p.heightCm,
    weightKg: currentKg,
    activity: p.activity,
    goal: p.goal,
    goalWeightKg: p.goalWeightKg,
  }
}

export function ProfileScreen() {
  const { profile, units } = useApp()
  const weights = useWeights()
  const navigate = useNavigate()
  const { confirm, toast } = useFeedback()
  const lastBackup = useMeta<string>('lastBackupAt')
  const [editing, setEditing] = useState(false)
  const [persisted, setPersisted] = useState<boolean | null>(null)
  const importInput = useRef<HTMLInputElement>(null)

  const currentKg = weights.at(-1)?.kg ?? profile.startWeightKg
  const input = profileEnergyInput(profile, currentKg)
  const est = estimateEnergy(input)
  const recommended = calculatedTargets(input)

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted).catch(() => setPersisted(null))
  }, [])

  const age = new Date().getFullYear() - profile.birthYear
  const heightLabel =
    units.l === 'cm' ? `${Math.round(profile.heightCm)} cm` : `${Math.floor(profile.heightCm / 2.54 / 12)}′ ${Math.round((profile.heightCm / 2.54) % 12)}″`
  const days = lastBackup ? Math.floor((Date.now() - new Date(lastBackup).getTime()) / 86_400_000) : null

  async function onImportFile(file: File) {
    const text = await file.text()
    try {
      if (text.includes('"myfit-photos"')) {
        const n = await importPhotos(text)
        toast(`Imported ${n} photos`)
        return
      }
      const backup = parseBackup(text)
      const ok = await confirm({
        title: 'Replace all data?',
        body: (
          <>
            <p>{summarize(backup)}</p>
            <p className="mt-2">Your current data on this device will be replaced by this backup. Photos are not affected. Export first if you want to keep a copy.</p>
          </>
        ),
        confirmLabel: 'Replace with backup',
        danger: true,
      })
      if (ok) {
        await importData(backup)
        toast('Backup restored')
      }
    } catch (e) {
      toast((e as Error).message || 'Could not read that file')
    }
  }

  return (
    <Page title="Settings" eyebrow={<BackLink label="Today" to="/" />}>
      <div className="space-y-6">
        <Card onClick={() => setEditing(true)}>
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-accent-soft text-[22px] font-bold text-accent-strong">{profile.name.slice(0, 1).toUpperCase()}</div>
            <div className="min-w-0 flex-1">
              <div className="text-[19px] font-semibold">{profile.name}</div>
              <div className="text-[13px] text-muted">
                {age} y · {profile.sex === 'male' ? 'Male' : 'Female'} · {heightLabel}
              </div>
              <div className="text-[13px] text-muted">
                {profile.goal === 'lose' ? 'Lose weight' : profile.goal === 'gain' ? 'Gain weight' : 'Maintain'} · Goal {units.weightU(profile.goalWeightKg)} ·{' '}
                {ACTIVITY_LEVELS.find((a) => a.id === profile.activity)?.label}
              </div>
            </div>
            <Pencil size={17} className="text-faint" />
          </div>
        </Card>

        <TargetsSection targets={profile.targets} recommended={recommended} bmr={est.bmr} maintenance={est.maintenance} />

        <section>
          <SectionTitle>Preferences</SectionTitle>
          <Card className="space-y-4">
            <Field label="Weight unit">
              <Segmented options={[{ value: 'kg', label: 'Kilograms' }, { value: 'lb', label: 'Pounds' }]} value={profile.units.weight} onChange={(v) => profileRepo.update({ units: { ...profile.units, weight: v } })} />
            </Field>
            <Field label="Length unit">
              <Segmented options={[{ value: 'cm', label: 'Centimetres' }, { value: 'in', label: 'Inches' }]} value={profile.units.length} onChange={(v) => profileRepo.update({ units: { ...profile.units, length: v } })} />
            </Field>
            <Field label="Daily water goal">
              <NumberInput integer value={String(profile.waterGoalMl)} onChange={(v) => parseNum(v) && profileRepo.update({ waterGoalMl: parseNum(v)! })} suffix="ml" />
            </Field>
            <Field label="Theme">
              <Segmented<ThemePref>
                options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }, { value: 'system', label: 'System' }]}
                value={profile.theme}
                onChange={(v) => {
                  applyTheme(v)
                  void profileRepo.update({ theme: v })
                }}
              />
            </Field>
          </Card>
        </section>

        <section>
          <SectionTitle>Setup</SectionTitle>
          <Card className="!py-1">
            <NavRow icon={ListChecks} label="Habits" onClick={() => navigate('/settings/habits')} />
            <NavRow icon={Dumbbell} label="Workout templates" onClick={() => navigate('/workout/templates')} />
            <NavRow icon={BookOpen} label="My Foods & saved meals" onClick={() => navigate('/food/library')} />
          </Card>
        </section>

        <section>
          <SectionTitle>Data & backup</SectionTitle>
          <Card>
            <div className="flex gap-3 text-[13px] leading-relaxed text-muted">
              <Database size={18} className="mt-0.5 shrink-0 text-accent-strong" />
              <p>
                Everything is stored only on this device. Clearing Safari website data or removing the app can erase it — export a backup regularly and keep it in Files or iCloud Drive.
              </p>
            </div>
            <div className={cx('mt-3 rounded-xl px-3 py-2 text-[13px]', days == null || days > 14 ? 'bg-warn-soft text-warn' : 'bg-good-soft text-good')}>
              {days == null ? 'No backup yet' : days === 0 ? 'Last backup: today' : `Last backup: ${days} day${days === 1 ? '' : 's'} ago`}
              {persisted && (
                <span className="ml-2 inline-flex items-center gap-1 text-muted">
                  <ShieldCheck size={13} /> persistent storage
                </span>
              )}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button icon={Download} variant="primary" onClick={async () => saveJsonFile(await exportData(), backupFileName('data'))}>
                Export data
              </Button>
              <Button icon={ImageDown} onClick={async () => saveJsonFile(await exportPhotos(), backupFileName('photos'))}>
                Export photos
              </Button>
              <Button icon={Upload} className="col-span-2" onClick={() => importInput.current?.click()}>
                Import backup
              </Button>
            </div>
            <input
              ref={importInput}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (f) void onImportFile(f)
              }}
            />
            <p className="mt-2 text-[12px] text-faint">Photos export as a separate file so your main backup stays small.</p>
          </Card>
          <Button
            block
            variant="ghost"
            icon={Trash2}
            className="mt-3 !text-warn"
            onClick={async () => {
              const ok = await confirm({
                title: 'Delete all data?',
                body: 'This permanently erases your profile, logs, workouts and photos from this device. It cannot be undone. Consider exporting a backup first.',
                confirmLabel: 'Delete everything',
                typeToConfirm: 'DELETE',
                danger: true,
              })
              if (ok) {
                await deleteEverything()
                location.replace('/')
              }
            }}
          >
            Delete all data
          </Button>
        </section>

        <p className="px-4 pb-2 text-center text-[12px] leading-relaxed text-faint">
          MyFit 1.0 · Insights are simple rules based on your own logs, not medical advice. Calorie needs are estimates.
        </p>
      </div>

      <PersonalSheet open={editing} onClose={() => setEditing(false)} currentKg={currentKg} />
    </Page>
  )
}

function NavRow({ icon: Icon, label, onClick }: { icon: typeof ListChecks; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="press flex min-h-14 w-full items-center gap-3 rounded-xl text-left active:bg-surface-2">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-surface-2 text-muted">
        <Icon size={18} />
      </span>
      <span className="flex-1 text-[15px] font-medium">{label}</span>
      <ChevronRight size={18} className="text-faint" />
    </button>
  )
}

function TargetsSection({ targets, recommended, bmr, maintenance }: { targets: Targets; recommended: Targets; bmr: number; maintenance: number }) {
  const [draft, setDraft] = useState({ kcal: '', protein: '', carbs: '', fat: '' })
  const { toast } = useFeedback()
  useEffect(() => {
    setDraft({ kcal: String(targets.kcal), protein: String(targets.protein), carbs: String(targets.carbs), fat: String(targets.fat) })
  }, [targets])

  const dirty = (['kcal', 'protein', 'carbs', 'fat'] as const).some((k) => parseNum(draft[k]) !== targets[k])
  const macroKcal = (parseNum(draft.protein) ?? 0) * 4 + (parseNum(draft.carbs) ?? 0) * 4 + (parseNum(draft.fat) ?? 0) * 9
  const differs = (['kcal', 'protein', 'carbs', 'fat'] as const).some((k) => recommended[k] !== targets[k])

  return (
    <section>
      <SectionTitle>
        Daily targets
      </SectionTitle>
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <span className={cx('rounded-full px-2.5 py-1 text-[12px] font-semibold', targets.source === 'manual' ? 'bg-warn-soft text-warn' : 'bg-good-soft text-good')}>
            {targets.source === 'manual' ? 'Manual' : 'Calculated'}
          </span>
          <span className="text-[12px] text-muted">
            BMR {int(bmr)} · maintenance ≈ {int(maintenance)} kcal
          </span>
        </div>
        <Field label="Calories">
          <NumberInput integer value={draft.kcal} onChange={(v) => setDraft({ ...draft, kcal: v })} suffix="kcal" />
        </Field>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Field label="Protein">
            <NumberInput integer value={draft.protein} onChange={(v) => setDraft({ ...draft, protein: v })} suffix="g" />
          </Field>
          <Field label="Carbs">
            <NumberInput integer value={draft.carbs} onChange={(v) => setDraft({ ...draft, carbs: v })} suffix="g" />
          </Field>
          <Field label="Fat">
            <NumberInput integer value={draft.fat} onChange={(v) => setDraft({ ...draft, fat: v })} suffix="g" />
          </Field>
        </div>
        <p className="mt-2 px-1 text-[12px] text-faint">Macros add up to {int(macroKcal)} kcal.</p>
        {dirty && (
          <Button
            block
            variant="solid"
            className="mt-3"
            onClick={async () => {
              await profileRepo.update({
                targets: {
                  kcal: parseNum(draft.kcal) ?? targets.kcal,
                  protein: parseNum(draft.protein) ?? targets.protein,
                  carbs: parseNum(draft.carbs) ?? targets.carbs,
                  fat: parseNum(draft.fat) ?? targets.fat,
                  source: 'manual',
                },
              })
              toast('Targets saved')
            }}
          >
            Save targets
          </Button>
        )}
        {differs && !dirty && (
          <Button
            block
            variant="ghost"
            icon={RotateCcw}
            className="mt-2"
            onClick={async () => {
              await profileRepo.update({ targets: recommended })
              toast('Recommended targets restored')
            }}
          >
            Restore recommended ({int(recommended.kcal)} kcal)
          </Button>
        )}
        <p className="mt-2 px-1 text-[12px] leading-snug text-faint">
          The recommendation uses your latest weight. If your 7-day average isn't moving as expected after 2–3 weeks, adjust by 100–200 kcal.
        </p>
      </Card>
    </section>
  )
}
