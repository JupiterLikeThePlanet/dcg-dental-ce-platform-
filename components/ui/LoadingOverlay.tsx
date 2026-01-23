import Spinner from './Spinner';

interface LoadingOverlayProps {
  message?: string;
}

export default function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 z-50 flex flex-col items-center justify-center">
      <Spinner size="lg" color="blue" />
      <p className="mt-4 text-gray-600 font-medium">{message}</p>
    </div>
  );
}