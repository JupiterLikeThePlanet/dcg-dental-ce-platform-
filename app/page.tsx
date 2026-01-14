
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-20">
      <div className="text-center">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
          Find Dental Continuing <br />
          <span className="text-blue-600 underline decoration-blue-200 underline-offset-8">Education Near You</span>
        </h1>
        <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto">
          The simple way for dental professionals to discover local CE courses 
          and for organizers to reach the community.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link 
            href="/signup" 
            className="px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl text-lg"
          >
            Get Started Free
          </Link>
          <button 
            className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-lg hover:border-gray-300 transition-all text-lg"
          >
            Browse Listings
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {[
            { title: "Local Courses", desc: "Find hands-on workshops and seminars in your city." },
            { title: "Verified Credits", desc: "Ensure your credits are from recognized providers." },
            { title: "Easy Submission", desc: "List your own CE course in minutes for the community." }
          ].map((feature, i) => (
            <div key={i} className="p-6 bg-white border border-gray-200 rounded-xl text-left shadow-sm">
              <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
