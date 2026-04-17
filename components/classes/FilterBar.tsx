'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

interface FilterBarProps {
  currentSearch: string;
  currentState: string;
  currentCategory: string;
  availableStates: string[];
  availableCategories: string[];
}

export default function FilterBar({
  currentSearch,
  currentState,
  currentCategory,
  availableStates,
  availableCategories
}: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = useState(currentSearch);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Draft values inside the sheet (applied only on "Apply")
  const [draftCategory, setDraftCategory] = useState(currentCategory);
  const [draftState, setDraftState] = useState(currentState);

  useEffect(() => {
    setSearchInput(currentSearch);
  }, [currentSearch]);

  // Sync draft values when sheet opens
  useEffect(() => {
    if (sheetOpen) {
      setDraftCategory(currentCategory);
      setDraftState(currentState);
    }
  }, [sheetOpen, currentCategory, currentState]);

  // Lock body scroll while sheet is open
  useEffect(() => {
    if (sheetOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sheetOpen]);

  const updateFilters = (newParams: { search?: string; state?: string; category?: string }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newParams.search !== undefined) {
      if (newParams.search) {
        params.set('search', newParams.search);
      } else {
        params.delete('search');
      }
    }

    if (newParams.state !== undefined) {
      if (newParams.state) {
        params.set('state', newParams.state);
      } else {
        params.delete('state');
      }
    }

    if (newParams.category !== undefined) {
      if (newParams.category) {
        params.set('category', newParams.category);
      } else {
        params.delete('category');
      }
    }

    params.delete('page');
    router.push(`/classes?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput.trim() });
  };

  const handleStateChange = (state: string) => {
    updateFilters({ state });
  };

  const handleCategoryChange = (category: string) => {
    updateFilters({ category });
  };

  const handleApplySheet = () => {
    updateFilters({ state: draftState, category: draftCategory });
    setSheetOpen(false);
  };

  const handleClearSheet = () => {
    setDraftState('');
    setDraftCategory('');
  };

  const handleClearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('search');
    params.delete('state');
    params.delete('category');
    params.delete('page');
    setSearchInput('');
    router.push(`/classes?${params.toString()}`);
  };

  const hasActiveFilters = currentSearch || currentState || currentCategory;
  const activeFilterCount = [currentState, currentCategory].filter(Boolean).length;

  return (
    <div className="mb-6 space-y-4">
      {/* Search row — always visible */}
      <div className="flex gap-2">
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

        {/* Mobile-only: Filters button that opens bottom sheet */}
        <button
          type="button"
          className="sm:hidden flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-sm text-sm text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
          onClick={() => setSheetOpen(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-medium">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Desktop: filter dropdowns — always visible */}
      <div className="hidden sm:flex flex-row gap-3">
        <div className="w-48">
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

        <div className="w-36">
          <select
            value={currentState}
            onChange={(e) => handleStateChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-blue-500 text-sm bg-white"
          >
            <option value="">All States</option>
            {availableStates.map((state) => (
              <option key={state} value={state}>
                {state}
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
              <button onClick={() => updateFilters({ search: '' })} className="ml-1 hover:text-blue-600">✕</button>
            </span>
          )}

          {currentCategory && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded-sm">
              {currentCategory}
              <button onClick={() => updateFilters({ category: '' })} className="ml-1 hover:text-purple-600">✕</button>
            </span>
          )}

          {currentState && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-sm rounded-sm">
              {currentState}
              <button onClick={() => updateFilters({ state: '' })} className="ml-1 hover:text-green-600">✕</button>
            </span>
          )}

          <button onClick={handleClearAll} className="text-sm text-gray-500 hover:text-gray-700 underline">
            Clear all
          </button>
        </div>
      )}

      {/* Mobile: Bottom sheet backdrop + panel */}
      <div
        className={`sm:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${sheetOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSheetOpen(false)}
      />
      <div
        className={`sm:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 shadow-2xl transition-transform duration-300 ease-out ${sheetOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Sheet handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Sheet header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Filters</h3>
          <button
            onClick={() => setSheetOpen(false)}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
            aria-label="Close filters"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Sheet body */}
        <div className="px-5 py-4 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={draftCategory}
              onChange={(e) => setDraftCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base bg-white focus:outline-none focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {availableCategories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
            <select
              value={draftState}
              onChange={(e) => setDraftState(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base bg-white focus:outline-none focus:border-blue-500"
            >
              <option value="">All States</option>
              {availableStates.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Sheet footer */}
        <div className="flex gap-3 px-5 pb-8 pt-2">
          <button
            onClick={handleClearSheet}
            className="flex-1 py-3 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={handleApplySheet}
            className="flex-2 flex-grow-[2] py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
