import { useState } from 'react'
import axios from 'axios'
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { Upload } from 'lucide-react'
import { useTheme } from '../ThemeContext'

const API = 'http://localhost:8000'

const RISK_COLORS = { LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#ef4444' }

export default function BatchPredict() {
  const { isDark } = useTheme()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = async (file) => {
    if (!file) return
    setLoading(true)
    setError(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const { data } = await axios.post(`${API}/batch-predict`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (data.error) {
        setError(`${data.error}: ${data.missing_columns?.join(', ')}`)
        setResult(null)
      } else {
        setResult(data)
      }
    } catch {
      setError('Could not reach the backend. Make sure the API is running at localhost:8000.')
    } finally {
      setLoading(false)
    }
  }

  // Colors derived from theme — passed explicitly so charts stay readable in both modes
  const axisColor   = isDark ? '#9ca3af' : '#6b7280'
  const gridColor   = isDark ? '#374151' : '#e5e7eb'
  const tooltipStyle = {
    backgroundColor: isDark ? '#1f2937' : '#ffffff',
    border: `1px solid ${gridColor}`,
    borderRadius: '8px',
    color: isDark ? '#f3f4f6' : '#111827',
    fontSize: '12px',
  }
  const cursorFill = isDark ? '#374151' : '#f3f4f6'

  const pieData = result
    ? [
        { name: 'Safe',  value: result.safe_count,  color: '#22c55e' },
        { name: 'Fraud', value: result.fraud_count, color: '#ef4444' },
      ]
    : []

  // Compute risk-level counts from the summary the backend returns
  const riskData = result
    ? (() => {
        const high   = result.high_risk_count
        const fraud  = result.fraud_count
        const medium = Math.max(0, fraud - high)
        const low    = result.total_transactions - fraud - Math.max(0, result.total_transactions - result.safe_count - fraud)
        return [
          { risk: 'LOW',    count: result.safe_count },
          { risk: 'MEDIUM', count: medium },
          { risk: 'HIGH',   count: high },
        ]
      })()
    : []

  return (
    <div className="space-y-6">
      {/* ── Drop zone ── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
          dragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
            : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900'
        }`}
      >
        <Upload className="w-8 h-8 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Drop a CSV file here, or click to browse
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          Required columns: Time, V1–V28, Amount
        </p>
        <label className="cursor-pointer">
          <span className="inline-block py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
            {loading ? 'Analyzing…' : 'Choose File'}
          </span>
          <input
            type="file"
            accept=".csv"
            className="hidden"
            disabled={loading}
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </label>
        {error && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>

      {result && (
        <>
          {/* ── Summary stat cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total',      value: result.total_transactions, color: 'text-gray-900 dark:text-white' },
              { label: 'Fraud',      value: result.fraud_count,        color: 'text-red-600 dark:text-red-400' },
              { label: 'Safe',       value: result.safe_count,         color: 'text-green-600 dark:text-green-400' },
              { label: 'Fraud Rate', value: `${result.fraud_rate}%`,   color: result.fraud_rate > 10 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400' },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center"
              >
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* ── Charts ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pie — fraud vs safe */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Fraud vs Safe Distribution
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={{ stroke: axisColor }}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ color: axisColor, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar — risk level breakdown */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                Risk Level Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={riskData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <XAxis
                    dataKey="risk"
                    tick={{ fill: axisColor, fontSize: 12 }}
                    axisLine={{ stroke: gridColor }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: axisColor, fontSize: 12 }}
                    axisLine={{ stroke: gridColor }}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: cursorFill }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {riskData.map((entry) => (
                      <Cell key={entry.risk} fill={RISK_COLORS[entry.risk]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Sample results table ── */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Sample Results <span className="font-normal text-gray-400">(first 10 rows)</span>
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    {['Amount', 'Prediction', 'Probability', 'Anomaly', 'Risk'].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-2.5 text-gray-500 dark:text-gray-400 font-medium"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.sample_results.map((row, i) => (
                    <tr
                      key={i}
                      className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">
                        ${Number(row.Amount).toFixed(2)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
                            row.fraud_prediction === 1
                              ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400'
                              : 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400'
                          }`}
                        >
                          {row.fraud_prediction === 1 ? 'Fraud' : 'Safe'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">
                        {(row.fraud_probability * 100).toFixed(1)}%
                      </td>
                      <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">
                        {row.anomaly_detected ? 'Yes' : 'No'}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${
                            row.risk_level === 'HIGH'
                              ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400'
                              : row.risk_level === 'MEDIUM'
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                              : 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400'
                          }`}
                        >
                          {row.risk_level}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
