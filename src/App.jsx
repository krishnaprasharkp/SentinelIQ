import { useState } from 'react'
import { ThemeProvider } from './ThemeContext'
import Header from './components/Header'
import SinglePredict from './components/SinglePredict'
import BatchPredict from './components/BatchPredict'

function AppContent() {
  const [activeTab, setActiveTab] = useState('single')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-6 mb-8 border-b border-gray-200 dark:border-gray-800">
          {[
            { key: 'single', label: 'Single Transaction' },
            { key: 'batch', label: 'Batch Analysis' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {activeTab === 'single' ? <SinglePredict /> : <BatchPredict />}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}
