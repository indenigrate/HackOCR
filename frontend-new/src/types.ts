export interface FormData {
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

export interface OCRResponse {
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

export interface VerificationResult {
  field: keyof FormData
  status: 'match' | 'mismatch' | 'missing_in_document'
  confidence: number
}

export interface VerificationResponse {
  results: VerificationResult[]
}