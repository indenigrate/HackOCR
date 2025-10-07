import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { motion } from 'framer-motion'
import { VerificationIndicator } from './components/VerificationIndicator'
import type { FormData, OCRResponse, VerificationResponse } from './types'

const initialFormData: FormData = {
  first_name: '',
  last_name: '',
  middle_name: '',
  gender: '',
  date_of_birth: '',
  address_line_1: '',
  address_line_2: '',
  city: '',
  state: '',
  pin_code: '',
  phone_number: '',
  email_id: ''
}

// Helper function to ensure values are never null
const sanitizeFormData = (data: { [K in keyof FormData]: string | null }): FormData => {
  return {
    first_name: data.first_name || '',
    last_name: data.last_name || '',
    middle_name: data.middle_name || '',
    gender: data.gender || '',
    date_of_birth: data.date_of_birth || '',
    address_line_1: data.address_line_1 || '',
    address_line_2: data.address_line_2 || '',
    city: data.city || '',
    state: data.state || '',
    pin_code: data.pin_code || '',
    phone_number: data.phone_number || '',
    email_id: data.email_id || ''
  }
}

function App() {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verificationResults, setVerificationResults] = useState<VerificationResponse['results']>([])
  const [annotatedImage, setAnnotatedImage] = useState<string | null>(null)

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setAnnotatedImage(null)
    }
  }

  const normalizeDate = (dateStr: string | null): string => {
    if (!dateStr) return ''
    
    // Try to parse various date formats
    const patterns = [
      // DD-MM-YYYY
      /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/,
      // YYYY-MM-DD
      /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/
    ]
    
    for (const pattern of patterns) {
      const match = dateStr.match(pattern)
      if (match) {
        const [_, part1, part2, part3] = match
        // If the first part is a 4-digit year, it's already in YYYY-MM-DD format
        if (part1.length === 4) {
          return `${part1}-${part2.padStart(2, '0')}-${part3.padStart(2, '0')}`
        }
        // Otherwise, convert from DD-MM-YYYY to YYYY-MM-DD
        return `${part3}-${part2.padStart(2, '0')}-${part1.padStart(2, '0')}`
      }
    }
    return dateStr
  }

  const handleAutofill = async () => {
    if (!file) {
      alert('Please upload a file first')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('http://localhost:8000/api/v1/extract-llm', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to process document')
      }

      const data: OCRResponse = await response.json()
      // Normalize the date before setting form data
      const normalizedData = {
        ...data,
        date_of_birth: normalizeDate(data.date_of_birth)
      }
      setFormData(sanitizeFormData(normalizedData))
      if (data.annotated_image) {
        setAnnotatedImage(data.annotated_image)
      }
    } catch (error) {
      console.error('Error during OCR:', error)
      alert('Error processing document. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!file) {
      alert('Please upload a file first')
      return
    }

    setVerifying(true)
    try {
      const verifyFormData = new FormData()
      verifyFormData.append('file', file)
      verifyFormData.append('form_data', JSON.stringify(formData))

      const response = await fetch('http://localhost:8000/api/v1/verify', {
        method: 'POST',
        body: verifyFormData,
      })

      if (!response.ok) {
        throw new Error('Failed to verify document')
      }

      const data: VerificationResponse = await response.json()
      setVerificationResults(data.results)
    } catch (error) {
      console.error('Error during verification:', error)
      alert('Error verifying document. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  const handleReset = () => {
    setFormData(initialFormData)
    setFile(null)
    setVerificationResults([])
    setAnnotatedImage(null)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
  }

  return (
    <div className="min-h-screen bg-gray-800 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto rounded-2xl bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 p-6">
        <h1 className="text-2xl font-bold text-gray-100 mb-6">HackOCR</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Preview and Upload */}
          <div className="space-y-6">
            <div className="image-preview rounded-xl border border-gray-700/50 overflow-hidden min-h-[600px] bg-gray-900/30">
              {annotatedImage ? (
                <div className="relative w-full h-full flex items-center justify-center p-4">
                  <img
                    src={`data:image/png;base64,${annotatedImage}`}
                    alt="OCR Results"
                    className="max-w-full max-h-[580px] object-contain rounded-xl"
                  />
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/10 via-transparent to-transparent rounded-xl" />
                </div>
              ) : (
                <div className="text-center py-12 flex flex-col items-center justify-center h-full">
                  <svg className="w-16 h-16 mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500">Upload a document to see the preview</p>
                </div>
              )}
            </div>

            <div className="p-4 border border-gray-700/50 rounded-xl bg-gray-800/50">
              <div className="flex flex-col gap-4">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="flex-1 cursor-pointer text-gray-300 file:mr-4 file:py-2 file:px-4 
                           file:rounded-full file:border-0 file:text-sm file:font-semibold 
                           file:bg-cyan-500/10 file:text-cyan-500 hover:file:bg-cyan-500/20"
                />
                <div className="flex gap-2">
                  <motion.button
                    type="button"
                    onClick={handleAutofill}
                    disabled={loading || !file}
                    className={`flex-1 px-4 py-2 rounded-full font-medium ${
                      loading || !file 
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                        : 'bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                    } transition-all`}
                    whileTap={{ scale: 0.95 }}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <motion.div 
                          className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      'Extract Data'
                    )}
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={handleVerify}
                    disabled={verifying || !file}
                    className={`flex-1 px-4 py-2 rounded-full font-medium ${
                      verifying || !file
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                    } transition-all`}
                    whileTap={{ scale: 0.95 }}
                  >
                    {verifying ? (
                      <div className="flex items-center justify-center gap-2">
                        <motion.div 
                          className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <span>Verifying...</span>
                      </div>
                    ) : (
                      'Verify Data'
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.keys(formData).map((key) => (
                  <div key={key} className={key === 'email_id' || key.startsWith('address') ? 'md:col-span-2' : ''}>
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </label>
                      <VerificationIndicator 
                        fieldName={key as keyof FormData} 
                        verificationResults={verificationResults}
                      />
                    </div>
                    {key === 'gender' ? (
                      <select
                        name={key}
                        value={formData[key as keyof FormData]}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg 
                                 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 
                                 focus:border-transparent transition-all"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <input
                        type={key === 'date_of_birth' ? 'date' : 
                             key === 'email_id' ? 'email' : 
                             key === 'phone_number' ? 'tel' : 
                             key === 'pin_code' ? 'number' : 'text'}
                        name={key}
                        value={formData[key as keyof FormData]}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg 
                                 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 
                                 focus:ring-cyan-500/50 focus:border-transparent transition-all"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <motion.button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-2.5 border border-gray-700 rounded-full text-gray-300 
                           hover:bg-gray-800 transition-all"
                  whileTap={{ scale: 0.95 }}
                >
                  Reset
                </motion.button>
                <motion.button
                  type="submit"
                  className="px-6 py-2.5 bg-cyan-500 text-white rounded-full hover:bg-cyan-600 
                           shadow-lg shadow-cyan-500/30 transition-all"
                  whileTap={{ scale: 0.95 }}
                >
                  Submit
                </motion.button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App