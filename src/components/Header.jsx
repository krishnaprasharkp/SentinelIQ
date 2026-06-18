import { Shield, Sun, Moon } from 'lucide-react'
import { useTheme } from '../ThemeContext'

export default function Header() {
  const { isDark, setIsDark } = useTheme()

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              SentinelIQ
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
              Fraud Detection Platform
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsDark(!isDark)}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  )
}
