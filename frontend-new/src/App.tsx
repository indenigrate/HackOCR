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

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value === null ? '' : value
    }))
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setVerificationResults([]) // Reset verification when new file is selected
    }
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

      const response = await fetch('http://127.0.0.1:8000/api/v1/extract-llm', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to process the document')
      }

      const data: OCRResponse = await response.json()
      console.log('API Response:', data)
      
      // Clean up email and sanitize all form data
      const cleanData = {
        ...data,
        email_id: data.email_id ? data.email_id.replace(/\s+/g, '') : null
      }
      const processedData = sanitizeFormData(cleanData)
      
      console.log('Processed Data:', processedData)
      setFormData(processedData)
    } catch (error) {
      console.error('Error during OCR:', error)
      alert('Error processing the document. Please try again.')
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

      const response = await fetch('http://127.0.0.1:8000/api/v1/verify', {
        method: 'POST',
        body: verifyFormData,
      })

      if (!response.ok) {
        throw new Error('Failed to verify the document')
      }

      const data: VerificationResponse = await response.json()
      setVerificationResults(data.results)
    } catch (error) {
      console.error('Error during verification:', error)
      alert('Error verifying the document. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
  }

  const handleReset = () => {
    setFormData(initialFormData)
    setFile(null)
    setVerificationResults([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4">
      <div className="max-w-3xl mx-auto bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-700">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">Document OCR</h1>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* File Upload Section */}
          <div className="p-6 border-2 border-dashed rounded-lg border-gray-600 bg-gray-900/50 hover:bg-gray-900/70 transition-colors">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="flex-1 cursor-pointer text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-500/10 file:text-cyan-500 hover:file:bg-cyan-500/20"
              />
              <div className="flex gap-2 w-full sm:w-auto">
                <motion.button
                  type="button"
                  onClick={handleAutofill}
                  disabled={loading || !file}
                  className={`w-full sm:w-auto px-6 py-2.5 rounded-full font-medium ${
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
                    'Autofill Form'
                  )}
                </motion.button>

                <motion.button
                  type="button"
                  onClick={handleVerify}
                  disabled={verifying || !file}
                  className={`w-full sm:w-auto px-6 py-2.5 rounded-full font-medium ${
                    verifying || !file
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                      : 'bg-purple-500 hover:bg-purple-600 text-white shadow-lg shadow-purple-500/30'
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

            {(loading || verifying) && (
              <div className="mt-4">
                <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden">
                  <motion.div 
                    className={`h-full ${loading ? 'bg-cyan-500' : 'bg-purple-500'}`}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
              </div>
            )}

            {verificationResults.length > 0 && (
              <div className="mt-4 p-4 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700/50">
                <div className="text-sm text-gray-300 font-medium mb-3">Verification Legend</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-800">
                      <span className="text-green-500">✓</span>
                    </div>
                    <span className="text-gray-300 text-sm">Match (80-100%)</span>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-800">
                      <span className="text-yellow-500">⚠</span>
                    </div>
                    <span className="text-gray-300 text-sm">Partial (60-79%)</span>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-800">
                      <span className="text-red-500">×</span>
                    </div>
                    <span className="text-gray-300 text-sm">No Match (0-59%)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-300 mb-1">First Name</label>
                <VerificationIndicator 
                  fieldName="first_name" 
                  verificationResults={verificationResults}
                />
              </div>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all"
              />
            </div>

            {/* Middle Name */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-300 mb-1">Middle Name</label>
                <VerificationIndicator 
                  fieldName="middle_name" 
                  verificationResults={verificationResults}
                />
              </div>
              <input
                type="text"
                name="middle_name"
                value={formData.middle_name}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all"
              />
            </div>

            {/* Last Name */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-300 mb-1">Last Name</label>
                <VerificationIndicator 
                  fieldName="last_name" 
                  verificationResults={verificationResults}
                />
              </div>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all"
              />
            </div>

            {/* Gender */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-300 mb-1">Gender</label>
                <VerificationIndicator 
                  fieldName="gender" 
                  verificationResults={verificationResults}
                />
              </div>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Date of Birth */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-300 mb-1">Date of Birth</label>
                <VerificationIndicator 
                  fieldName="date_of_birth" 
                  verificationResults={verificationResults}
                />
              </div>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all"
              />
            </div>

            {/* Address Line 1 */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-300 mb-1">Address Line 1</label>
                <VerificationIndicator 
                  fieldName="address_line_1" 
                  verificationResults={verificationResults}
                />
              </div>
              <input
                type="text"
                name="address_line_1"
                value={formData.address_line_1}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all"
              />
            </div>

            {/* Address Line 2 */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-300 mb-1">Address Line 2</label>
                <VerificationIndicator 
                  fieldName="address_line_2" 
                  verificationResults={verificationResults}
                />
              </div>
              <input
                type="text"
                name="address_line_2"
                value={formData.address_line_2}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all"
              />
            </div>

            {/* City */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-300 mb-1">City</label>
                <VerificationIndicator 
                  fieldName="city" 
                  verificationResults={verificationResults}
                />
              </div>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all"
              />
            </div>

            {/* State */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-300 mb-1">State</label>
                <VerificationIndicator 
                  fieldName="state" 
                  verificationResults={verificationResults}
                />
              </div>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all"
              />
            </div>

            {/* PIN Code */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-300 mb-1">PIN Code</label>
                <VerificationIndicator 
                  fieldName="pin_code" 
                  verificationResults={verificationResults}
                />
              </div>
              <input
                type="text"
                name="pin_code"
                value={formData.pin_code}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all"
                pattern="[0-9]{6}"
              />
            </div>

            {/* Phone Number */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
                <VerificationIndicator 
                  fieldName="phone_number" 
                  verificationResults={verificationResults}
                />
              </div>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all"
                pattern="[0-9+\-\s]{10,}"
              />
            </div>

            {/* Email */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <VerificationIndicator 
                  fieldName="email_id" 
                  verificationResults={verificationResults}
                />
              </div>
              <input
                type="email"
                name="email_id"
                value={formData.email_id}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-8">
            <motion.button
              type="button"
              onClick={handleReset}
              className="px-6 py-2.5 rounded-full font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-all"
              whileTap={{ scale: 0.95 }}
            >
              Reset
            </motion.button>
            <motion.button
              type="submit"
              className="px-6 py-2.5 rounded-full font-medium bg-cyan-500 text-white hover:bg-cyan-600 shadow-lg shadow-cyan-500/30 transition-all"
              whileTap={{ scale: 0.95 }}
            >
              Submit
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default App