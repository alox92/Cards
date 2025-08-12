// Version JavaScript pure - sans TypeScript
function App() {
  return React.createElement(
    'div',
    { style: { padding: '20px', fontFamily: 'sans-serif' } },
    React.createElement('h1', null, '🎯 CARDS - JavaScript Pur'),
    React.createElement('p', null, 'Si vous voyez ce message, React fonctionne en JavaScript pur !'),
    React.createElement('div', { style: { marginTop: '20px' } },
      React.createElement('button', 
        { 
          onClick: () => alert('React JavaScript fonctionne !'),
          style: {
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }
        }, 
        '🧪 Test React JS'
      )
    ),
    React.createElement('div', { style: { marginTop: '15px', color: '#666' } },
      React.createElement('p', null, 'URL: ' + window.location.href),
      React.createElement('p', null, 'Timestamp: ' + new Date().toISOString())
    )
  )
}

export default App
