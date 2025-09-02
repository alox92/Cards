import React, { useEffect, useState } from 'react'

const OfflineBanner: React.FC = () => {
  const [offline, setOffline] = useState<boolean>(typeof navigator !== 'undefined' ? !navigator.onLine : false)

  useEffect(() => {
    const onOff = () => setOffline(true)
    const onOn = () => setOffline(false)
    window.addEventListener('offline', onOff)
    window.addEventListener('online', onOn)
    return () => { window.removeEventListener('offline', onOff); window.removeEventListener('online', onOn) }
  }, [])

  if(!offline) return null

  return (
    <div className="fixed top-0 inset-x-0 z-[1100] flex items-center justify-center bg-amber-500 text-white text-sm py-1 shadow">
      <span>Mode hors‑ligne – vos progrès sont sauvegardés localement.</span>
    </div>
  )
}

export default OfflineBanner
