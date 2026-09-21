import { ALL_54_STATES } from './statesData';

export interface MajorCategory {
  category: string;
  majors: string[];
}

export const CATEGORIZED_MAJORS: MajorCategory[] = [
  {
    category: 'Most Popular & High Demand',
    majors: [
      'Computer Science',
      'Business Administration',
      'Finance',
      'Biology / Pre-Med',
      'Nursing',
      'Psychology',
      'Mechanical Engineering',
      'Economics',
      'Political Science / Pre-Law',
      'Marketing',
      'Communications & Media',
      'Undeclared / Exploring',
    ],
  },
  {
    category: 'STEM & Engineering',
    majors: [
      'Aerospace Engineering',
      'Biomedical Engineering',
      'Chemical Engineering',
      'Civil Engineering',
      'Computer Engineering',
      'Data Science & Analytics',
      'Electrical Engineering',
      'Environmental Engineering',
      'Industrial Engineering',
      'Information Technology / Cybersecurity',
      'Mathematics / Applied Math',
      'Physics / Astrophysics',
      'Robotics & AI',
      'Software Engineering',
    ],
  },
  {
    category: 'Health & Biological Sciences',
    majors: [
      'Biochemistry',
      'Exercise Science / Kinesiology',
      'Health Sciences / Public Health',
      'Microbiology',
      'Molecular & Cellular Biology',
      'Neuroscience / Cognitive Science',
      'Pharmacy / Pre-Pharm',
      'Physical Therapy / Pre-PT',
      'Veterinary Medicine / Pre-Vet',
    ],
  },
  {
    category: 'Business, Finance & Law',
    majors: [
      'Accounting',
      'Business Analytics',
      'Entrepreneurship',
      'Human Resource Management',
      'International Business',
      'Management Information Systems (MIS)',
      'Real Estate & Urban Development',
      'Supply Chain & Operations',
    ],
  },
  {
    category: 'Social Sciences & Humanities',
    majors: [
      'Anthropology',
      'Criminal Justice / Criminology',
      'English & Creative Writing',
      'History',
      'International Relations / Global Studies',
      'Philosophy',
      'Public Policy',
      'Sociology',
    ],
  },
  {
    category: 'Arts, Architecture & Communications',
    majors: [
      'Architecture',
      'Art History',
      'Cinema / Film Production',
      'Digital Media & Game Design',
      'Fine Arts / Studio Art',
      'Graphic Design / UX Design',
      'Journalism & Broadcasting',
      'Music / Music Production',
      'Public Relations / Advertising',
      'Theatre / Performing Arts',
    ],
  },
  {
    category: 'Education & Environment',
    majors: [
      'Agricultural Sciences',
      'Early Childhood Education',
      'Elementary / Secondary Education',
      'Environmental Science & Policy',
      'Special Education',
    ],
  },
];

export const ALL_FLAT_MAJORS = Array.from(
  new Set(CATEGORIZED_MAJORS.flatMap((c) => c.majors))
).sort();

export const POPULAR_HOMETOWN_HUBS = [
  'Atlanta, GA',
  'Austin, TX',
  'Boston, MA',
  'Charlotte, NC',
  'Chicago, IL',
  'Dallas, TX',
  'Denver, CO',
  'Houston, TX',
  'Los Angeles, CA',
  'Miami, FL',
  'Nashville, TN',
  'New York, NY',
  'Philadelphia, PA',
  'Phoenix, AZ',
  'San Diego, CA',
  'San Francisco, CA',
  'Seattle, WA',
  'Washington, DC',
  'International / Outside US',
];

export { ALL_54_STATES };
