import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { motion } from 'framer-motion'

interface FormData {
  first_name: string
  last_name: string
  middle_name: string
  gender: string
  date_of_birth: string
  address_line_1: string
  address_line_2: string
  city: string
  state: string
  pin_code: string
  phone_number: string
  email_id: string
}

interface OCRResponse {
  first_name: string | null
  last_name: string | null
  middle_name: string | null
  gender: string | null
  date_of_birth: string | null
  address_line_1: string | null
  address_line_2: string | null
  city: string | null
  state: string | null
  pin_code: string | null
  phone_number: string | null
  email_id: string | null
  raw_text: string
}

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

function App() {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value || ''  // Convert null to empty string
    }))
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
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
      // Convert null values to empty strings and clean up email format
      const processedData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => {
          if (key === 'email_id' && value) {
            // Remove any spaces from email to handle OCR spacing issues
            return [key, value.replace(/\\s+/g, '')]
          }
          return [key, value === null ? '' : value]
        })
      ) as FormData
      setFormData(processedData)
    } catch (error) {
      console.error('Error during OCR:', error)
      alert('Error processing the document. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
  }

  const handleReset = () => {
    setFormData(initialFormData)
    setFile(null)
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
            </div>
            {loading && (
              <div className="mt-4">
                <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-cyan-500"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="form-label">Middle Name</label>
              <input
                type="text"
                name="middle_name"
                value={formData.middle_name || ''}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name || ''}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Gender</label>
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

            <div>
              <label className="form-label">Date of Birth</label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth || ''}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="form-label">Address Line 1</label>
              <input
                type="text"
                name="address_line_1"
                value={formData.address_line_1 || ''}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Address Line 2</label>
              <input
                type="text"
                name="address_line_2"
                value={formData.address_line_2 || ''}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">City</label>
              <input
                type="text"
                name="city"
                value={formData.city || ''}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">State</label>
              <input
                type="text"
                name="state"
                value={formData.state || ''}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">PIN Code</label>
              <input
                type="text"
                name="pin_code"
                value={formData.pin_code || ''}
                onChange={handleInputChange}
                className="form-input"
                pattern="[0-9]{6}"
              />
            </div>

            <div>
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number || ''}
                onChange={handleInputChange}
                className="form-input"
                pattern="[0-9+\-\s]{10,}"
              />
            </div>

            <div className="col-span-full">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email_id"
                value={formData.email_id || ''}
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
