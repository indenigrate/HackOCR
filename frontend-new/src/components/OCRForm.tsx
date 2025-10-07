import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { motion } from 'framer-motion';

interface FormData {
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  gender: string | null;
  date_of_birth: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  pin_code: string | null;
  phone_number: string | null;
  email_id: string | null;
}

interface OCRResponse extends FormData {
  raw_text: string;
}

const initialFormData: FormData = {
  first_name: null,
  last_name: null,
  middle_name: null,
  gender: null,
  date_of_birth: null,
  address_line_1: null,
  address_line_2: null,
  city: null,
  state: null,
  pin_code: null,
  phone_number: null,
  email_id: null
};

function OCRForm() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAutofill = async () => {
    if (!file) {
      alert('Please upload a file first');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8000/api/v1/extract-llm', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process document');
      }

      const data: OCRResponse = await response.json();
      setFormData(data);
    } catch (error) {
      console.error('Error during OCR:', error);
      alert('Error processing document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setFile(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log('Form data:', formData);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Document OCR</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div className="p-4 border-2 border-dashed rounded-lg border-gray-300 bg-gray-50">
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="flex-1"
              />
              <motion.button
                type="button"
                onClick={handleAutofill}
                disabled={loading || !file}
                className="px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                initial={false}
                animate={{
                  backgroundColor: loading || !file ? '#9CA3AF' : '#2563EB',
                  color: 'white'
                }}
                whileTap={{ scale: 0.95 }}
              >
                {loading ? (
                  <motion.span
                    className="inline-block"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    ↻
                  </motion.span>
                ) : (
                  'Autofill'
                )}
              </motion.button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div>
              <label className="form-label">First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name || ''}
                onChange={handleInputChange}
                className="form-input"
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
              <label className="form-label">Gender</label>
              <select
                name="gender"
                value={formData.gender || ''}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
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

            {/* Contact Information */}
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

            <div className="md:col-span-2">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email_id"
                value={formData.email_id || ''}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            {/* Address Information */}
            <div className="md:col-span-2">
              <label className="form-label">Address Line 1</label>
              <input
                type="text"
                name="address_line_1"
                value={formData.address_line_1 || ''}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            <div className="md:col-span-2">
              <label className="form-label">Address Line 2</label>
              <input
                type="text"
                name="address_line_2"
                value={formData.address_line_2 || ''}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

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
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-4">
            <motion.button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              whileTap={{ scale: 0.95 }}
            >
              Reset
            </motion.button>
            <motion.button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              whileTap={{ scale: 0.95 }}
            >
              Submit
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default OCRForm;