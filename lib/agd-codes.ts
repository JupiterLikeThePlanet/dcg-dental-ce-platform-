export interface AGDCategory {
  code: string;
  title: string;
}

export const AGD_CATEGORIES: AGDCategory[] = [
  { code: '010', title: 'Basic Sciences' },
  { code: '070', title: 'Endodontics' },
  { code: '130', title: 'Electives' },
  { code: '180', title: 'Myofascial Pain/Occlusion' },
  { code: '200', title: 'Orofacial Pain' },
  { code: '250', title: 'Operative (Restorative) Dentistry' },
  { code: '310', title: 'Oral and Maxillofacial Surgery' },
  { code: '340', title: 'Anesthesia and Pain Management' },
  { code: '370', title: 'Orthodontics' },
  { code: '430', title: 'Pediatric Dentistry' },
  { code: '490', title: 'Periodontics' },
  { code: '550', title: 'Practice Management and Human Relations' },
  { code: '610', title: 'Fixed Prosthodontics' },
  { code: '670', title: 'Removable Prosthodontics' },
  { code: '690', title: 'Implants' },
  { code: '730', title: 'Oral Medicine, Oral Diagnosis, Oral Pathology' },
  { code: '750', title: 'Special Patient Care' },
  { code: '770', title: 'Self-Improvement' },
  { code: '780', title: 'Esthetics/Cosmetic Dentistry' },
];

export const getAGDTitle = (code: string): string =>
  AGD_CATEGORIES.find((c) => c.code === code)?.title ?? code;
