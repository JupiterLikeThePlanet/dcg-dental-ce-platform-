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
}

export default function ClassCard({
  id,
  title,
  start_date,
  city,
  state,
  instructor_name,
  price,
  image_url,
  ce_credits
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
      className="block bg-white border-2 border-gray-200 rounded-sm hover:border-blue-600 transition-colors"
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
      
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 line-clamp-2 text-gray-900">
          {title}
        </h3>
        
        <div className="space-y-1 text-sm text-gray-600 mb-3">
          <p>📅 {formatDate(start_date)}</p>
          <p>📍 {city}, {state}</p>
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