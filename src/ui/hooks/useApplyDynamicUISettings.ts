import { useEffect } from 'react'
import { useSettingsStore } from '@/data/stores/settingsStore'

/**
 * Applique dynamiquement les préférences UI avancées (zoom, accent, police, contraste, motion) au <html>.
 */
export function useApplyDynamicUISettings() {
  const { settings } = useSettingsStore()

  useEffect(() => {
    const root = document.documentElement
    // Zoom (CSS variable + font-size root)
    root.style.setProperty('--ui-scale', String(settings.uiScale || 1))
    root.style.fontSize = `${(settings.uiScale || 1) * 100}%`
    // Accent
    root.style.setProperty('--accent-color', settings.accentColor || '#3b82f6')
    // Police & poids
    if(settings.fontFamily){
      root.style.setProperty('--ui-font-family', settings.fontFamily)
    }
    if(settings.fontWeight){
      root.style.setProperty('--ui-font-weight', String(settings.fontWeight))
    }
    // Contraste élevé
    if(settings.highContrast){
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }
    // Reduced motion override
    if(settings.reducedMotionOverride){
      root.classList.add('reduced-motion-force')
    } else {
      root.classList.remove('reduced-motion-force')
    }
  }, [settings.uiScale, settings.accentColor, settings.fontFamily, settings.fontWeight, settings.highContrast, settings.reducedMotionOverride])
}

export default useApplyDynamicUISettings
