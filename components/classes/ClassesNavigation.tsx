'use client';

import { createContext, useContext, useEffect, useRef, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ClassGridSkeleton from './ClassGridSkeleton';

// Shared navigation state for /classes so a filter, sort, or page click gives instant feedback.
//
// - pendingQuery: the URL the user just asked for, before the server has answered.
//   Controls show these values right away (optimistic UI) instead of snapping back.
// - isPending: true while the new results are on their way; PendingResults shows the skeleton.
// - updateQuery: the one way to change the URL. It builds on the latest *requested* URL,
//   so two quick changes in a row don't overwrite each other.

interface ClassesNavContextValue {
  pendingQuery: URLSearchParams | null;
  isPending: boolean;
  updateQuery: (mutate: (params: URLSearchParams) => void) => void;
}

const ClassesNavContext = createContext<ClassesNavContextValue | null>(null);

export function ClassesNavProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [pendingQuery, setPendingQuery] = useState<URLSearchParams | null>(null);
  const latestQuery = useRef<URLSearchParams | null>(null);

  // Once the server has answered, the real URL and props are the source of truth again.
  useEffect(() => {
    if (!isPending) {
      setPendingQuery(null);
      latestQuery.current = null;
    }
  }, [isPending]);

  const updateQuery = (mutate: (params: URLSearchParams) => void) => {
    const next = new URLSearchParams((latestQuery.current ?? searchParams).toString());
    mutate(next);
    latestQuery.current = next;
    setPendingQuery(next); // urgent update: controls re-render immediately
    startTransition(() => {
      router.push(`/classes?${next.toString()}`);
    });
  };

  return (
    <ClassesNavContext.Provider value={{ pendingQuery, isPending, updateQuery }}>
      {children}
    </ClassesNavContext.Provider>
  );
}

export function useClassesNav() {
  const ctx = useContext(ClassesNavContext);
  if (!ctx) throw new Error('useClassesNav must be used inside <ClassesNavProvider>');
  return ctx;
}

// Swaps the results for skeleton cards the instant a navigation starts.
export function PendingResults({ children }: { children: React.ReactNode }) {
  const { isPending } = useClassesNav();
  return isPending ? <ClassGridSkeleton /> : <>{children}</>;
}
