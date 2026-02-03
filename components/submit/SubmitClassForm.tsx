'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import Spinner from '@/components/ui/Spinner';

interface SubmitClassFormProps {
  userId: string;
  userEmail: string;
}

interface FormData {
  // Basic Info
  title: string;
  description: string;
  category: string;
  
  // Date & Time
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  timezone: string;
  
  // Location
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  zip_code: string;
  
  // Instructor/Provider
  instructor_name: string;
  provider_name: string;
  contact_email: string;
  contact_phone: string;
  
  // Course Details
  price: string;
  ce_credits: string;
  registration_url: string;
  image_url: string;
  coupon_code: string;
}

const initialFormData: FormData = {
  title: '',
  description: '',
  category: '',
  start_date: '',
  end_date: '',
  start_time: '08:00',
  end_time: '17:00',
  timezone: 'America/Chicago',
  address_line1: '',
  address_line2: '',
  city: '',
  state: 'LA',
  zip_code: '',
  instructor_name: '',
  provider_name: '',
  contact_email: '',
  contact_phone: '',
  price: '',
  ce_credits: '',
  registration_url: '',
  image_url: '',
  coupon_code: ''
};

const categories = [
  'Implants',
  'Endodontics',
  'Pediatric Dentistry',
  'Orthodontics',
  'Periodontics',
  'Oral Surgery',
  'Cosmetic Dentistry',
  'Restorative',
  'Practice Management',
  'Compliance',
  'Sedation',
  'Digital Dentistry',
  'Laser Dentistry',
  'Emergency Medicine',
  'Geriatric Dentistry',
  'Photography',
  'Wellness',
  'Other',
];

const states = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

export default function SubmitClassForm({ userId, userEmail }: SubmitClassFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Template/Edit mode state
  const [isTemplate, setIsTemplate] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [originalSubmissionId, setOriginalSubmissionId] = useState<string | null>(null);

  const totalSteps = 4;

  // Load template or edit data from sessionStorage
  useEffect(() => {
    const templateParam = searchParams.get('template');
    const editParam = searchParams.get('edit');

    if (templateParam === 'true') {
      const templateData = sessionStorage.getItem('submissionTemplate');
      if (templateData) {
        try {
          const parsed = JSON.parse(templateData);
          setFormData({ ...initialFormData, ...parsed, coupon_code: '' });
          setIsTemplate(true);
          // Clear the sessionStorage after loading
          sessionStorage.removeItem('submissionTemplate');
        } catch (e) {
          console.error('Failed to parse template data:', e);
        }
      }
    } else if (editParam === 'true') {
      const editData = sessionStorage.getItem('submissionEdit');
      if (editData) {
        try {
          const parsed = JSON.parse(editData);
          const { originalId, ...formFields } = parsed;
          setFormData({ ...initialFormData, ...formFields, coupon_code: '' });
          setIsEdit(true);
          setOriginalSubmissionId(originalId);
          // Clear the sessionStorage after loading
          sessionStorage.removeItem('submissionEdit');
        } catch (e) {
          console.error('Failed to parse edit data:', e);
        }
      }
    }
  }, [searchParams]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when field is edited
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<FormData> = {};

    if (step === 1) {
      if (!formData.title.trim()) newErrors.title = 'Title is required';
      else if (formData.title.length > 100) newErrors.title = 'Title must be 100 characters or less';
      
      if (!formData.description.trim()) newErrors.description = 'Description is required';
      else if (formData.description.length > 1000) newErrors.description = 'Description must be 1000 characters or less';
      
      if (!formData.category) newErrors.category = 'Category is required';
    }

    if (step === 2) {
      if (!formData.start_date) newErrors.start_date = 'Start date is required';
      if (!formData.start_time) newErrors.start_time = 'Start time is required';
      if (!formData.end_time) newErrors.end_time = 'End time is required';
      
      // Validate end date is after start date if provided
      if (formData.end_date && formData.start_date && formData.end_date < formData.start_date) {
        newErrors.end_date = 'End date must be after start date';
      }
    }

    if (step === 3) {
      if (!formData.address_line1.trim()) newErrors.address_line1 = 'Address is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.state) newErrors.state = 'State is required';
      if (!formData.zip_code.trim()) newErrors.zip_code = 'ZIP code is required';
      else if (!/^\d{5}(-\d{4})?$/.test(formData.zip_code)) newErrors.zip_code = 'Invalid ZIP code';
    }

    if (step === 4) {
      if (!formData.instructor_name.trim()) newErrors.instructor_name = 'Instructor name is required';
      if (!formData.provider_name.trim()) newErrors.provider_name = 'Provider/organization name is required';
      
      if (!formData.price.trim()) newErrors.price = 'Price is required';
      else if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
        newErrors.price = 'Price must be a valid number';
      }
      
      if (formData.ce_credits && (isNaN(parseInt(formData.ce_credits)) || parseInt(formData.ce_credits) < 0)) {
        newErrors.ce_credits = 'CE credits must be a valid number';
      }
      
      if (!formData.registration_url.trim()) newErrors.registration_url = 'Registration URL is required';
      else if (!/^https?:\/\/.+/.test(formData.registration_url)) {
        newErrors.registration_url = 'URL must start with http:// or https://';
      }
      
      if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
        newErrors.contact_email = 'Invalid email format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setIsNavigating(true);
      setTimeout(() => {
        setCurrentStep(prev => Math.min(prev + 1, totalSteps));
        setIsNavigating(false);
      }, 300);
    }
  };

  const handleBack = () => {
    setIsNavigating(true);
    setTimeout(() => {
      setCurrentStep(prev => Math.max(prev - 1, 1));
      setIsNavigating(false);
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) return;
    
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Prepare submission data
      const submissionData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        start_time: formData.start_time,
        end_time: formData.end_time,
        address_line1: formData.address_line1.trim(),
        address_line2: formData.address_line2.trim() || null,
        city: formData.city.trim(),
        state: formData.state,
        zip_code: formData.zip_code.trim(),
        instructor_name: formData.instructor_name.trim(),
        provider_name: formData.provider_name.trim(),
        contact_email: formData.contact_email.trim() || null,
        contact_phone: formData.contact_phone.trim() || null,
        price: parseFloat(formData.price),
        ce_credits: formData.ce_credits ? parseInt(formData.ce_credits) : null,
        registration_url: formData.registration_url.trim(),
        image_url: formData.image_url.trim() || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800',
      };

      // Call our checkout API
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          submissionData, 
          couponCode: formData.coupon_code.trim().toUpperCase() || null,
          // Include original submission ID if this is an edit/resubmit
          originalSubmissionId: isEdit ? originalSubmissionId : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process submission');
      }

      // If admin or coupon used, redirect to success
      if (data.success && (data.isAdmin || data.usedCoupon)) {
        router.push('/submit/success?method=' + (data.isAdmin ? 'admin' : 'coupon'));
        return;
      }

      // Otherwise, redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setSubmitError(errorMessage);
      setIsSubmitting(false);
    }
  };

  // Step indicator component
  const renderStepIndicator = () => (
    <div className="mb-8">
      {/* Template/Edit Mode Banner */}
      {(isTemplate || isEdit) && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
          isEdit 
            ? 'bg-blue-50 border border-blue-200 text-blue-700' 
            : 'bg-purple-50 border border-purple-200 text-purple-700'
        }`}>
          {isEdit ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              <span className="font-medium">Edit & Resubmit Mode</span>
              <span className="text-sm">— Make your changes and submit again</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
              </svg>
              <span className="font-medium">Using Template</span>
              <span className="text-sm">— Pre-filled from your previous submission</span>
            </>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step < currentStep
                  ? 'bg-green-500 text-white'
                  : step === currentStep
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step < currentStep ? '✓' : step}
            </div>
            {step < 4 && (
              <div
                className={`w-16 sm:w-24 h-1 mx-2 transition-colors ${
                  step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-600">
        <span>Basic Info</span>
        <span>Date & Time</span>
        <span>Location</span>
        <span>Details</span>
      </div>
    </div>
  );

  // Step 1: Basic Info
  const renderStep1 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
      
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Class Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Introduction to Dental Implants"
          maxLength={100}
          className={`w-full px-4 py-2 border rounded-sm focus:outline-none focus:border-blue-500 ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
        <p className="text-gray-500 text-sm mt-1">{formData.title.length}/100 characters</p>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          placeholder="Describe what attendees will learn..."
          maxLength={1000}
          className={`w-full px-4 py-2 border rounded-sm focus:outline-none focus:border-blue-500 ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
        <p className="text-gray-500 text-sm mt-1">{formData.description.length}/1000 characters</p>
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-sm focus:outline-none focus:border-blue-500 ${
            errors.category ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
      </div>
    </div>
  );

  // Step 2: Date & Time
  const renderStep2 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Date & Time</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
            Start Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="start_date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-sm focus:outline-none focus:border-blue-500 ${
              errors.start_date ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.start_date && <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>}
        </div>

        <div>
          <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
            End Date <span className="text-gray-400 text-xs">(optional, for multi-day)</span>
          </label>
          <input
            type="date"
            id="end_date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-sm focus:outline-none focus:border-blue-500 ${
              errors.end_date ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.end_date && <p className="text-red-500 text-sm mt-1">{errors.end_date}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-1">
            Start Time <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            id="start_time"
            name="start_time"
            value={formData.start_time}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-sm focus:outline-none focus:border-blue-500 ${
              errors.start_time ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.start_time && <p className="text-red-500 text-sm mt-1">{errors.start_time}</p>}
        </div>

        <div>
          <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-1">
            End Time <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            id="end_time"
            name="end_time"
            value={formData.end_time}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-sm focus:outline-none focus:border-blue-500 ${
              errors.end_time ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.end_time && <p className="text-red-500 text-sm mt-1">{errors.end_time}</p>}
        </div>
      </div>
    </div>
  );

  // Step 3: Location
  const renderStep3 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Location</h2>
      
      <div>
        <label htmlFor="address_line1" className="block text-sm font-medium text-gray-700 mb-1">
          Address Line 1 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="address_line1"
          name="address_line1"
          value={formData.address_line1}
          onChange={handleChange}
          placeholder="123 Main Street"
          className={`w-full px-4 py-2 border rounded-sm focus:outline-none focus:border-blue-500 ${
            errors.address_line1 ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.address_line1 && <p className="text-red-500 text-sm mt-1">{errors.address_line1}</p>}
      </div>

      <div>
        <label htmlFor="address_line2" className="block text-sm font-medium text-gray-700 mb-1">
          Address Line 2 <span className="text-gray-400 text-xs">(optional)</span>
        </label>
        <input
          type="text"
          id="address_line2"
          name="address_line2"
          value={formData.address_line2}
          onChange={handleChange}
          placeholder="Suite 100"
          className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="col-span-2">
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
            City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="New Orleans"
            className={`w-full px-4 py-2 border rounded-sm focus:outline-none focus:border-blue-500 ${
              errors.city ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
        </div>

        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
            State <span className="text-red-500">*</span>
          </label>
          <select
            id="state"
            name="state"
            value={formData.state}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-sm focus:outline-none focus:border-blue-500 ${
              errors.state ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            {states.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
          {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
        </div>

        <div>
          <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700 mb-1">
            ZIP Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="zip_code"
            name="zip_code"
            value={formData.zip_code}
            onChange={handleChange}
            placeholder="70112"
            className={`w-full px-4 py-2 border rounded-sm focus:outline-none focus:border-blue-500 ${
              errors.zip_code ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.zip_code && <p className="text-red-500 text-sm mt-1">{errors.zip_code}</p>}
        </div>
      </div>
    </div>
  );

  // Step 4: Course Details
  const renderStep4 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Course Details</h2>
      
      {/* Instructor & Provider */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="instructor_name" className="block text-sm font-medium text-gray-700 mb-1">
            Instructor Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="instructor_name"
            name="instructor_name"
            value={formData.instructor_name}
            onChange={handleChange}
            placeholder="Dr. Jane Smith"
            className={`w-full px-4 py-2 border rounded-sm focus:outline-none focus:border-blue-500 ${
              errors.instructor_name ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.instructor_name && <p className="text-red-500 text-sm mt-1">{errors.instructor_name}</p>}
        </div>

        <div>
          <label htmlFor="provider_name" className="block text-sm font-medium text-gray-700 mb-1">
            Provider/Organization <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="provider_name"
            name="provider_name"
            value={formData.provider_name}
            onChange={handleChange}
            placeholder="Louisiana Dental Association"
            className={`w-full px-4 py-2 border rounded-sm focus:outline-none focus:border-blue-500 ${
              errors.provider_name ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.provider_name && <p className="text-red-500 text-sm mt-1">{errors.provider_name}</p>}
        </div>
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-1">
            Contact Email <span className="text-gray-400 text-xs">(optional)</span>
          </label>
          <input
            type="email"
            id="contact_email"
            name="contact_email"
            value={formData.contact_email}
            onChange={handleChange}
            placeholder="contact@example.com"
            className={`w-full px-4 py-2 border rounded-sm focus:outline-none focus:border-blue-500 ${
              errors.contact_email ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.contact_email && <p className="text-red-500 text-sm mt-1">{errors.contact_email}</p>}
        </div>

        <div>
          <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700 mb-1">
            Contact Phone <span className="text-gray-400 text-xs">(optional)</span>
          </label>
          <input
            type="tel"
            id="contact_phone"
            name="contact_phone"
            value={formData.contact_phone}
            onChange={handleChange}
            placeholder="(555) 123-4567"
            className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Price & CE Credits */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
            Price ($) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            min="0"
            step="0.01"
            placeholder="299.00"
            className={`w-full px-4 py-2 border rounded-sm focus:outline-none focus:border-blue-500 ${
              errors.price ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
        </div>

        <div>
          <label htmlFor="ce_credits" className="block text-sm font-medium text-gray-700 mb-1">
            CE Credits <span className="text-gray-400 text-xs">(optional)</span>
          </label>
          <input
            type="number"
            id="ce_credits"
            name="ce_credits"
            value={formData.ce_credits}
            onChange={handleChange}
            min="0"
            placeholder="8"
            className={`w-full px-4 py-2 border rounded-sm focus:outline-none focus:border-blue-500 ${
              errors.ce_credits ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.ce_credits && <p className="text-red-500 text-sm mt-1">{errors.ce_credits}</p>}
        </div>
      </div>

      {/* Registration URL */}
      <div>
        <label htmlFor="registration_url" className="block text-sm font-medium text-gray-700 mb-1">
          Registration URL <span className="text-red-500">*</span>
        </label>
        <input
          type="url"
          id="registration_url"
          name="registration_url"
          value={formData.registration_url}
          onChange={handleChange}
          placeholder="https://example.com/register"
          className={`w-full px-4 py-2 border rounded-sm focus:outline-none focus:border-blue-500 ${
            errors.registration_url ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.registration_url && <p className="text-red-500 text-sm mt-1">{errors.registration_url}</p>}
        <p className="text-gray-500 text-sm mt-1">Where attendees will go to register for your class</p>
      </div>

      {/* Image URL */}
      <div>
        <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-1">
          Image URL <span className="text-gray-400 text-xs">(optional)</span>
        </label>
        <input
          type="url"
          id="image_url"
          name="image_url"
          value={formData.image_url}
          onChange={handleChange}
          placeholder="https://example.com/image.jpg"
          className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-blue-500"
        />
        <p className="text-gray-500 text-sm mt-1">Leave blank to use a default dental image</p>
      </div>

      {/* Coupon Code */}
      <div>
        <label htmlFor="coupon_code" className="block text-sm font-medium text-gray-700 mb-1">
          Coupon Code <span className="text-gray-400 text-xs">(optional)</span>
        </label>
        <input
          type="text"
          id="coupon_code"
          name="coupon_code"
          value={formData.coupon_code}
          onChange={handleChange}
          placeholder="Enter coupon code if you have one"
          className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-blue-500 uppercase"
        />
        <p className="text-gray-500 text-sm mt-1">Have a coupon? Enter it to waive the $5 fee</p>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>
      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Form Steps */}
      <div className="bg-white border border-gray-200 rounded-sm p-6 mb-6">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </div>

      {/* Error Message */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-sm p-4 mb-6">
          <p className="text-red-700">{submitError}</p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={currentStep === 1 || isNavigating || isSubmitting}
          className={`px-6 py-2 rounded-sm font-medium flex items-center gap-2 ${
            currentStep === 1 || isNavigating || isSubmitting
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          ← Back
        </button>

        {currentStep < totalSteps ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={isNavigating}
            className={`px-6 py-2 rounded-sm font-medium flex items-center gap-2 ${
              isNavigating
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {isNavigating ? (
              <>
                <Spinner size="sm" />
                Loading...
              </>
            ) : (
              'Next →'
            )}
          </button>
        ) : (
          <button
            type="submit"
            disabled={isSubmitting || isNavigating}
            className={`px-6 py-2 font-medium rounded-sm flex items-center gap-2 ${
              isSubmitting || isNavigating
                ? 'bg-green-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            } text-white`}
          >
            {isSubmitting ? (
              <>
                <Spinner size="sm" />
                Submitting...
              </>
            ) : isEdit ? (
              'Resubmit for Review'
            ) : (
              'Submit for Review'
            )}
          </button>
        )}
      </div>

      {/* Pricing Note */}
      <p className="text-center text-gray-500 text-sm mt-6">
        {isEdit 
          ? 'Resubmitting a rejected class is free • Questions? Contact support@dcgdental.com'
          : 'Submission fee: $5 (paid after review) • Questions? Contact support@dcgdental.com'
        }
      </p>
    </form>
  );
}