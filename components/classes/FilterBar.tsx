'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

interface FilterBarProps {
  currentSearch: string;
  currentCity: string;
  currentCategory: string;
  availableCities: string[];
  availableCategories: string[];
}

export default function FilterBar({ 
  currentSearch, 
  currentCity,
  currentCategory,
  availableCities,
  availableCategories
}: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Local state for search input (to enable typing without immediate URL updates)
  const [searchInput, setSearchInput] = useState(currentSearch);

  // Sync local state with URL params
  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  const updateFilters = (newParams: { search?: string; city?: string; category?: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Update search param
    if (newParams.search !== undefined) {
      if (newParams.search) {
        params.set('search', newParams.search);
      } else {
        params.delete('search');
      }
    }
    
    // Update city param
    if (newParams.city !== undefined) {
      if (newParams.city) {
        params.set('city', newParams.city);
      } else {
        params.delete('city');
      }
    }

    // Update category param
    if (newParams.category !== undefined) {
      if (newParams.category) {
        params.set('category', newParams.category);
      } else {
        params.delete('category');
      }
    }
    
    // Reset to page 1 when filters change
    params.delete('page');
    
    router.push(`/classes?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput.trim() });
  };

  const handleCityChange = (city: string) => {
    updateFilters({ city });
  };

  const handleCategoryChange = (category: string) => {
    updateFilters({ category });
  };

  const handleClearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('search');
    params.delete('city');
    params.delete('category');
    params.delete('page');
    setSearchInput('');
    router.push(`/classes?${params.toString()}`);
  };

  const hasActiveFilters = currentSearch || currentCity || currentCategory;

  return (
    <div className="mb-6 space-y-4">
      {/* Search and Filter Row */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <div className="flex">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by title, description, or instructor..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-l-sm focus:outline-none focus:border-blue-500 text-sm"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-r-sm hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Category Filter Dropdown */}
        <div className="sm:w-48">
          <select
            value={currentCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-blue-500 text-sm bg-white"
          >
            <option value="">All Categories</option>
            {availableCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* City Filter Dropdown */}
        <div className="sm:w-48">
          <select
            value={currentCity}
            onChange={(e) => handleCityChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-blue-500 text-sm bg-white"
          >
            <option value="">All Locations</option>
            {availableCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">Active filters:</span>
          
          {currentSearch && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-sm">
              &quot;{currentSearch}&quot;
              <button
                onClick={() => updateFilters({ search: '' })}
                className="ml-1 hover:text-blue-600"
              >
                ✕
              </button>
            </span>
          )}

          {currentCategory && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded-sm">
              {currentCategory}
              <button
                onClick={() => updateFilters({ category: '' })}
                className="ml-1 hover:text-purple-600"
              >
                ✕
              </button>
            </span>
          )}
          
          {currentCity && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-sm rounded-sm">
              {currentCity}
              <button
                onClick={() => updateFilters({ city: '' })}
                className="ml-1 hover:text-green-600"
              >
                ✕
              </button>
            </span>
          )}
          
          <button
            onClick={handleClearAll}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}