'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

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
  timezone: string;  // ADD THIS LINE
  
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
  const supabase = createClient();
  
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  
  const totalSteps = 4;

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
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
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
      body: JSON.stringify({ submissionData }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to process submission');
    }

    // If admin, redirect directly to success
    if (data.isAdmin) {
      router.push('/submit/success');
      return;
    }

    // For regular users, redirect to Stripe Checkout
    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error('No checkout URL returned');
    }

  } catch (error: unknown) {
    console.error('Submission error:', error);
    if (error instanceof Error) {
      setSubmitError(`Failed to submit: ${error.message}`);
    } else {
      setSubmitError('Failed to submit. Please try again.');
    }
  } finally {
    setIsSubmitting(false);
  }
};

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step < currentStep
                  ? 'bg-green-600 text-white'
                  : step === currentStep
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step < currentStep ? '✓' : step}
            </div>
            {step < 4 && (
              <div
                className={`w-16 sm:w-24 h-1 mx-2 ${
                  step < currentStep ? 'bg-green-600' : 'bg-gray-200'
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

  const renderStep1 = () => (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
      
      {/* Title */}
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
          maxLength={100}
          placeholder="e.g., Advanced Implant Techniques"
          className={`w-full px-4 py-2 border rounded-sm focus:outline-none focus:border-blue-500 ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        <div className="flex justify-between mt-1">
          {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
          <p className="text-gray-400 text-sm ml-auto">{formData.title.length}/100</p>
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          maxLength={1000}
          rows={5}
          placeholder="Describe what attendees will learn, topics covered, and any prerequisites..."
          className={`w-full px-4 py-2 border rounded-sm focus:outline-none focus:border-blue-500 ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        <div className="flex justify-between mt-1">
          {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
          <p className="text-gray-400 text-sm ml-auto">{formData.description.length}/1000</p>
        </div>
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          className={`w-full px-4 py-2 border rounded-sm focus:outline-none focus:border-blue-500 bg-white ${
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

  const renderStep2 = () => (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-semibold text-gray-900">Date & Time</h2>
      
      {/* Date Row */}
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
            min={new Date().toISOString().split('T')[0]}
            className={`w-full px-4 py-2 border rounded-sm focus:outline-none focus:border-blue-500 cursor-pointer ${
              errors.start_date ? 'border-red-500' : 'border-gray-300'
            }`}
            onClick={(e) => (e.target as HTMLInputElement).showPicker()}
          />
          {errors.start_date && <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>}
        </div>

        <div>
          <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
            End Date <span className="text-gray-400 text-xs">(for multi-day events)</span>
          </label>
          <input
            type="date"
            id="end_date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            min={formData.start_date || new Date().toISOString().split('T')[0]}
            className={`w-full px-4 py-2 border rounded-sm focus:outline-none focus:border-blue-500 cursor-pointer ${
              errors.end_date ? 'border-red-500' : 'border-gray-300'
            }`}
            onClick={(e) => (e.target as HTMLInputElement).showPicker()}
          />
          {errors.end_date && <p className="text-red-500 text-sm mt-1">{errors.end_date}</p>}
        </div>
      </div>

      {/* Time Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

        <div>
          <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
            Timezone <span className="text-red-500">*</span>
          </label>
          <select
            id="timezone"
            name="timezone"
            value={formData.timezone}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-blue-500 bg-white"
          >
            <option value="America/Chicago">Central (CT)</option>
            <option value="America/New_York">Eastern (ET)</option>
            <option value="America/Denver">Mountain (MT)</option>
            <option value="America/Los_Angeles">Pacific (PT)</option>
            <option value="America/Phoenix">Arizona (AZ)</option>
          </select>
        </div>
      </div>

      {/* Multi-day note */}
      <p className="text-gray-500 text-sm">
        Times are in 24-hour format. For multi-day events, the start/end times apply to each day.
      </p>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-semibold text-gray-900">Location</h2>
      
      {/* Address Line 1 */}
      <div>
        <label htmlFor="address_line1" className="block text-sm font-medium text-gray-700 mb-1">
          Street Address <span className="text-red-500">*</span>
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

      {/* Address Line 2 */}
      <div>
        <label htmlFor="address_line2" className="block text-sm font-medium text-gray-700 mb-1">
          Suite/Unit <span className="text-gray-400 text-xs">(optional)</span>
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

      {/* City, State, ZIP */}
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
            placeholder="Baton Rouge"
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
            className={`w-full px-4 py-2 border rounded-sm focus:outline-none focus:border-blue-500 bg-white ${
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
            ZIP <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="zip_code"
            name="zip_code"
            value={formData.zip_code}
            onChange={handleChange}
            placeholder="70801"
            maxLength={10}
            className={`w-full px-4 py-2 border rounded-sm focus:outline-none focus:border-blue-500 ${
              errors.zip_code ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.zip_code && <p className="text-red-500 text-sm mt-1">{errors.zip_code}</p>}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-semibold text-gray-900">Course Details</h2>
      
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
          disabled={currentStep === 1}
          className={`px-6 py-2 rounded-sm font-medium ${
            currentStep === 1
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
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-sm hover:bg-blue-700"
          >
            Next →
          </button>
        ) : (
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-2 font-medium rounded-sm ${
              isSubmitting
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit for Review'}
          </button>
        )}
      </div>

      {/* Pricing Note */}
      <p className="text-center text-gray-500 text-sm mt-6">
        Submission fee: $5 (paid after review) • Questions? Contact support@dcgdental.com
      </p>
    </form>
  );
}