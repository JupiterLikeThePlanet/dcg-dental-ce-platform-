import Link from 'next/link';
import Image from 'next/image';

interface ClassCardProps {
  id: string;
  title: string;
  start_date: string;
  city: string;
  state: string;
  instructor_name: string;
  price: number;
  image_url: string;
  ce_credits: number | null;
  attendance_type: string | null;
}

const attendanceBadgeStyle: Record<string, string> = {
  'on-site': 'bg-green-100 text-green-800',
  'remote': 'bg-purple-100 text-purple-800',
  'hybrid': 'bg-orange-100 text-orange-800',
  'pre-recorded': 'bg-blue-100 text-blue-800',
};

const attendanceLabel: Record<string, string> = {
  'on-site': 'On-Site',
  'remote': 'Remote',
  'hybrid': 'Hybrid',
  'pre-recorded': 'Pre-Recorded',
};

export default function ClassCard({
  id,
  title,
  start_date,
  city,
  state,
  instructor_name,
  price,
  image_url,
  ce_credits,
  attendance_type,
}: ClassCardProps) {
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <Link 
      href={`/classes/${id}`}
      className="block bg-white border-2 border-gray-200 rounded-sm hover:border-blue-600 transition-colors flex flex-col"
    >
      <div className="relative h-48 w-full bg-gray-200">
        <Image
          src={image_url}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      
      <div className="p-4 flex-grow flex flex-col">
        <h3 className="font-bold text-lg mb-2 line-clamp-2 min-h-[3.5rem] text-gray-900">
          {title}
        </h3>
        
        <div className="space-y-1 text-sm text-gray-600 mb-3">
          <p>📅 {formatDate(start_date)}</p>
          <p className="flex items-center gap-2">
            <span>📍 {city}, {state}</span>
            {attendance_type && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${attendanceBadgeStyle[attendance_type] ?? 'bg-gray-100 text-gray-700'}`}>
                {attendanceLabel[attendance_type] ?? attendance_type}
              </span>
            )}
          </p>
          <p>👤 {instructor_name}</p>
          {ce_credits && (
            <p className="text-blue-600 font-semibold">{ce_credits} CE Credits</p>
          )}
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <span className="text-lg font-bold text-green-700">
            ${price.toFixed(2)}
          </span>
          <span className="text-sm text-blue-600 font-medium">
            View Details →
          </span>
        </div>
      </div>
    </Link>
  );
}