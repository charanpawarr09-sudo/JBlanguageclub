export type EventCategory = 'Technical' | 'Cultural' | 'Gaming' | 'Workshop' | 'Literary' | 'Management' | 'Formal' | 'Informal' | 'Ceremony';

export interface EventCoordinator {
  name: string;
  phone: string;
  role: string;
}

export interface Round {
  title: string;
  description: string;
  fee?: number;
}

export interface VoxeraEvent {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  date: string;
  time: string;
  location: string;
  category: EventCategory;
  image: string;
  rules: string[];
  teamSize: string;
  prize: string;
  rounds?: Round[];

  // Fee & registration fields
  registration_fee_single: number;
  registration_fee_team: number | null;
  team_size_min: number;
  team_size_max: number;
  registration_enabled: boolean;
  is_published: boolean;
  google_form_url: string | null;
  slots_total: number | null;
  slots_filled: number;
  judging_criteria: string[];

  // Extended fields
  coordinators: EventCoordinator[];
  banner_image: string;
  thumbnail_image: string;
}

export const events: VoxeraEvent[] = [
  {
    id: 'debate-competition',
    title: 'Debate Competition',
    shortDescription: 'Voice your opinion and win the argument.',
    description: 'Words have power — and at VOXERA, we turn opinions into impact. The Debate Competition at VOXERA is a dynamic platform where ideas clash, perspectives evolve, and voices rise with confidence. Whether you\'re a seasoned debater or a first-time orator, this is your stage to speak truth to power and challenge the status quo. Compete across 3 intense rounds on thought-provoking topics that matter today.',
    date: 'March 16, 2026',
    time: '10:00 AM - 1:00 PM',
    location: 'Seminar Hall',
    category: 'Literary',
    image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80',
    banner_image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1600&q=80',
    thumbnail_image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=400&q=80',
    rules: [
      'Participants must strictly follow the allocated time limit for each speaking slot.',
      'Respectful conduct toward judges, opponents, and audience is mandatory at all times.',
      'Use of mobile phones or internet resources during the preparation/speaking period is prohibited.',
      'Topics will be disclosed 15 minutes before each round commences.',
      'Judges\' decision is final and binding. No appeals will be entertained.',
      'Participants must be present at the venue 15 minutes before the scheduled start time.',
      'Late arrivals may be disqualified at the discretion of the organizing committee.'
    ],
    teamSize: '1-2',
    prize: 'Exciting Gifts + Certificate',
    rounds: [
      { title: 'Round 1 — Preliminary', description: 'Is Gen Z More Socially Responsible Than Millennials? Individual judging; top performers advance to the next round.' },
      { title: 'Round 2 — Semi-Final', description: 'Is Media Still the Fourth Pillar of Democracy? Elevated difficulty; evaluated on argumentation depth and rebuttals.' },
      { title: 'Round 3 — Grand Finale', description: 'Is Marriage Becoming Obsolete in Modern Society? Championship round with the full judging panel.' }
    ],
    registration_fee_single: 99,
    registration_fee_team: 150,
    team_size_min: 1,
    team_size_max: 2,
    registration_enabled: true,
    is_published: true,
    google_form_url: 'https://forms.gle/Tu7nF2xuPe6bGG1aA',
    slots_total: null,
    slots_filled: 0,
    judging_criteria: ['Confidence & Stage Presence', 'Clarity of Thought', 'Speaking Skills', 'Critical Thinking', 'Logical Reasoning', 'Rebuttals', 'Time Management', 'Overall Impact'],
    coordinators: []
  },
  {
    id: 'poetry-reciting',
    title: 'Poetry Reciting Competition',
    shortDescription: 'Express your emotions through verse.',
    description: 'An event for the poets and dreamers. Recite your original work or a classic piece and captivate the audience with the power of words.',
    date: 'March 16, 2026',
    time: '2:00 PM - 4:00 PM',
    location: 'Main Auditorium',
    category: 'Literary',
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80',
    banner_image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1600&q=80',
    thumbnail_image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=400&q=80',
    rules: [
      'Individual participation only.',
      'Time limit: 5 minutes per recitation.',
      'Original compositions preferred.',
      'Language: English or Local.'
    ],
    teamSize: 'Individual',
    prize: 'Exciting Gifts + Certificate',
    registration_fee_single: 99,
    registration_fee_team: null,
    team_size_min: 1,
    team_size_max: 1,
    registration_enabled: true,
    is_published: true,
    google_form_url: 'https://forms.gle/gRye4xaCtEpuXWLc7',
    slots_total: null,
    slots_filled: 0,
    judging_criteria: ['Expression & Emotion', 'Voice Modulation', 'Content Quality', 'Stage Presence', 'Audience Engagement'],
    coordinators: []
  },
  {
    id: 'pitch-perfect',
    title: 'Pitch Perfect',
    shortDescription: 'Showcase your startup idea.',
    description: 'Got a billion-dollar idea? Pitch your startup concept to a panel of investors and experts. Showcase your vision, business acumen, and presentation skills.',
    date: 'March 16, 2026',
    time: '4:30 PM - 7:00 PM',
    location: 'Conference Room',
    category: 'Management',
    image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80',
    banner_image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1600&q=80',
    thumbnail_image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=400&q=80',
    rules: [
      'Time limit: 10 minutes per pitch.',
      'Presentation deck required.',
      'Q&A session included after pitch.',
      'Teams of up to 4 members allowed.'
    ],
    teamSize: '1-4',
    prize: 'Exciting Gifts + Certificate',
    registration_fee_single: 50,
    registration_fee_team: 50,
    team_size_min: 1,
    team_size_max: 4,
    registration_enabled: true,
    is_published: true,
    google_form_url: 'https://forms.gle/B5xCvuGFv33ZDaS8A',
    slots_total: null,
    slots_filled: 0,
    judging_criteria: ['Innovation & Uniqueness', 'Business Viability', 'Presentation Quality', 'Market Understanding', 'Team Capability'],
    coordinators: []
  },
  {
    id: 'open-mic',
    title: 'Open Mic',
    shortDescription: 'Stand-up, music, poetry — the stage is yours.',
    description: 'A free-for-all platform to showcase your hidden talents. Comedy, music, storytelling — anything goes! Step up and own the spotlight.',
    date: 'March 17, 2026',
    time: '10:00 AM - 1:00 PM',
    location: 'Open Air Theatre',
    category: 'Cultural',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
    banner_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1600&q=80',
    thumbnail_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=400&q=80',
    rules: [
      'Time limit: 5 minutes per act.',
      'No offensive or inappropriate content.',
      'First come, first serve registration.',
      'Solo or duo performances allowed.'
    ],
    teamSize: '1-2',
    prize: 'Goodies + Certificate',
    registration_fee_single: 99,
    registration_fee_team: 150,
    team_size_min: 1,
    team_size_max: 2,
    registration_enabled: true,
    is_published: true,
    google_form_url: 'https://forms.gle/eKtGg9opFuhR4sm2A',
    slots_total: null,
    slots_filled: 0,
    judging_criteria: ['Talent & Skill', 'Stage Presence', 'Audience Engagement', 'Creativity', 'Overall Entertainment'],
    coordinators: []
  },
  {
    id: 'treasure-hunt',
    title: 'Treasure Hunt',
    shortDescription: 'Solve clues and find the hidden treasure.',
    description: 'An exciting campus-wide hunt. Solve riddles, complete tasks, and race against time to find the ultimate treasure. Team up and put your puzzle-solving skills to the test!',
    date: 'March 17, 2026',
    time: '2:00 PM - 5:00 PM',
    location: 'Campus Grounds',
    category: 'Informal',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
    banner_image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1600&q=80',
    thumbnail_image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&q=80',
    rules: [
      'Individual participation only.',
      'Do not damage campus property.',
      'Follow the clue trail strictly.',
      'No external help or internet access allowed.'
    ],
    teamSize: '1',
    prize: 'Exciting Gifts + Certificate',
    registration_fee_single: 120,
    registration_fee_team: 120,
    team_size_min: 1,
    team_size_max: 1,
    registration_enabled: true,
    is_published: true,
    google_form_url: null, // TODO: Add Google Form URL when available
    slots_total: null,
    slots_filled: 0,
    judging_criteria: ['Speed', 'Accuracy', 'Teamwork', 'Problem Solving'],
    coordinators: []
  },
  {
    id: 'film-screening',
    title: 'Film Screening',
    shortDescription: 'Three iconic films. One unforgettable experience. Grab your popcorn.',
    description: 'VOXERA presents an exclusive Film Screening event — a cinematic journey featuring three carefully curated films that celebrate friendship, ambition, and the power of thinking differently. Sit back, relax, and let the magic of cinema inspire you.',
    date: 'March 17, 2026',
    time: '1:00 PM - 7:00 PM',
    location: 'Main Auditorium',
    category: 'Cultural',
    image: 'https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?auto=format&fit=crop&w=800&q=80',
    banner_image: 'https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?auto=format&fit=crop&w=1600&q=80',
    thumbnail_image: 'https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?auto=format&fit=crop&w=400&q=80',
    rules: [
      'Entry is on a first-come, first-served basis.',
      'Maintain silence during screenings.',
      'No recording or photography during the films.',
      'Discussion sessions may follow each screening.',
      'Food and beverages may be available at the venue.'
    ],
    teamSize: 'Individual',
    prize: 'An Unforgettable Experience',
    rounds: [
      { title: '🎬 Screening 1 — Chhichhore', description: 'A heartwarming Bollywood blockbuster that celebrates friendship, failure, and the spirit of never giving up. Relive the hostel days and learn that losers of today are the winners of tomorrow.', fee: 50 },
      { title: '🎬 Screening 2 — Dead Poets Society', description: 'A timeless classic starring Robin Williams. A story about seizing the day, thinking for yourself, and the transformative power of poetry and education. "Carpe Diem!"', fee: 50 },
      { title: '🎬 Screening 3 — To Be Announced', description: 'The final film is a surprise! Stay tuned — we\'re saving the best reveal for last. Follow our socials for the big announcement.', fee: 50 }
    ],
    registration_fee_single: 80,
    registration_fee_team: null,
    team_size_min: 1,
    team_size_max: 1,
    registration_enabled: true,
    is_published: true,
    google_form_url: null,
    slots_total: null,
    slots_filled: 0,
    judging_criteria: [],
    coordinators: []
  }
];
