import { useState } from 'react'
import axios from 'axios'
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react'
import { useTheme } from '../ThemeContext'

const API = 'http://localhost:8000'

// Realistic V1–V28 feature sets (PCA components from the credit card dataset)
const SCENARIOS = {
  normal: {
    label: 'Normal',
    Time: 12000, Amount: 85.50,
    V1: 1.19, V2: 0.26, V3: 0.17, V4: 0.45, V5: -0.03, V6: -0.11, V7: 0.08,
    V8: 0.08, V9: -0.26, V10: -0.17, V11: 1.61, V12: 0.06, V13: 0.49, V14: -0.14,
    V15: 0.64, V16: 0.46, V17: -0.11, V18: -0.18, V19: -0.14, V20: -0.06,
    V21: -0.06, V22: -0.23, V23: 0.01, V24: 0.27, V25: -0.14, V26: -0.06,
    V27: 0.01, V28: 0.01,
  },
  suspicious: {
    label: 'Suspicious',
    Time: 75000, Amount: 999.99,
    V1: -2.31, V2: 1.95, V3: -1.61, V4: 3.41, V5: -0.96, V6: -1.16, V7: 0.19,
    V8: 0.27, V9: -0.18, V10: -0.69, V11: -0.23, V12: -0.18, V13: -0.24, V14: -3.0,
    V15: 0.27, V16: -0.10, V17: -0.61, V18: -0.18, V19: -0.18, V20: 0.08,
    V21: 0.13, V22: -0.14, V23: 0.04, V24: 0.39, V25: 0.15, V26: 0.08,
    V27: 0.06, V28: 0.05,
  },
  highRisk: {
    label: 'High Risk',
    Time: 150000, Amount: 2999.00,
    V1: -4.77, V2: 3.23, V3: -6.56, V4: 6.27, V5: -1.67, V6: -2.36, V7: -2.63,
    V8: -0.10, V9: 0.38, V10: -4.76, V11: 1.51, V12: -7.56, V13: 0.38, V14: -11.1,
    V15: 1.78, V16: -3.09, V17: -4.17, V18: -0.96, V19: 0.56, V20: 0.48,
    V21: 0.74, V22: -0.24, V23: 0.05, V24: -0.26, V25: 0.16, V26: -0.19,
    V27: 0.60, V28: 0.22,
  },
}

const RISK_STYLES = {
  HIGH:   { bg: 'bg-red-50 dark:bg-red-950',   text: 'text-red-700 dark:text-red-400',   border: 'border-red-200 dark:border-red-800',   fill: '#ef4444' },
  MEDIUM: { bg: 'bg-amber-50 dark:bg-amber-950', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800', fill: '#f59e0b' },
  LOW:    { bg: 'bg-green-50 dark:bg-green-950', text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-800', fill: '#22c55e' },
}

// SVG semicircle gauge — avoids Recharts dark-mode quirks
function FraudGauge({ probability, fill, isDark }) {
  const pct = Math.round(probability * 100)
  const r = 70
  const arcLen = Math.PI * r
  const filled = (pct / 100) * arcLen
  const trackColor = isDark ? '#1f2937' : '#e5e7eb'

  return (
    <div className="text-center">
      <svg viewBox="0 0 180 90" className="w-full max-w-[200px] mx-auto">
        {/* Background track */}
        <path
          d={`M 20 85 A ${r} ${r} 0 0 0 160 85`}
          fill="none"
          stroke={trackColor}
          strokeWidth="13"
          strokeLinecap="round"
        />
        {/* Filled arc */}
        <path
          d={`M 20 85 A ${r} ${r} 0 0 0 160 85`}
          fill="none"
          stroke={fill}
          strokeWidth="13"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${arcLen}`}
        />
      </svg>
      <p className="text-3xl font-bold -mt-3" style={{ color: fill }}>
        {pct}%
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Fraud Probability</p>
    </div>
  )
}

export default function SinglePredict() {
  const { isDark } = useTheme()
  const [scenario, setScenario] = useState('normal')
  const [time, setTime] = useState(SCENARIOS.normal.Time)
  const [amount, setAmount] = useState(SCENARIOS.normal.Amount)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleScenario = (key) => {
    setScenario(key)
    setTime(SCENARIOS[key].Time)
    setAmount(SCENARIOS[key].Amount)
    setResult(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const payload = { ...SCENARIOS[scenario], Time: Number(time), Amount: Number(amount) }
      const { data } = await axios.post(`${API}/predict`, payload)
      setResult(data)
    } catch {
      setError('Could not reach the backend. Make sure the API is running at localhost:8000.')
    } finally {
      setLoading(false)
    }
  }

  const rs = result ? RISK_STYLES[result.risk_level] : null

  const RiskIcon = result?.risk_level === 'HIGH'
    ? AlertTriangle
    : result?.risk_level === 'MEDIUM'
    ? AlertCircle
    : CheckCircle

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ── Form ── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-5">
          Transaction Details
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Scenario presets */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Scenario Preset
            </p>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(SCENARIOS).map(([key, s]) => {
                const active = scenario === key
                const activeColor =
                  key === 'highRisk'
                    ? 'bg-red-600 border-red-600 text-white'
                    : key === 'suspicious'
                    ? 'bg-amber-500 border-amber-500 text-white'
                    : 'bg-blue-600 border-blue-600 text-white'
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleScenario(key)}
                    className={`py-2 px-2 rounded-lg text-xs font-medium border transition-colors ${
                      active
                        ? activeColor
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {s.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Time <span className="font-normal text-gray-400">(seconds from first transaction)</span>
            </label>
            <input
              type="number"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
            />
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500">
            V1–V28 PCA features are set automatically by the selected preset.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
          >
            {loading ? 'Analyzing…' : 'Analyze Transaction'}
          </button>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </form>
      </div>

      {/* ── Result ── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-5">
          Analysis Result
        </h2>

        {!result ? (
          <div className="flex items-center justify-center min-h-56 text-sm text-gray-400 dark:text-gray-500">
            Submit a transaction to see the result
          </div>
        ) : (
          <div className="space-y-5">
            {/* Risk badge */}
            <div className={`flex items-center gap-3 p-4 rounded-lg border ${rs.bg} ${rs.border}`}>
              <RiskIcon className={`w-5 h-5 shrink-0 ${rs.text}`} />
              <div>
                <p className={`font-semibold ${rs.text}`}>{result.risk_level} RISK</p>
                <p className={`text-xs mt-0.5 ${rs.text} opacity-80`}>
                  {result.fraud_prediction === 1 ? 'Classified as fraud' : 'Classified as legitimate'}
                  {result.anomaly_detected ? ' · Anomaly detected' : ''}
                </p>
              </div>
            </div>

            {/* SVG Gauge */}
            <FraudGauge
              probability={result.fraud_probability}
              fill={rs.fill}
              isDark={isDark}
            />

            {/* Stat chips */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Prediction', value: result.fraud_prediction === 1 ? 'Fraud' : 'Safe' },
                { label: 'Probability', value: `${(result.fraud_probability * 100).toFixed(1)}%` },
                { label: 'Anomaly', value: result.anomaly_detected ? 'Yes' : 'No' },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center"
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
