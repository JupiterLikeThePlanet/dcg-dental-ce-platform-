
import SignupForm from '@/components/SignupForm';

export default function SignupPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-24">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Join the Community</h1>
          <p className="text-gray-500 text-sm mt-2">Start your journey with DCG Dental CE</p>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}
