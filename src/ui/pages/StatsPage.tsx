const StatsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Statistiques et Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Suivez vos progrès et analysez vos performances d'apprentissage
          </p>
        </div>

        <div className="card">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Analytics en construction
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Les graphiques et métriques détaillées seront bientôt disponibles
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StatsPage
