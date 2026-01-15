'use client';

import { useRouter, useSearchParams } from 'next/navigation';

type SortOption = 'date' | 'instructor' | 'price' | 'location';
type SortDirection = 'asc' | 'desc';

interface SortControlsProps {
  currentSort: SortOption;
  currentDirection: SortDirection;
}

const sortLabels: Record<SortOption, string> = {
  date: 'Date',
  instructor: 'Instructor',
  price: 'Price',
  location: 'Location',
};

export default function SortControls({ currentSort, currentDirection }: SortControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSortChange = (sort: SortOption) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // If clicking the same sort, toggle direction
    if (sort === currentSort) {
      params.set('dir', currentDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New sort field, default to ascending (except price which defaults to low-high)
      params.set('sort', sort);
      params.set('dir', 'asc');
    }
    
    router.push(`/classes?${params.toString()}`);
  };

  const getArrow = (sort: SortOption) => {
    if (sort !== currentSort) return '';
    return currentDirection === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <span className="text-sm text-gray-600 mr-2">Sort by:</span>
      
      {(Object.keys(sortLabels) as SortOption[]).map((sort) => (
        <button
          key={sort}
          onClick={() => handleSortChange(sort)}
          className={`px-3 py-1.5 text-sm rounded-sm border transition-colors ${
            currentSort === sort
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
          }`}
        >
          {sortLabels[sort]}{getArrow(sort)}
        </button>
      ))}
    </div>
  );
}