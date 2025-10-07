import type { FormData, VerificationResult } from '../types'

interface VerificationIndicatorProps {
  fieldName: keyof FormData
  verificationResults: VerificationResult[]
}

export const VerificationIndicator = ({ fieldName, verificationResults }: VerificationIndicatorProps) => {
  const result = verificationResults.find(r => r.field === fieldName)
  if (!result) return null

  const getColor = (confidence: number) => {
    if (confidence >= 0.8) return '#22c55e'  // green-500
    if (confidence >= 0.6) return '#eab308'  // yellow-500
    return '#ef4444'  // red-500
  }

  const getIcon = (status: VerificationResult['status']) => {
    switch (status) {
      case 'match': return '✓'
      case 'mismatch': return '⚠'
      case 'missing_in_document': return '×'
      default: return ''
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-800">
          <span style={{ color: getColor(result.confidence) }} className="text-sm">
            {getIcon(result.status)}
          </span>
        </div>
        <div className="w-20 h-1.5 rounded-full bg-gray-800 overflow-hidden">
          <div 
            className="h-full transition-all duration-500"
            style={{ 
              width: `${result.confidence * 100}%`,
              backgroundColor: `${getColor(result.confidence)}80` // Add 50% opacity
            }}
          />
        </div>
      </div>
      <span className="text-xs font-medium" style={{ color: getColor(result.confidence) }}>
        {Math.round(result.confidence * 100)}%
      </span>
    </div>
  )
}