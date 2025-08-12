import { useCallback, useEffect, useState } from 'react'

interface StudySettings {
  showTimer: boolean
  enableShortcuts: boolean
}

const LS_KEY = 'ariba.study.settings.v1'

const DEFAULT_SETTINGS: StudySettings = {
  showTimer: true,
  enableShortcuts: true
}

export function useStudySettings() {
  const [settings, setSettings] = useState<StudySettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if(raw){
        const parsed = JSON.parse(raw)
        setSettings({ ...DEFAULT_SETTINGS, ...parsed })
      }
    } catch { /* ignore */ }
  }, [])

  const update = useCallback(<K extends keyof StudySettings>(key: K, value: StudySettings[K]) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value }
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  const toggleShowTimer = useCallback(() => update('showTimer', !settings.showTimer), [settings.showTimer, update])
  const toggleShortcuts = useCallback(() => update('enableShortcuts', !settings.enableShortcuts), [settings.enableShortcuts, update])

  return { settings, toggleShowTimer, toggleShortcuts }
}

export default useStudySettings
