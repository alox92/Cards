import React from 'react'
import ReactDOM from 'react-dom/client'

console.log('🔧 main.jsx loaded - starting React...')
console.log('React version:', React.version)

// Version ultra-simple sans erreurs possibles
function App() {
  return React.createElement('div', {
    style: {
      padding: '40px',
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white',
      textAlign: 'center'
    }
  }, [
    React.createElement('h1', { key: 'title' }, '🎯 CARDS - BREAKTHROUGH!'),
    React.createElement('h2', { key: 'subtitle' }, '✅ React Successfully Mounted!'),
    React.createElement('p', { key: 'p1' }, 'Si vous voyez ce message, nous avons résolu le problème !'),
    React.createElement('div', {
      key: 'info',
      style: {
        marginTop: '30px',
        padding: '20px',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: '10px',
        display: 'inline-block'
      }
    }, [
      React.createElement('p', { key: 'time' }, 'Timestamp: ' + new Date().toISOString()),
      React.createElement('p', { key: 'url' }, 'URL: ' + window.location.href),
      React.createElement('p', { key: 'react' }, 'React Version: ' + React.version)
    ]),
    React.createElement('button', {
      key: 'button',
      style: {
        marginTop: '20px',
        padding: '15px 30px',
        fontSize: '18px',
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: 'bold'
      },
      onClick: () => {
        console.log('🎉 Button clicked - React is fully functional!')
        alert('🚀 React fonctionne parfaitement ! Le problème est résolu !')
      }
    }, '🎉 Test React Success!')
  ])
}

console.log('🚀 Creating React root...')

try {
  const rootElement = document.getElementById('root')
  console.log('Root element found:', rootElement)
  
  const root = ReactDOM.createRoot(rootElement)
  console.log('✅ React root created successfully')
  
  root.render(React.createElement(React.StrictMode, null, React.createElement(App)))
  console.log('✅ App rendered successfully!')
  
  // Nettoyer le spinner de chargement
  setTimeout(() => {
    const spinner = document.querySelector('.loading-spinner')
    if (spinner) {
      spinner.remove()
      console.log('🧹 Loading spinner removed')
    }
  }, 100)
  
} catch (error) {
  console.error('❌ React mounting failed:', error)
  document.getElementById('root').innerHTML = `
    <div style="padding: 20px; color: red; font-family: monospace;">
      <h1>❌ React Mount Error</h1>
      <p>Error: ${error.message}</p>
      <pre>${error.stack}</pre>
    </div>
  `
}
