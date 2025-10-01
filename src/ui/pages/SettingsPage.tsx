import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '@/ui/hooks/useTheme'
import { useFeedback } from '@/ui/components/feedback/useFeedback'
import { useSettingsStore } from '@/data/stores/settingsStore'
import { GlowButton } from '@/ui/components/Enhanced/EnhancedUILib'
import { logger } from '@/utils/logger'

interface SettingsSection {
  id: string
  title: string
  icon: string
}

const SettingsPage = () => {
  useTheme() // ensure theme context initialized (no direct use)
  const { enableSound, enableHaptics, toggleSound, toggleHaptics, play } = useFeedback()
  const { settings, updateSettings, loadSettings, resetSettings } = useSettingsStore()
  const [activeSection, setActiveSection] = useState('appearance')
  const [localSettings, setLocalSettings] = useState(settings)

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const sections: SettingsSection[] = [
  { id: 'appearance', title: 'Apparence', icon: '🎨' },
  { id: 'advanced-ui', title: 'UI Avancée', icon: '🛠️' },
    { id: 'study', title: 'Apprentissage', icon: '📚' },
    { id: 'gamification', title: 'Gamification', icon: '🎮' },
    { id: 'data', title: 'Données', icon: '💾' },
    { id: 'about', title: 'À propos', icon: 'ℹ️' }
  ]

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...localSettings, [key]: value }
    setLocalSettings(newSettings)
    updateSettings(newSettings)
  }

  const handleSave = () => {
    logger.info('SettingsPage', 'Paramètres sauvegardés')
  }

  const handleReset = () => {
    if (confirm('Réinitialiser tous les paramètres ?')) {
      resetSettings()
      setLocalSettings(settings)
    }
  }

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Thème</h3>
        <div className="grid grid-cols-3 gap-4">
          {['system', 'light', 'dark'].map((themeOption) => (
            <button
              key={themeOption}
              onClick={() => {
                handleSettingChange('theme', themeOption)
                if (themeOption === 'dark') {
                  document.documentElement.classList.add('dark')
                  document.body.classList.add('dark')
                } else if (themeOption === 'light') {
                  document.documentElement.classList.remove('dark')
                  document.body.classList.remove('dark')
                }
              }}
              className={`p-4 rounded-lg border-2 transition-all ${
                localSettings.theme === themeOption
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">
                  {themeOption === 'system' && '💻'}
                  {themeOption === 'light' && '☀️'}
                  {themeOption === 'dark' && '🌙'}
                </div>
                <div className="text-sm font-medium capitalize text-gray-900 dark:text-white">
                  {themeOption === 'system' ? 'Système' : themeOption === 'light' ? 'Clair' : 'Sombre'}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Interface</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-700 dark:text-gray-300 font-medium">Animations</label>
              <p className="text-sm text-gray-500 dark:text-gray-400">Activer les animations et transitions</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.animationsEnabled !== false}
                onChange={(e) => handleSettingChange('animationsEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-700 dark:text-gray-300 font-medium">Sons</label>
              <p className="text-sm text-gray-500 dark:text-gray-400">Effets sonores pour les interactions</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.soundEnabled !== false}
                onChange={(e) => handleSettingChange('soundEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label className="text-gray-700 dark:text-gray-300 font-medium">Feedback sonore (central)</label>
              <p className="text-sm text-gray-500 dark:text-gray-400">Système unifié (clic, succès...)</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableSound}
                onChange={() => { toggleSound(); setTimeout(()=> play('click'), 120) }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-700 dark:text-gray-300 font-medium">Vibrations (haptique)</label>
              <p className="text-sm text-gray-500 dark:text-gray-400">Retours tactiles (mobile)</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableHaptics}
                onChange={() => { toggleHaptics(); play('success') }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  )

  // Sélection dynamique de la section active

  const renderAdvancedUISettings = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Personnalisation Avancée</h3>
        <div className="space-y-6">
          {/* Zoom UI */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Zoom interface</label>
            <input type="range" min={0.8} max={1.4} step={0.05} value={localSettings.uiScale || 1}
                   onChange={(e)=> handleSettingChange('uiScale', parseFloat(e.target.value))}
                   className="w-full" />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{Math.round((localSettings.uiScale||1)*100)}%</div>
          </div>
          {/* Accent color */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Couleur d'accent</label>
            <div className="flex items-center gap-3">
              <input type="color" value={localSettings.accentColor || '#3b82f6'}
                     onChange={(e)=> handleSettingChange('accentColor', e.target.value)}
                     className="h-10 w-16 p-1 bg-transparent border border-gray-300 dark:border-gray-600 rounded" />
              <input type="text" value={localSettings.accentColor || '#3b82f6'}
                     onChange={(e)=> handleSettingChange('accentColor', e.target.value)}
                     className="flex-1 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
            </div>
          </div>
          {/* Police */}
            <div>
              <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Police UI</label>
              <input type="text" value={localSettings.fontFamily || ''} onChange={(e)=> handleSettingChange('fontFamily', e.target.value)}
                     placeholder="Inter, system-ui, sans-serif" className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Liste séparée par virgules</p>
            </div>
          {/* Contraste */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-700 dark:text-gray-300 font-medium">Contraste élevé</label>
              <p className="text-sm text-gray-500 dark:text-gray-400">Renforce lisibilité couleurs</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={localSettings.highContrast === true}
                     onChange={(e)=> handleSettingChange('highContrast', e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:bg-amber-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-full"></div>
            </label>
          </div>
          {/* 3D */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-700 dark:text-gray-300 font-medium">Effets 3D</label>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active transformations & perspective</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={localSettings.enable3D !== false}
                     onChange={(e)=> handleSettingChange('enable3D', e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:bg-fuchsia-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-full"></div>
            </label>
          </div>
          {/* Vitesse flip */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Vitesse flip carte (ms)</label>
            <input type="number" min={150} max={2000} value={localSettings.cardFlipSpeedMs || 500}
                   onChange={(e)=> handleSettingChange('cardFlipSpeedMs', parseInt(e.target.value)||500)}
                   className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
          </div>
          {/* Profondeur 3D */}
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-1">Profondeur 3D (perspective)</label>
            <input type="range" min={400} max={2400} step={100} value={localSettings.card3DDepth || 1000}
                   onChange={(e)=> handleSettingChange('card3DDepth', parseInt(e.target.value))} className="w-full" />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{localSettings.card3DDepth || 1000}px</div>
          </div>
          {/* Timer étude */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-700 dark:text-gray-300 font-medium">Afficher timer étude</label>
              <p className="text-sm text-gray-500 dark:text-gray-400">Chrono session active</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={localSettings.showStudyTimer !== false}
                     onChange={(e)=> handleSettingChange('showStudyTimer', e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:bg-blue-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-full"></div>
            </label>
          </div>
          {/* Raccourcis */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-700 dark:text-gray-300 font-medium">Raccourcis clavier étude</label>
              <p className="text-sm text-gray-500 dark:text-gray-400">Espace / 0‑4</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={localSettings.studyShortcuts !== false}
                     onChange={(e)=> handleSettingChange('studyShortcuts', e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:bg-green-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-full"></div>
            </label>
          </div>
          {/* Reduced motion override */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-700 dark:text-gray-300 font-medium">Forcer réduction motion</label>
              <p className="text-sm text-gray-500 dark:text-gray-400">Désactive transitions lourdes</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={localSettings.reducedMotionOverride === true}
                     onChange={(e)=> handleSettingChange('reducedMotionOverride', e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:bg-red-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-full"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  )

  const renderStudySettings = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Objectifs d'étude</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              Objectif quotidien (cartes)
            </label>
            <input
              type="number"
              value={localSettings.dailyGoal || 20}
              onChange={(e) => handleSettingChange('dailyGoal', parseInt(e.target.value))}
              min="1"
              max="500"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              Algorithme de difficulté
            </label>
            <select
              value={localSettings.difficultyAlgorithm || 'sm2'}
              onChange={(e) => handleSettingChange('difficultyAlgorithm', e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="basic">Basique</option>
              <option value="sm2">SM-2 (SuperMemo)</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
              Catégorie par défaut
            </label>
            <input
              type="text"
              value={localSettings.defaultDeckCategory || 'Général'}
              onChange={(e) => handleSettingChange('defaultDeckCategory', e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-700 dark:text-gray-300 font-medium">Rappels d'étude</label>
              <p className="text-sm text-gray-500 dark:text-gray-400">Notifications pour les sessions</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.studyReminders !== false}
                onChange={(e) => handleSettingChange('studyReminders', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-700 dark:text-gray-300 font-medium">Lecture automatique</label>
              <p className="text-sm text-gray-500 dark:text-gray-400">Audio automatique des cartes</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.autoPlayAudio !== false}
                onChange={(e) => handleSettingChange('autoPlayAudio', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-700 dark:text-gray-300 font-medium">Afficher les progrès</label>
              <p className="text-sm text-gray-500 dark:text-gray-400">Statistiques en temps réel</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.showProgress !== false}
                onChange={(e) => handleSettingChange('showProgress', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  )

  const renderGamificationSettings = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Système de gamification</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-700 dark:text-gray-300 font-medium">Activer la gamification</label>
              <p className="text-sm text-gray-500 dark:text-gray-400">XP, niveaux, succès, feedback</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.gamificationEnabled !== false}
                onChange={(e) => handleSettingChange('gamificationEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-700 dark:text-gray-300 font-medium">Mode compact</label>
              <p className="text-sm text-gray-500 dark:text-gray-400">Affichage réduit (gain d'espace)</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.gamificationCompact === true}
                onChange={(e) => handleSettingChange('gamificationCompact', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-fuchsia-300 dark:peer-focus:ring-fuchsia-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-fuchsia-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-700 dark:text-gray-300 font-medium">Animations Interface</label>
              <p className="text-sm text-gray-500 dark:text-gray-400">Effets visuels et animations</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.animationsEnabled !== false}
                onChange={(e) => handleSettingChange('animationsEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-gray-700 dark:text-gray-300 font-medium">Effets sonores</label>
              <p className="text-sm text-gray-500 dark:text-gray-400">Sons de réussite et feedback</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.soundEnabled !== false}
                onChange={(e) => handleSettingChange('soundEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Paramètres avancés</h4>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>• Système XP et niveaux intégré</p>
              <p>• Achievements automatiques</p>
              <p>• Micro-interactions intelligentes</p>
              <p>• Gamification adaptative selon les performances</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderDataSettings = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Gestion des données</h3>
        <div className="space-y-4">
          <GlowButton
            variant="secondary"
            onClick={() => {
              const data = { settings: localSettings, timestamp: new Date().toISOString() }
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `cards-settings-${new Date().toISOString().split('T')[0]}.json`
              a.click()
              URL.revokeObjectURL(url)
            }}
            className="w-full"
          >
            📥 Exporter mes données
          </GlowButton>

          <GlowButton
            variant="warning"
            onClick={handleReset}
            className="w-full text-orange-600 border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
          >
            🔄 Réinitialiser les paramètres
          </GlowButton>

          <GlowButton
            variant="danger"
            onClick={() => {
              if (confirm('Supprimer toutes les données ? Cette action est irréversible.')) {
                localStorage.clear()
                window.location.reload()
              }
            }}
            className="w-full text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            🗑️ Supprimer toutes les données
          </GlowButton>
        </div>
      </div>
    </div>
  )

  const renderAboutSettings = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cards</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Version :</span>
            <span className="font-medium text-gray-900 dark:text-white">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Build :</span>
            <span className="font-medium text-gray-900 dark:text-white">2025.01.01</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Dernière mise à jour :</span>
            <span className="font-medium text-gray-900 dark:text-white">Janvier 2025</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Fonctionnalités</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-green-500">✅</span>
            <span className="text-gray-900 dark:text-white">7 Systèmes d'optimisation</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-500">✅</span>
            <span className="text-gray-900 dark:text-white">IA d'apprentissage</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-500">✅</span>
            <span className="text-gray-900 dark:text-white">Gamification complète</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-500">✅</span>
            <span className="text-gray-900 dark:text-white">Mode hors-ligne</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-500">✅</span>
            <span className="text-gray-900 dark:text-white">Analytics avancées</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-500">✅</span>
            <span className="text-gray-900 dark:text-white">Micro-interactions</span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'appearance': return renderAppearanceSettings()
  case 'advanced-ui': return renderAdvancedUISettings()
      case 'study': return renderStudySettings()
      case 'gamification': return renderGamificationSettings()
      case 'data': return renderDataSettings()
      case 'about': return renderAboutSettings()
      default: return renderAppearanceSettings()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 shadow-lg min-h-screen">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paramètres</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Configuration avancée</p>
          </div>
          
          <nav className="p-4">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-all ${
                  activeSection === section.id
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="text-lg">{section.icon}</span>
                <span className="font-medium">{section.title}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 p-8">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderActiveSection()}
          </motion.div>

          {/* Actions footer */}
          <div className="mt-8 flex space-x-4">
            <GlowButton
              variant="primary"
              onClick={handleSave}
              glow
            >
              💾 Sauvegarder
            </GlowButton>
            
            <GlowButton
              variant="secondary"
              onClick={() => setLocalSettings(settings)}
            >
              🔄 Annuler
            </GlowButton>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
