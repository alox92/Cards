import React from 'react'
import ReactDOM from 'react-dom/client'

// Composant ultra-simple en JavaScript pur
function App() {
  console.log('🚀 App component rendu')
  
  return React.createElement(
    'div',
    { 
      style: { 
        padding: '40px', 
        fontFamily: 'sans-serif',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        color: 'white'
      } 
    },
    React.createElement('h1', null, '🎯 CARDS - Version de Récupération'),
    React.createElement('p', null, '✅ React fonctionne en JavaScript pur !'),
    React.createElement('p', null, '✅ Main.jsx compilé avec succès !'),
    React.createElement('p', null, '✅ Pas d\'erreur TypeScript !'),
    React.createElement('div', { style: { marginTop: '20px' } },
      React.createElement('button', 
        { 
          onClick: () => {
            console.log('🧪 Bouton cliqué !')
            alert('🎉 React et JavaScript fonctionnent parfaitement !')
          },
          style: {
            padding: '15px 30px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }
        }, 
        '🧪 Test React JS'
      )
    ),
    React.createElement('div', { style: { marginTop: '30px', backgroundColor: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '10px' } },
      React.createElement('h3', null, '📊 Informations de Debug :'),
      React.createElement('p', null, 'URL: ' + window.location.href),
      React.createElement('p', null, 'Timestamp: ' + new Date().toISOString()),
      React.createElement('p', null, 'React Version: ' + React.version),
      React.createElement('p', null, 'User Agent: ' + navigator.userAgent.substring(0, 50) + '...')
    )
  )
}

console.log('🔧 Main.jsx chargé, création du root React...')

try {
  const root = ReactDOM.createRoot(document.getElementById('root'))
  console.log('✅ Root React créé avec succès')
  
  root.render(React.createElement(React.StrictMode, null, React.createElement(App)))
  console.log('✅ App rendue avec succès !')
} catch (error) {
  console.error('❌ Erreur lors du rendu React:', error)
  // Fallback en cas d'erreur
  document.getElementById('root').innerHTML = `
    <div style="padding: 20px; color: red; font-family: sans-serif;">
      <h1>❌ Erreur React</h1>
      <p>Erreur: ${error.message}</p>
      <p>Voir la console pour plus de détails</p>
    </div>
  `
}
