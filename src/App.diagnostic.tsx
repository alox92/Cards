// React import supprimé (JSX runtime automatique)

// Version de diagnostic ultra-simple pour tester l'affichage
const App = () => {
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'sans-serif',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>
        🔧 Mode Diagnostic Cards
      </h1>
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2>✅ React fonctionne correctement</h2>
        <p>Si vous voyez ce message, React est initialisé avec succès.</p>
        
        <h3>🧪 Tests de base :</h3>
        <ul>
          <li>✅ Composant React rendu</li>
          <li>✅ Styles CSS appliqués</li>
          <li>✅ JavaScript exécuté</li>
        </ul>
        
        <h3>📊 Information navigateur :</h3>
        <p><strong>User Agent:</strong> {navigator.userAgent}</p>
        <p><strong>URL actuelle:</strong> {window.location.href}</p>
        <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
        
        <button 
          onClick={() => console.log('🎯 Test du clic fonctionnel')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          🧪 Test Console Log
        </button>
      </div>
    </div>
  )
}

export default App
