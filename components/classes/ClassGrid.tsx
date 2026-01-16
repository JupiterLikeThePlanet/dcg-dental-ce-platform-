import ClassCard from './ClassCard';

interface Class {
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

interface ClassGridProps {
  classes: Class[];
}

export default function ClassGrid({ classes }: ClassGridProps) {
  if (classes.length === 0) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <p className="text-gray-500 text-lg">No classes found.</p>
        <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or check back later.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {classes.map((classItem, index) => (
        <div 
          key={classItem.id} 
          className="animate-fade-in-up"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <ClassCard
            key={classItem.id}
            id={classItem.id}
            title={classItem.title}
            start_date={classItem.start_date}
            city={classItem.city}
            state={classItem.state}
            instructor_name={classItem.instructor_name}
            price={classItem.price}
            image_url={classItem.image_url}
            ce_credits={classItem.ce_credits}
          />
        </div>
      ))}
    </div>
  );
}