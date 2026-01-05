import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { 
  Shield, Camera, Upload, CheckCircle, XCircle, Clock, 
  AlertCircle, ChevronRight, FileText, CreditCard, User as UserIcon
} from 'lucide-react'
import { verificationService } from '@/services/api/verificationService'

// Country list with their required documents
const COUNTRIES = [
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'OTHER', name: 'Other Country', flag: '🌍' },
]

// Document types for Nigeria
const NIGERIA_DOCUMENTS = [
  { id: 'passport', name: 'International Passport', icon: FileText, required: false },
  { id: 'drivers_license', name: "Driver's License", icon: CreditCard, required: false },
  { id: 'voters_card', name: "Voter's Card", icon: UserIcon, required: false },
  { id: 'nin', name: 'NIN (National ID)', icon: Shield, required: false },
]

// Document types for international
const INTERNATIONAL_DOCUMENTS = [
  { id: 'passport', name: 'Passport', icon: FileText, sides: ['front'] },
  { id: 'drivers_license', name: "Driver's License", icon: CreditCard, sides: ['front', 'back'] },
]

type DocumentUpload = {
  type: string
  side?: string
  file: File | null
  preview: string | null
}

export default function VerificationPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [step, setStep] = useState<'country' | 'documents' | 'review' | 'submitted'>('country')
  const [selectedCountry, setSelectedCountry] = useState<string>('')
  const [selectedDocType, setSelectedDocType] = useState<string>('') // For international
  const [uploads, setUploads] = useState<DocumentUpload[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check if user is already verified
  if (user?.kyc_status === 'verified') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Account Verified!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your account has been successfully verified. You have full access to all features.
          </p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Check if pending
  if (user?.kyc_status === 'pending') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 mb-4">
            <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Verification Pending
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your documents are being reviewed. This usually takes 1-3 business days.
            We'll notify you once the review is complete.
          </p>
          <button onClick={() => navigate('/dashboard')} className="btn-secondary">
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const handleCountrySelect = (countryCode: string) => {
    setSelectedCountry(countryCode)
    setStep('documents')
  }

  const handleFileUpload = (docType: string, side: string | undefined, file: File) => {
    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      const newUpload: DocumentUpload = {
        type: docType,
        side,
        file,
        preview: reader.result as string,
      }

      setUploads(prev => {
        // Remove existing upload for this doc type and side
        const filtered = prev.filter(u => !(u.type === docType && u.side === side))
        return [...filtered, newUpload]
      })
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveUpload = (docType: string, side?: string) => {
    setUploads(prev => prev.filter(u => !(u.type === docType && u.side === side)))
  }

  const handleSubmit = async () => {
    if (uploads.length === 0) {
      toast.error('Please upload at least one document')
      return
    }

    setIsSubmitting(true)
    try {
      // Convert uploads to API format
      const documents = uploads.map(upload => ({
        document_type: upload.type,
        document_side: upload.side,
        file_data: upload.preview?.split(',')[1] || '', // Remove data:image/png;base64, prefix
      }))

      // Submit to backend
      await verificationService.submitDocuments({
        country_code: selectedCountry,
        documents,
      })
      
      toast.success('Verification documents submitted successfully!')
      setStep('submitted')
    } catch (error: any) {
      console.error('Verification submission error:', error)
      toast.error(error?.response?.data?.detail || 'Failed to submit documents. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getUploadForDoc = (docType: string, side?: string) => {
    return uploads.find(u => u.type === docType && u.side === side)
  }

  const isNigeria = selectedCountry === 'NG'

  // Step 1: Country Selection
  if (step === 'country') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Account Verification
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Complete your verification to unlock all features and increase your transaction limits
          </p>
        </div>

        <div className="card p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-bold">
              1
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Select Your Country
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {COUNTRIES.map(country => (
              <button
                key={country.code}
                onClick={() => handleCountrySelect(country.code)}
                className="flex items-center gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all group"
              >
                <span className="text-3xl">{country.flag}</span>
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                    {country.name}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400" />
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Step 2: Document Upload
  if (step === 'documents') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => {
              setStep('country')
              setSelectedCountry('')
              setUploads([])
            }}
            className="text-primary-600 dark:text-primary-400 hover:underline mb-4 inline-flex items-center gap-2"
          >
            ← Change Country
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Upload Your Documents
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isNigeria 
              ? 'Upload at least one of the following Nigerian documents'
              : 'Upload either your passport or both sides of your driver\'s license'
            }
          </p>
        </div>

        <div className="card p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-bold">
              2
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Document Upload
            </h2>
          </div>

          {/* Nigeria Documents */}
          {isNigeria && (
            <div className="space-y-4">
              {NIGERIA_DOCUMENTS.map(doc => {
                const Icon = doc.icon
                const upload = getUploadForDoc(doc.id)
                
                return (
                  <div key={doc.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">{doc.name}</h3>
                    </div>

                    {!upload ? (
                      <label className="block">
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-primary-500 dark:hover:border-primary-400 cursor-pointer transition-colors">
                          <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            PNG, JPG or PDF (max 5MB)
                          </p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileUpload(doc.id, undefined, file)
                          }}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <div className="relative">
                        <img
                          src={upload.preview!}
                          alt={doc.name}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => handleRemoveUpload(doc.id)}
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                        <div className="absolute bottom-2 left-2 px-3 py-1 bg-green-500 text-white text-sm rounded-full flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Uploaded
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* International Documents */}
          {!isNigeria && (
            <div className="space-y-6">
              {INTERNATIONAL_DOCUMENTS.map(doc => {
                const Icon = doc.icon
                
                return (
                  <div key={doc.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">{doc.name}</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {doc.sides.map(side => {
                        const upload = getUploadForDoc(doc.id, side)
                        
                        return (
                          <div key={side}>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
                              {side} {doc.sides.length > 1 ? 'Side' : ''}
                            </p>
                            
                            {!upload ? (
                              <label className="block">
                                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-primary-500 dark:hover:border-primary-400 cursor-pointer transition-colors">
                                  <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                    Click to upload
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-500">
                                    PNG, JPG (max 5MB)
                                  </p>
                                </div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) handleFileUpload(doc.id, side, file)
                                  }}
                                  className="hidden"
                                />
                              </label>
                            ) : (
                              <div className="relative">
                                <img
                                  src={upload.preview!}
                                  alt={`${doc.name} ${side}`}
                                  className="w-full h-48 object-cover rounded-lg"
                                />
                                <button
                                  onClick={() => handleRemoveUpload(doc.id, side)}
                                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                                >
                                  <XCircle className="w-5 h-5" />
                                </button>
                                <div className="absolute bottom-2 left-2 px-3 py-1 bg-green-500 text-white text-sm rounded-full flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4" />
                                  Uploaded
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => {
                setStep('country')
                setUploads([])
              }}
              className="btn-secondary flex-1"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={uploads.length === 0 || isSubmitting}
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Submit for Verification
                </>
              )}
            </button>
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-200">
                <p className="font-medium mb-1">Tips for clear photos:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-300">
                  <li>Ensure all text is clearly visible</li>
                  <li>Photo should be well-lit without glare</li>
                  <li>All four corners of the document must be visible</li>
                  <li>No black and white photos or photocopies</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Step 3: Submitted
  if (step === 'submitted') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Documents Submitted!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your verification documents have been submitted successfully.
            Our team will review them within 1-3 business days.
            We'll send you an email once the review is complete.
          </p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return null
}

