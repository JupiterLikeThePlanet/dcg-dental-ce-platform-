import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

// TypeScript interface for the class data
interface DentalClass {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string | null;
  start_time: string;
  end_time: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip_code: string;
  instructor_name: string;
  provider_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  price: number;
  ce_credits: number | null;
  category: string | null;
  registration_url: string;
  image_url: string;
  status: 'pending' | 'approved' | 'rejected';
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

// Helper function to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

// Helper function to format time
function formatTime(timeString: string): string {
  // timeString is in format "HH:MM:SS" or "HH:MM"
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClassDetailPage({ params }: PageProps) {
  // In Next.js 14+, params is a Promise
  const { id } = await params;
  const cookieStore = await cookies();

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // Fetch the specific class
  const { data: classData, error } = await supabase
    .from('classes')
    .select('*')
    .eq('id', id)
    .eq('status', 'approved')
    .is('deleted_at', null)
    .single<DentalClass>();

  // Handle not found
  if (error || !classData) {
    notFound();
  }

  // Build Google Maps URL for directions
  const addressForMaps = encodeURIComponent(
    `${classData.address_line1}, ${classData.city}, ${classData.state} ${classData.zip_code}`
  );
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${addressForMaps}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Link */}
      <Link 
        href="/classes" 
        className="text-blue-600 hover:underline mb-6 inline-block"
      >
        ← Back to all classes
      </Link>

      {/* Class Image */}
      <div className="relative h-64 md:h-80 w-full bg-gray-200 rounded-sm overflow-hidden mb-6">
        <Image
          src={classData.image_url}
          alt={classData.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 896px"
          priority
        />
      </div>

      {/* Title and Price */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {classData.title}
        </h1>
        <div className="flex-shrink-0">
          <span className="text-2xl font-bold text-green-700">
            ${classData.price.toFixed(2)}
          </span>
          {classData.ce_credits && (
            <p className="text-blue-600 font-semibold text-sm">
              {classData.ce_credits} CE Credits
            </p>
          )}
        </div>
      </div>

      {/* Key Details */}
      <div className="bg-gray-50 border border-gray-200 rounded-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date & Time */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Date & Time</h3>
            <p className="text-gray-700">
              {formatDate(classData.start_date)}
              {classData.end_date && classData.end_date !== classData.start_date && (
                <> – {formatDate(classData.end_date)}</>
              )}
            </p>
            <p className="text-gray-600 text-sm">
              {formatTime(classData.start_time)} – {formatTime(classData.end_time)}
            </p>
          </div>

          {/* Location */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Location</h3>
            <p className="text-gray-700">{classData.address_line1}</p>
            {classData.address_line2 && (
              <p className="text-gray-700">{classData.address_line2}</p>
            )}
            <p className="text-gray-700">
              {classData.city}, {classData.state} {classData.zip_code}
            </p>
            <a 
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm"
            >
              Get Directions →
            </a>
          </div>

          {/* Instructor */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Instructor</h3>
            <p className="text-gray-700">{classData.instructor_name}</p>
          </div>

          {/* Provider */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Provider</h3>
            <p className="text-gray-700">{classData.provider_name}</p>
          </div>
        </div>
      </div>

      {/* Category */}
      {classData.category && (
        <div className="mb-6">
          <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-sm">
            {classData.category}
          </span>
        </div>
      )}

      {/* Description */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          About This Course
        </h2>
        <p className="text-gray-700 whitespace-pre-line">
          {classData.description}
        </p>
      </div>

      {/* Contact Information */}
      {(classData.contact_email || classData.contact_phone) && (
        <div className="bg-gray-50 border border-gray-200 rounded-sm p-4 mb-8">
          <h3 className="font-semibold text-gray-900 mb-2">Contact Information</h3>
          {classData.contact_email && (
            <p className="text-gray-700">
              Email:{' '}
              <a 
                href={`mailto:${classData.contact_email}`}
                className="text-blue-600 hover:underline"
              >
                {classData.contact_email}
              </a>
            </p>
          )}
          {classData.contact_phone && (
            <p className="text-gray-700">
              Phone:{' '}
              <a 
                href={`tel:${classData.contact_phone}`}
                className="text-blue-600 hover:underline"
              >
                {classData.contact_phone}
              </a>
            </p>
          )}
        </div>
      )}

      {/* Register Button */}
      <div className="flex flex-col sm:flex-row gap-4">
        <a
          href={classData.registration_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-blue-600 text-white text-center font-semibold py-3 px-8 rounded-sm hover:bg-blue-700 transition-colors"
        >
          Register for This Class →
        </a>
        <Link
          href="/classes"
          className="inline-block border-2 border-gray-300 text-gray-700 text-center font-semibold py-3 px-8 rounded-sm hover:border-gray-400 transition-colors"
        >
          Browse More Classes
        </Link>
      </div>

      {/* Disclaimer */}
      <p className="text-gray-500 text-xs mt-8">
        This listing is provided for informational purposes. Registration and payment 
        are handled by the course provider. DCG Dental is not responsible for course 
        content, CE credit verification, or refund policies.
      </p>
    </div>
  );
}