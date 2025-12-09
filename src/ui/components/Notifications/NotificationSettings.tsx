import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { usePushNotificationService } from '@/ui/hooks/usePushNotificationService'
import Icons from '@/ui/components/common/Icons'

export const NotificationSettings: React.FC = () => {
  const { service: pushNotificationService, isReady } = usePushNotificationService()
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)
  const [reminderInterval, setReminderInterval] = useState(60)
  const [enableDailyReminder, setEnableDailyReminder] = useState(false)
  const [enableStreakWarning, setEnableStreakWarning] = useState(true)
  const [enableAchievements, setEnableAchievements] = useState(true)

  useEffect(() => {
    if (!isReady) return

    setIsSupported(pushNotificationService.isNotificationSupported())
    setPermission(pushNotificationService.getPermission())

    // Charger préférences depuis localStorage
    const savedPrefs = localStorage.getItem('notification-preferences')
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs)
      setReminderInterval(prefs.reminderInterval || 60)
      setEnableDailyReminder(prefs.enableDailyReminder || false)
      setEnableStreakWarning(prefs.enableStreakWarning !== false)
      setEnableAchievements(prefs.enableAchievements !== false)
    }
  }, [isReady, pushNotificationService])

  const savePreferences = () => {
    const prefs = {
      reminderInterval,
      enableDailyReminder,
      enableStreakWarning,
      enableAchievements
    }
    localStorage.setItem('notification-preferences', JSON.stringify(prefs))
  }

  const handleRequestPermission = async () => {
    const granted = await pushNotificationService.requestPermission()
    setPermission(granted ? 'granted' : 'denied')
  }

  const handleTestNotification = async () => {
    await pushNotificationService.sendNotification({
      title: '✅ Test de notification',
      body: 'Si vous voyez ce message, les notifications fonctionnent !',
      tag: 'test'
    })
  }

  const handleToggleDailyReminder = (enabled: boolean) => {
    setEnableDailyReminder(enabled)
    savePreferences()
    
    if (enabled) {
      pushNotificationService.scheduleRecurringReminder(reminderInterval)
    }
  }

  if (!isSupported) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
          <Icons.Settings size="md" />
          <div>
            <div className="font-medium">Notifications non supportées</div>
            <div className="text-sm">Votre navigateur ne supporte pas les notifications push.</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Status Permission */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          État des Notifications
        </h3>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {permission === 'granted' ? (
              <>
                <Icons.Check size="lg" className="text-green-500" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Activées</div>
                  <div className="text-sm text-gray-500">Les notifications sont autorisées</div>
                </div>
              </>
            ) : permission === 'denied' ? (
              <>
                <Icons.Settings size="lg" className="text-red-500" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Désactivées</div>
                  <div className="text-sm text-gray-500">Réactivez-les dans les paramètres du navigateur</div>
                </div>
              </>
            ) : (
              <>
                <Icons.Settings size="lg" className="text-orange-500" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">Non configurées</div>
                  <div className="text-sm text-gray-500">Cliquez pour activer</div>
                </div>
              </>
            )}
          </div>
          
          {permission !== 'granted' && permission !== 'denied' && (
            <button
              onClick={handleRequestPermission}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Activer
            </button>
          )}
        </div>

        {permission === 'granted' && (
          <button
            onClick={handleTestNotification}
            className="mt-3 w-full py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            🔔 Tester une notification
          </button>
        )}
      </div>

      {/* Settings */}
      {permission === 'granted' && (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Préférences de Notification
          </h3>

          {/* Daily Reminder */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Rappels quotidiens</div>
              <div className="text-sm text-gray-500">Recevoir des rappels réguliers</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableDailyReminder}
                onChange={(e) => handleToggleDailyReminder(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Reminder Interval */}
          {enableDailyReminder && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Intervalle des rappels (minutes)
              </label>
              <input
                type="number"
                min="15"
                max="480"
                step="15"
                value={reminderInterval}
                onChange={(e) => {
                  setReminderInterval(parseInt(e.target.value))
                  savePreferences()
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          )}

          {/* Streak Warning */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Alerte série</div>
              <div className="text-sm text-gray-500">Avertir si votre série est en danger</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableStreakWarning}
                onChange={(e) => {
                  setEnableStreakWarning(e.target.checked)
                  savePreferences()
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Achievement Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">Notifications succès</div>
              <div className="text-sm text-gray-500">Recevoir une notification pour chaque succès</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableAchievements}
                onChange={(e) => {
                  setEnableAchievements(e.target.checked)
                  savePreferences()
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default NotificationSettings
