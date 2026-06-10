import moment from 'moment';

export type ServiceCategory = {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  providerCount: number;
  gradient: [string, string];
  image?: number;
};

export type ProviderReview = {
  id: string;
  authorName: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  verified: boolean;
  helpful: number;
};

export type HomeProvider = {
  id: string;
  categoryId: string;
  name: string;
  businessName: string;
  rating: number;
  reviewCount: number;
  experienceYears: number;
  location: string;
  distance: string;
  verified: boolean;
  avatarInitial: string;
  specialties: string[];
  startingPrice: number;
  about?: string;
  highlights?: string[];
  availability?: {
    nextAvailableText: string;
    workingDays: string[];
    workingHours: string;
    avgVisitDurationMins: number;
  };
  serviceAreas?: string[];
  certifications?: string[];
  languages?: string[];
  responseTimeMinutes?: number;
  cancellationPolicy?: string;
  totalServices?: number;
  acceptedInsurance?: string[];
  reviews?: ProviderReview[];
};

export type HomeServiceOffering = {
  id: string;
  providerId: string;
  name: string;
  description: string;
  duration: string;
  price: number;
  popular?: boolean;
  includes: string[];
};

export type MockFamilyMember = {
  id: string;
  firstname: string;
  lastname: string;
  relationship: string;
  mobile: string;
  age: number;
  gender: string;
  bgColor: string;
  textColor: string;
};

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'physio',
    name: 'Physiotherapy',
    emoji: '🩺',
    tagline: 'Recovery & mobility at your doorstep',
    providerCount: 12,
    gradient: ['#0F4C81', '#1B6CA8'],
    image: require('../assets/physio.jpg'),
  },
  {
    id: 'nursing',
    name: 'Nursing Care',
    emoji: '💉',
    tagline: 'Skilled nurses for daily care & recovery',
    providerCount: 8,
    gradient: ['#0D5C4B', '#1A8F6E'],
    image: require('../assets/nursing.jpg'),
  },
  {
    id: 'elder',
    name: 'Elder Care',
    emoji: '🤝',
    tagline: 'Compassionate support for seniors',
    providerCount: 6,
    gradient: ['#5B3E8C', '#8B5FBF'],
  },
  {
    id: 'lab',
    name: 'Lab at Home',
    emoji: '🧪',
    tagline: 'Sample collection without clinic visits',
    providerCount: 5,
    gradient: ['#8B3A2A', '#C45C3E'],
  },
];

export const HOME_PROVIDERS: HomeProvider[] = [
  {
    id: 'p1',
    categoryId: 'physio',
    name: 'Dr. Ananya Reddy',
    businessName: 'MoveWell Physio Clinic',
    rating: 4.9,
    reviewCount: 214,
    experienceYears: 9,
    location: 'Banjara Hills, Hyderabad',
    distance: '2.4 km',
    verified: true,
    avatarInitial: 'A',
    specialties: ['Sports injury', 'Post-surgery rehab'],
    startingPrice: 699,
    about:
      'Senior physiotherapist focused on sports injuries and post-operative rehabilitation. Sessions are personalized with measurable weekly goals and a simple home exercise plan.',
    highlights: ['Certified expert', 'Equipment-assisted rehab', 'Follow-up exercise plan'],
    availability: {
      nextAvailableText: 'Today · 3 slots available',
      workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      workingHours: '09:00 AM – 07:00 PM',
      avgVisitDurationMins: 45,
    },
    serviceAreas: ['Banjara Hills', 'Jubilee Hills', 'Madhapur', 'Gachibowli'],
    certifications: ['BPT (Bachelor of Physiotherapy)', 'Advanced Sports Physio', 'Ortho Specialist'],
    languages: ['English', 'Hindi', 'Telugu'],
    responseTimeMinutes: 5,
    cancellationPolicy: 'Free cancellation up to 2 hours before appointment',
    totalServices: 342,
    acceptedInsurance: ['Apollo Health', 'Max Bupa', 'HDFC Ergo'],
    reviews: [
      {
        id: 'r1',
        authorName: 'Rajesh Kumar',
        rating: 5,
        title: 'Excellent service and professional approach',
        comment: 'Dr. Ananya was very professional and attentive. She took time to understand my knee injury and provided a detailed recovery plan. Highly recommend!',
        date: '2024-05-20',
        verified: true,
        helpful: 23,
      },
      {
        id: 'r2',
        authorName: 'Priya Sharma',
        rating: 5,
        title: 'Amazing results in just 2 weeks',
        comment: 'Started with severe back pain, but after her therapy sessions, I feel 70% better. The exercises she taught are easy to do at home.',
        date: '2024-05-15',
        verified: true,
        helpful: 18,
      },
      {
        id: 'r3',
        authorName: 'Amit Patel',
        rating: 4,
        title: 'Very knowledgeable but a bit pricey',
        comment: 'Great expertise and effective sessions. Would have given 5 stars but the pricing is higher than other providers. Still worth it for the quality.',
        date: '2024-05-10',
        verified: true,
        helpful: 12,
      },
    ],
  },
  {
    id: 'p2',
    categoryId: 'physio',
    name: 'Dr. Karthik Menon',
    businessName: 'FlexCare Home Physio',
    rating: 4.8,
    reviewCount: 156,
    experienceYears: 11,
    location: 'Jubilee Hills, Hyderabad',
    distance: '3.1 km',
    verified: true,
    avatarInitial: 'K',
    specialties: ['Back pain', 'Neuro rehab'],
    startingPrice: 799,
    about:
      'Specialized in spine care, back pain, and neuro rehabilitation. Uses safe mobilization techniques and progressive strengthening.',
    highlights: ['Spine specialist', 'Posture correction', 'Gentle neuro rehab'],
    availability: {
      nextAvailableText: 'Tomorrow · Morning slots',
      workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sun'],
      workingHours: '08:00 AM – 06:00 PM',
      avgVisitDurationMins: 50,
    },
    serviceAreas: ['Jubilee Hills', 'Banjara Hills', 'Hitech City'],
    certifications: ['BPT', 'Neuro Rehabilitation Specialist', 'AAPT Certified'],
    languages: ['English', 'Hindi', 'Malayalam'],
    responseTimeMinutes: 8,
    cancellationPolicy: 'Free cancellation up to 1 hour before appointment',
    totalServices: 298,
    acceptedInsurance: ['Apollo Health', 'Aditya Birla Health'],
    reviews: [
      {
        id: 'r4',
        authorName: 'Deepak Singh',
        rating: 5,
        title: 'Perfect for back problems',
        comment: 'Was suffering from chronic back pain for 3 years. Dr. Karthik\'s specialized approach has helped tremendously. Definitely worth trying!',
        date: '2024-05-18',
        verified: true,
        helpful: 31,
      },
      {
        id: 'r5',
        authorName: 'Anjali Nair',
        rating: 4,
        title: 'Good but sessions can be long',
        comment: 'Very thorough and knowledgeable. Sessions sometimes go longer than scheduled, but the care is top-notch.',
        date: '2024-05-12',
        verified: true,
        helpful: 15,
      },
    ],
  },
  {
    id: 'p3',
    categoryId: 'physio',
    name: 'Dr. Priya Sharma',
    businessName: 'HealAtHome Physiotherapy',
    rating: 4.7,
    reviewCount: 98,
    experienceYears: 7,
    location: 'Gachibowli, Hyderabad',
    distance: '5.2 km',
    verified: true,
    avatarInitial: 'P',
    specialties: ['Pediatric physio', 'Geriatric care'],
    startingPrice: 649,
    about:
      'Focused on gentle physiotherapy for seniors and pediatric cases. Sessions emphasize safety, consistency, and family guidance.',
    highlights: ['Senior-friendly', 'Kids-friendly', 'Family guidance'],
    availability: {
      nextAvailableText: 'Today · Evening slots',
      workingDays: ['Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      workingHours: '11:00 AM – 08:00 PM',
      avgVisitDurationMins: 40,
    },
    serviceAreas: ['Gachibowli', 'Kondapur', 'Madhapur'],
    certifications: ['BPT', 'Pediatric Specialist', 'Geriatric Rehabilitation'],
    languages: ['English', 'Hindi', 'Bengali'],
    responseTimeMinutes: 10,
    cancellationPolicy: 'Free cancellation up to 3 hours before appointment',
    totalServices: 156,
    acceptedInsurance: ['Star Health', 'Care Health'],
    reviews: [
      {
        id: 'r6',
        authorName: 'Meera Reddy',
        rating: 5,
        title: 'Great with elderly patients',
        comment: 'My grandmother was very comfortable with Dr. Priya. She has a gentle approach and explains everything clearly. Highly recommended for seniors!',
        date: '2024-05-16',
        verified: true,
        helpful: 22,
      },
    ],
  },
  {
    id: 'n1',
    categoryId: 'nursing',
    name: 'Sister Meena Thomas',
    businessName: 'CareNest Nursing Services',
    rating: 4.9,
    reviewCount: 187,
    experienceYears: 12,
    location: 'Madhapur, Hyderabad',
    distance: '1.8 km',
    verified: true,
    avatarInitial: 'M',
    specialties: ['Wound care', 'IV therapy'],
    startingPrice: 899,
    certifications: ['RN (Registered Nurse)', 'ICU Certified', 'Wound Management Specialist'],
    languages: ['English', 'Hindi', 'Marathi'],
    responseTimeMinutes: 3,
    cancellationPolicy: 'Free cancellation up to 1 hour before appointment',
    totalServices: 421,
    acceptedInsurance: ['Apollo Health', 'Max Bupa', 'HDFC Ergo', 'ICICI Prudential'],
    reviews: [
      {
        id: 'r7',
        authorName: 'Suresh Kumar',
        rating: 5,
        title: 'Trustworthy and professional',
        comment: 'Sister Meena took excellent care during my wife\'s post-surgery recovery. Very gentle and attentive. We felt completely confident in her hands.',
        date: '2024-05-19',
        verified: true,
        helpful: 45,
      },
      {
        id: 'r8',
        authorName: 'Mrs. Neha Gupta',
        rating: 5,
        title: 'Excellent wound care',
        comment: 'The wound infection cleared up quickly under her care. She is meticulous with sterilization and instructions.',
        date: '2024-05-14',
        verified: true,
        helpful: 28,
      },
    ],
  },
  {
    id: 'n2',
    categoryId: 'nursing',
    name: 'Sister Lakshmi Rao',
    businessName: 'HomeNurse Pro',
    rating: 4.8,
    reviewCount: 142,
    experienceYears: 10,
    location: 'Kondapur, Hyderabad',
    distance: '4.0 km',
    verified: true,
    avatarInitial: 'L',
    specialties: ['Post-op care', 'Elder support'],
    startingPrice: 849,
    certifications: ['RN', 'Post-operative Care Specialist', 'Geriatric Nursing'],
    languages: ['English', 'Hindi', 'Telugu', 'Kannada'],
    responseTimeMinutes: 6,
    cancellationPolicy: 'Free cancellation up to 2 hours before appointment',
    totalServices: 298,
    acceptedInsurance: ['Apollo Health', 'Aditya Birla Health'],
    reviews: [
      {
        id: 'r9',
        authorName: 'Dr. Vikram Prasad',
        rating: 5,
        title: 'Best nursing care provider',
        comment: 'Professional, experienced, and very caring. She took charge of my father\'s post-surgery care and coordinated well with doctors.',
        date: '2024-05-17',
        verified: true,
        helpful: 19,
      },
    ],
  },
  {
    id: 'e1',
    categoryId: 'elder',
    name: 'Ravi Kumar',
    businessName: 'GoldenYears Care',
    rating: 4.8,
    reviewCount: 76,
    experienceYears: 8,
    location: 'Secunderabad',
    distance: '6.5 km',
    verified: true,
    avatarInitial: 'R',
    specialties: ['Mobility assist', 'Medication reminders'],
    startingPrice: 599,
    certifications: ['Geriatric Care Specialist', 'Safety Training', 'First Aid CPR'],
    languages: ['English', 'Hindi', 'Telugu'],
    responseTimeMinutes: 12,
    cancellationPolicy: 'Free cancellation up to 4 hours before appointment',
    totalServices: 189,
    acceptedInsurance: ['Care Health', 'Religare'],
    reviews: [
      {
        id: 'r10',
        authorName: 'Anita Menon',
        rating: 5,
        title: 'Wonderful companion for our mother',
        comment: 'Ravi is patient, kind, and very attentive. Our 80-year-old mother looks forward to his visits. We feel she\'s in safe hands.',
        date: '2024-05-11',
        verified: true,
        helpful: 16,
      },
    ],
  },
  {
    id: 'l1',
    categoryId: 'lab',
    name: 'Vydhyo Diagnostics',
    businessName: 'Vydhyo Lab Collection',
    rating: 4.9,
    reviewCount: 320,
    experienceYears: 5,
    location: 'Hitech City, Hyderabad',
    distance: '3.8 km',
    verified: true,
    avatarInitial: 'V',
    specialties: ['Full body panel', 'Diabetes monitoring'],
    startingPrice: 499,
    certifications: ['NABL Accredited', 'CAP Certified', 'ISO 15189:2022'],
    languages: ['English', 'Hindi', 'Telugu'],
    responseTimeMinutes: 2,
    cancellationPolicy: 'Free cancellation up to 30 minutes before appointment',
    totalServices: 2145,
    acceptedInsurance: ['All major insurers accepted'],
    reviews: [
      {
        id: 'r11',
        authorName: 'Sanjay Iyer',
        rating: 5,
        title: 'Quick, accurate, and convenient',
        comment: 'Home sample collection was done efficiently. Reports came in 24 hours with detailed interpretation. Excellent service!',
        date: '2024-05-21',
        verified: true,
        helpful: 67,
      },
      {
        id: 'r12',
        authorName: 'Mrs. Fatima Khan',
        rating: 5,
        title: 'Best lab service in the city',
        comment: 'Very professional phlebotomists, sterile procedure, and accurate reports. Have been using their services for 2 years now.',
        date: '2024-05-13',
        verified: true,
        helpful: 52,
      },
    ],
  },
];

export const HOME_SERVICE_OFFERINGS: HomeServiceOffering[] = [
  {
    id: 's1',
    providerId: 'p1',
    name: 'Initial Assessment Session',
    description: 'Comprehensive mobility assessment and personalized care plan.',
    duration: '45 mins',
    price: 699,
    popular: true,
    includes: ['Posture analysis', 'Exercise plan', 'Progress notes'],
  },
  {
    id: 's2',
    providerId: 'p1',
    name: 'Follow-up Therapy',
    description: 'Targeted therapy for ongoing recovery and pain relief.',
    duration: '40 mins',
    price: 599,
    includes: ['Manual therapy', 'Guided exercises', 'Home program'],
  },
  {
    id: 's3',
    providerId: 'p1',
    name: 'Sports Injury Rehab Pack',
    description: '3-session pack for acute sports-related injuries.',
    duration: '3 × 45 mins',
    price: 1899,
    includes: ['3 home visits', 'Taping support', 'WhatsApp follow-up'],
  },
  {
    id: 's4',
    providerId: 'p2',
    name: 'Back & Neck Relief Session',
    description: 'Focused session for chronic back and neck stiffness.',
    duration: '50 mins',
    price: 799,
    popular: true,
    includes: ['Spinal mobilization', 'Ergonomic tips', 'Stretch routine'],
  },
  {
    id: 's5',
    providerId: 'p2',
    name: 'Neuro Rehabilitation Visit',
    description: 'Specialized rehab for stroke and neuro conditions.',
    duration: '55 mins',
    price: 999,
    includes: ['Balance training', 'Gait practice', 'Caregiver guidance'],
  },
  {
    id: 's6',
    providerId: 'p3',
    name: 'Senior Mobility Session',
    description: 'Gentle therapy designed for elderly patients at home.',
    duration: '40 mins',
    price: 649,
    includes: ['Fall prevention', 'Strength exercises', 'Family briefing'],
  },
  {
    id: 's7',
    providerId: 'n1',
    name: 'General Nursing Visit',
    description: 'Routine nursing care including vitals and medication.',
    duration: '60 mins',
    price: 899,
    popular: true,
    includes: ['Vitals check', 'Medication admin', 'Care documentation'],
  },
  {
    id: 's8',
    providerId: 'n1',
    name: 'Wound Dressing Care',
    description: 'Sterile wound cleaning and dressing by certified nurse.',
    duration: '45 mins',
    price: 749,
    includes: ['Wound assessment', 'Dressing change', 'Infection watch'],
  },
  {
    id: 's9',
    providerId: 'n2',
    name: 'Post-Surgery Nursing Care',
    description: 'Dedicated nursing support during early recovery phase.',
    duration: '90 mins',
    price: 1299,
    includes: ['Drain care', 'Pain monitoring', 'Doctor coordination'],
  },
  {
    id: 's10',
    providerId: 'e1',
    name: 'Daily Elder Companion Visit',
    description: 'Assistance with daily activities and companionship.',
    duration: '2 hours',
    price: 599,
    includes: ['Meal assist', 'Light exercises', 'Safety check'],
  },
  {
    id: 's11',
    providerId: 'l1',
    name: 'Basic Health Checkup Panel',
    description: 'Home sample collection for essential health markers.',
    duration: '30 mins',
    price: 499,
    popular: true,
    includes: ['CBC', 'Sugar', 'Lipid profile', 'Digital report'],
  },
  {
    id: 's12',
    providerId: 'l1',
    name: 'Diabetes Monitoring Pack',
    description: 'HbA1c and fasting glucose collection at home.',
    duration: '25 mins',
    price: 699,
    includes: ['Sample collection', 'Report in 24 hrs', 'Diet tips PDF'],
  },
];

export const MOCK_FAMILY_MEMBERS: MockFamilyMember[] = [
  {
    id: 'f1',
    firstname: 'Rajesh',
    lastname: 'Kumar',
    relationship: 'Father',
    mobile: '+91 98765 43210',
    age: 58,
    gender: 'Male',
    bgColor: '#E8F4FD',
    textColor: '#1E40AF',
  },
  {
    id: 'f2',
    firstname: 'Sunita',
    lastname: 'Kumar',
    relationship: 'Mother',
    mobile: '+91 98765 43211',
    age: 54,
    gender: 'Female',
    bgColor: '#FCE7F3',
    textColor: '#9D174D',
  },
];

export function getCategoryById(id: string): ServiceCategory | undefined {
  return SERVICE_CATEGORIES.find(c => c.id === id);
}

export function getProvidersByCategory(categoryId: string): HomeProvider[] {
  return HOME_PROVIDERS.filter(p => p.categoryId === categoryId);
}

export function getProviderById(id: string): HomeProvider | undefined {
  return HOME_PROVIDERS.find(p => p.id === id);
}

export function getOfferingsByProvider(providerId: string): HomeServiceOffering[] {
  return HOME_SERVICE_OFFERINGS.filter(s => s.providerId === providerId);
}

export function getOfferingById(id: string): HomeServiceOffering | undefined {
  return HOME_SERVICE_OFFERINGS.find(s => s.id === id);
}

/** Mock time slots for a given date */
export function getMockSlotsForDate(date: string): { time: string; available: boolean }[] {
  const isToday = moment().isSame(date, 'day');
  const now = moment();
  const allSlots = [
    '09:00 AM',
    '10:00 AM',
    '11:30 AM',
    '02:00 PM',
    '03:30 PM',
    '05:00 PM',
    '06:30 PM',
  ];

  return allSlots
    .map(time => {
      if (!isToday) return { time, available: true };
      const slotMoment = moment(`${date} ${time}`, 'YYYY-MM-DD hh:mm A');
      return {
        time,
        available: slotMoment.isAfter(moment().add(30, 'minutes')),
      };
    })
    .filter(s => s.available);
}

export type HomeServiceBookingContext = {
  category: ServiceCategory;
  provider: HomeProvider;
  service: HomeServiceOffering;
  date: string;
  time: string;
  reason?: string;
  patient?: {
    userId?: string;
    firstname: string;
    lastname?: string;
    name?: string;
    relationship?: string;
    mobile?: string;
    age?: number;
    gender?: string;
  };
  address?: {
    building: string;
    floorFlat?: string;
    street: string;
    landmark?: string;
    pincode: string;
    cityState: string;
  };
};
