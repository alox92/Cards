import React from 'react'

// Version ultra-minimaliste pour diagnostic
const App: React.FC = () => {
  return (
    <div style={{
      padding: '20px',
      fontFamily: 'sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      minHeight: '100vh',
      margin: 0
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        background: 'rgba(255,255,255,0.1)',
        padding: '30px',
        borderRadius: '15px',
        backdropFilter: 'blur(10px)'
      }}>
        <h1>🎯 Cards React - Test Minimal</h1>
        <p>Si vous voyez ce message, React fonctionne parfaitement !</p>
        
        <h3>🧪 Tests de Base :</h3>
        <ul>
          <li>✅ React 18 rendu</li>
          <li>✅ TypeScript compilé</li>
          <li>✅ Styles CSS inline</li>
          <li>✅ Composant fonctionnel</li>
        </ul>
        
        <h3>📊 Informations :</h3>
        <p><strong>URL :</strong> {window.location.href}</p>
        <p><strong>Timestamp :</strong> {new Date().toISOString()}</p>
        
        <button 
          onClick={() => {
            alert('🎉 React Events fonctionnent !')
            console.log('🧪 Event handler React opérationnel')
          }}
          style={{
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            margin: '10px 5px'
          }}
        >
          Test React Click
        </button>
        
        <button 
          onClick={() => {
            console.log('🚀 React + Console.log fonctionnel')
            console.info('ℹ️ Tous les systèmes React opérationnels')
          }}
          style={{
            background: '#2196F3',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            margin: '10px 5px'
          }}
        >
          Test Console
        </button>
      </div>
    </div>
  )
}

export default App
