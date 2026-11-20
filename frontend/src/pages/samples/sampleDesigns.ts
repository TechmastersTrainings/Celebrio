/**
 * Sample invitation designs shown on /designs and rendered live at /sample/:slug.
 * All names are illustrative samples (each page is labelled "Sample design");
 * venues are real halls from our Bidar directory so the map links work.
 */

export type Motif = 'royal' | 'temple' | 'floral' | 'rings' | 'cradle' | 'confetti' | 'kalash' | 'jubilee' | 'lotus' | 'diya';

export interface SampleEvent {
  name: string;
  date: string; // ISO date
  time: string; // display
  venue: string;
  note?: string;
}

export interface SampleDesign {
  slug: string;
  title: string; // design name
  occasionSlug: string; // catalog occasion
  collection: string; // gallery filter
  aesthetic: string;
  motif: Motif;
  description: string;
  tags: string[];
  theme: {
    bg: string; // page background
    bg2: string; // section alt background
    surface: string; // cards
    ink: string; // headings
    text: string; // body
    accent: string; // gold / primary accent
    accent2: string; // secondary accent
    gate: string; // opening gate gradient
  };
  invocation?: string; // blessing line at the top
  kicker: string;
  names: string[]; // 1 or 2 names
  joiner?: string; // between names
  subtitle: string;
  message: string;
  date: string; // ISO datetime of the main event
  venue: { name: string; address: string };
  events: SampleEvent[];
  families?: { title: string; names: string }[];
  hashtag?: string;
  photos: string[];
  rsvpBy: string;
}

const photo = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=72`;
const P = {
  wedding1: photo('photo-1583939003579-730e3918a45a'),
  wedding2: photo('photo-1519741497674-611481863552'),
  wedding3: photo('photo-1511285560929-80b456fea0bc'),
  palace: photo('photo-1545232979-8bf68ee9b1af'),
  engagement: photo('photo-1532712938310-34cb3982ef74'),
  anniversary: photo('photo-1534447677768-be436bb09401'),
  baby: photo('photo-1519689680058-324335c77eba'),
  birthday: photo('photo-1530103862676-de8c9debad1d'),
  diya: photo('photo-1577083753695-e010191bacb5'),
};

const BELDALE = { name: 'Beldale Convention Hall', address: 'Udgir Road, Naubad, Bidar, Karnataka' };
const JHIRA = { name: 'Jhira Convention Hall', address: 'Janwada Road, Nawadgeri, Bidar, Karnataka' };
const SHETKAR = { name: 'Shetkar Convention Hall', address: 'Manhalli Road, Gumpa, Bidar, Karnataka' };
const SALAM = { name: 'Salam Function Palace', address: 'Ring Road, Hanuman Nagar, Bidar, Karnataka' };
const PARVATI = { name: 'Parvati Convention Hall', address: 'Bhalki Road, Naubad, Bidar, Karnataka' };

export const SAMPLE_DESIGNS: SampleDesign[] = [
  {
    slug: 'royal-maroon-vivaha',
    title: 'Royal Maroon Vivaha',
    occasionSlug: 'marriage',
    collection: 'Wedding',
    aesthetic: 'Royal Heritage',
    motif: 'royal',
    description: 'Velvet maroon and antique gold with a tap-to-open door reveal, mandala artwork, and a full multi-day wedding itinerary.',
    tags: ['Tap-to-Open Reveal', 'Multi-Day Events', 'Countdown', 'RSVP'],
    theme: { bg: '#2a0710', bg2: '#3a0b17', surface: 'rgba(255,240,214,0.06)', ink: '#f6dfae', text: '#ecd9c6', accent: '#d4af37', accent2: '#b5543a', gate: 'radial-gradient(circle at 50% 40%, #6b1728 0%, #3a0b17 55%, #1a040a 100%)' },
    invocation: '॥ ಶ್ರೀ ಗಣೇಶಾಯ ನಮಃ ॥',
    kicker: 'Together with their families',
    names: ['Aditi', 'Srihari'],
    joiner: 'weds',
    subtitle: 'request the honour of your presence as they begin their journey together',
    message: 'With the blessings of the elders, we joyfully invite you and your family to grace the wedding celebrations and shower your blessings upon the couple.',
    date: '2027-02-12T10:42:00+05:30',
    venue: BELDALE,
    events: [
      { name: 'Haldi', date: '2027-02-10', time: '10:00 AM', venue: 'Bride’s Residence, Bidar', note: 'Dress code: shades of yellow' },
      { name: 'Mehendi & Sangeet', date: '2027-02-11', time: '5:00 PM', venue: BELDALE.name, note: 'An evening of music and dance' },
      { name: 'Muhurtham', date: '2027-02-12', time: '10:42 AM', venue: BELDALE.name, note: 'Auspicious Dhare muhurtham' },
      { name: 'Reception', date: '2027-02-12', time: '7:30 PM', venue: BELDALE.name, note: 'Dinner follows' },
    ],
    families: [
      { title: 'Bride’s Family', names: 'Smt. Sunita & Shri Ramesh Kulkarni' },
      { title: 'Groom’s Family', names: 'Smt. Geetha & Shri Anand Deshpande' },
    ],
    hashtag: '#AdiWedsSri',
    photos: [P.wedding1, P.wedding2, P.palace],
    rsvpBy: '2027-02-01',
  },
  {
    slug: 'temple-gold-kalyana',
    title: 'Temple Gold Kalyana',
    occasionSlug: 'marriage',
    collection: 'Wedding',
    aesthetic: 'South Indian Traditional',
    motif: 'temple',
    description: 'Ivory and temple gold with gopuram line-art, jasmine-white accents, and a Kannada blessing — classic Kalyana Mantapa elegance.',
    tags: ['Gopuram Art', 'Kannada Script', 'Muhurtham Timing', 'Google Maps'],
    theme: { bg: '#fbf6ea', bg2: '#f3ead2', surface: '#ffffff', ink: '#5a1414', text: '#4a3b2a', accent: '#b8862b', accent2: '#2f6b3a', gate: 'radial-gradient(circle at 50% 40%, #fff8e4 0%, #f1e2b8 60%, #d9bf7a 100%)' },
    invocation: '॥ ಶ್ರೀ ವೆಂಕಟೇಶ್ವರ ಪ್ರಸನ್ನ ॥',
    kicker: 'Shubha Vivaha',
    names: ['Ananya', 'Siddharth'],
    joiner: '&',
    subtitle: 'cordially invite you to their wedding',
    message: 'Your presence and blessings will make our celebration complete. We look forward to welcoming you to the Kalyana Mantapa.',
    date: '2027-01-24T09:15:00+05:30',
    venue: JHIRA,
    events: [
      { name: 'Varapooje', date: '2027-01-23', time: '6:00 PM', venue: JHIRA.name },
      { name: 'Muhurtham', date: '2027-01-24', time: '9:15 AM', venue: JHIRA.name, note: 'Kalyana Muhurtham' },
      { name: 'Lunch', date: '2027-01-24', time: '12:30 PM', venue: JHIRA.name, note: 'Traditional banana-leaf meal' },
    ],
    families: [
      { title: 'With blessings of', names: 'Smt. Lakshmi & Shri Venkatesh Rao' },
      { title: 'and', names: 'Smt. Padma & Shri Raghavendra Bhat' },
    ],
    hashtag: '#AnanyaSidKalyana',
    photos: [P.wedding2, P.wedding3, P.wedding1],
    rsvpBy: '2027-01-15',
  },
  {
    slug: 'pastel-mehendi-modern',
    title: 'Pastel Mehendi Modern',
    occasionSlug: 'marriage',
    collection: 'Wedding',
    aesthetic: 'Modern Pastel',
    motif: 'floral',
    description: 'Soft peach and sage with delicate florals and clean editorial typography — made for Instagram-loving couples.',
    tags: ['Instagram Ready', 'Pastel Florals', 'Photo Gallery', 'Hashtag'],
    theme: { bg: '#fff7f2', bg2: '#f6ece4', surface: '#ffffff', ink: '#6b3a3a', text: '#5b4a46', accent: '#c98b74', accent2: '#7d9a7e', gate: 'radial-gradient(circle at 50% 40%, #fff3ec 0%, #f8d9cc 60%, #e9b7a5 100%)' },
    kicker: 'Save the date',
    names: ['Natasha', 'Vikram'],
    joiner: '&',
    subtitle: 'are getting married',
    message: 'We can’t wait to celebrate with the people we love most. Join us for mehendi, music, and a whole lot of happiness.',
    date: '2027-03-06T18:30:00+05:30',
    venue: SHETKAR,
    events: [
      { name: 'Mehendi', date: '2027-03-05', time: '4:00 PM', venue: SHETKAR.name, note: 'Pastel dress code' },
      { name: 'Wedding', date: '2027-03-06', time: '6:30 PM', venue: SHETKAR.name },
      { name: 'Reception', date: '2027-03-06', time: '8:30 PM', venue: SHETKAR.name },
    ],
    hashtag: '#NatVikTieTheKnot',
    photos: [P.wedding3, P.engagement, P.wedding1],
    rsvpBy: '2027-02-25',
  },
  {
    slug: 'rosegold-ring-ceremony',
    title: 'Rose Gold Ring Ceremony',
    occasionSlug: 'engagement',
    collection: 'Engagement',
    aesthetic: 'Engagement',
    motif: 'rings',
    description: 'Blush and rose gold with interlocked rings, a live countdown, and a love-story note for the Nischitartha.',
    tags: ['Rose Gold', 'Countdown', 'Love Story'],
    theme: { bg: '#fff5f5', bg2: '#fbe7e7', surface: '#ffffff', ink: '#7a2e3a', text: '#5e4448', accent: '#c48a7a', accent2: '#b5838d', gate: 'radial-gradient(circle at 50% 40%, #fff1f0 0%, #f4cfcf 60%, #d9a3a3 100%)' },
    kicker: 'Nischitartha',
    names: ['Priya', 'Rohan'],
    joiner: '&',
    subtitle: 'are getting engaged',
    message: 'Two families, one promise. Join us as Priya and Rohan exchange rings and begin a beautiful new chapter.',
    date: '2026-12-20T11:00:00+05:30',
    venue: PARVATI,
    events: [{ name: 'Ring Ceremony', date: '2026-12-20', time: '11:00 AM', venue: PARVATI.name, note: 'Lunch follows' }],
    hashtag: '#PriyaRohanForever',
    photos: [P.engagement, P.wedding3],
    rsvpBy: '2026-12-15',
  },
  {
    slug: 'cradle-namakarana',
    title: 'Moon Cradle Namakarana',
    occasionSlug: 'naming-ceremony',
    collection: 'Naming Ceremony',
    aesthetic: 'Naming Ceremony',
    motif: 'cradle',
    description: 'Soft night-sky blue with a moon cradle, twinkling stars, and a gentle name-reveal for the little one.',
    tags: ['Name Reveal', 'Cradle Ceremony', 'Kannada & English'],
    theme: { bg: '#f3f6ff', bg2: '#e6ecfb', surface: '#ffffff', ink: '#2b3a67', text: '#46506e', accent: '#d9a441', accent2: '#7b8fd1', gate: 'radial-gradient(circle at 50% 40%, #2b3a67 0%, #1b2547 60%, #0f1530 100%)' },
    invocation: '॥ ಶ್ರೀ ಕೃಷ್ಣಾರ್ಪಣಮಸ್ತು ॥',
    kicker: 'Namakarana & Thottilu Shastra',
    names: ['Our Little One'],
    subtitle: 'is ready to receive a name and your blessings',
    message: 'With joy and gratitude, Sneha and Rajesh invite you to the naming and cradle ceremony of their baby.',
    date: '2026-12-27T10:30:00+05:30',
    venue: { name: 'Ananda Nilaya', address: 'Mailoor, Bidar, Karnataka' },
    events: [
      { name: 'Cradle Ceremony', date: '2026-12-27', time: '10:30 AM', venue: 'Ananda Nilaya' },
      { name: 'Name Reveal', date: '2026-12-27', time: '11:15 AM', venue: 'Ananda Nilaya' },
      { name: 'Lunch', date: '2026-12-27', time: '12:30 PM', venue: 'Ananda Nilaya' },
    ],
    families: [{ title: 'Proud parents', names: 'Sneha & Rajesh Patil' }],
    photos: [P.baby],
    rsvpBy: '2026-12-22',
  },
  {
    slug: 'first-birthday-confetti',
    title: 'Confetti First Birthday',
    occasionSlug: 'birthday',
    collection: 'Birthday',
    aesthetic: 'Milestone Birthday',
    motif: 'confetti',
    description: 'Bright, playful confetti with bold type, a party countdown, and cake-cutting time front and centre.',
    tags: ['Playful', 'Cake Cutting', 'Party Countdown'],
    theme: { bg: '#fffaf0', bg2: '#fff1d6', surface: '#ffffff', ink: '#c2185b', text: '#4a3b3b', accent: '#f59e0b', accent2: '#0ea5a4', gate: 'linear-gradient(135deg, #f43f5e 0%, #f59e0b 50%, #10b981 100%)' },
    kicker: 'You’re invited',
    names: ['Reyansh'],
    subtitle: 'is turning ONE!',
    message: 'Join us for cake, games, and lots of smiles as we celebrate Reyansh’s very first birthday.',
    date: '2027-01-09T18:00:00+05:30',
    venue: SALAM,
    events: [
      { name: 'Party Starts', date: '2027-01-09', time: '6:00 PM', venue: SALAM.name },
      { name: 'Cake Cutting', date: '2027-01-09', time: '7:30 PM', venue: SALAM.name },
      { name: 'Dinner', date: '2027-01-09', time: '8:00 PM', venue: SALAM.name },
    ],
    photos: [P.birthday],
    rsvpBy: '2027-01-05',
  },
  {
    slug: 'griha-pravesha-kalash',
    title: 'Mango Leaf Griha Pravesha',
    occasionSlug: 'house-warming',
    collection: 'House Warming',
    aesthetic: 'House Warming',
    motif: 'kalash',
    description: 'Saffron and mango-leaf green with a marigold toran and sacred kalash — warm and auspicious for a new home.',
    tags: ['Marigold Toran', 'Muhurtham', 'Home Directions'],
    theme: { bg: '#fffaf0', bg2: '#fdf0d5', surface: '#ffffff', ink: '#8a2c0d', text: '#4b3b2a', accent: '#e07a10', accent2: '#3f7d3a', gate: 'radial-gradient(circle at 50% 40%, #fff2cc 0%, #f7c46c 60%, #e07a10 100%)' },
    invocation: '॥ ಶ್ರೀ ಗಣೇಶಾಯ ನಮಃ ॥',
    kicker: 'Griha Pravesha',
    names: ['Shree Nilaya'],
    subtitle: 'our new home awaits your blessings',
    message: 'The Patil family warmly invites you to the Griha Pravesha of our new home. Please join us for the pooja and lunch.',
    date: '2027-02-04T06:30:00+05:30',
    venue: { name: 'Shree Nilaya', address: 'Basava Nagar, Bidar, Karnataka' },
    events: [
      { name: 'Griha Pravesha', date: '2027-02-04', time: '6:30 AM', venue: 'Shree Nilaya' },
      { name: 'Ganapathi Homam', date: '2027-02-04', time: '8:00 AM', venue: 'Shree Nilaya' },
      { name: 'Lunch', date: '2027-02-04', time: '12:30 PM', venue: 'Shree Nilaya' },
    ],
    families: [{ title: 'Your hosts', names: 'Smt. Sunita & Shri Ramesh Patil' }],
    photos: [P.diya],
    rsvpBy: '2027-01-30',
  },
  {
    slug: 'seemantha-blossom',
    title: 'Blossom Seemantha',
    occasionSlug: 'baby-shower',
    collection: 'Baby Shower',
    aesthetic: 'Baby Shower',
    motif: 'lotus',
    description: 'Lilac and blush with lotus blossoms — a graceful Seemantha / Godh Bharai invitation for the mother-to-be.',
    tags: ['Lotus Motif', 'Blessings', 'RSVP'],
    theme: { bg: '#fbf6ff', bg2: '#f2e8fb', surface: '#ffffff', ink: '#6b2f6b', text: '#4f4359', accent: '#c084fc', accent2: '#f472b6', gate: 'radial-gradient(circle at 50% 40%, #fdf4ff 0%, #ead5f7 60%, #c9a3e6 100%)' },
    kicker: 'Seemantha',
    names: ['Sneha'],
    subtitle: 'Join us in blessing the mother-to-be',
    message: 'Our families come together to celebrate Sneha and the little one on the way. Your blessings mean the world to us.',
    date: '2027-01-17T11:00:00+05:30',
    venue: PARVATI,
    events: [
      { name: 'Seemantha Ceremony', date: '2027-01-17', time: '11:00 AM', venue: PARVATI.name },
      { name: 'Lunch', date: '2027-01-17', time: '1:00 PM', venue: PARVATI.name },
    ],
    families: [{ title: 'Hosted by', names: 'Patil & Deshmukh Families' }],
    photos: [P.baby],
    rsvpBy: '2027-01-12',
  },
  {
    slug: 'diya-utsav',
    title: 'Diya Utsav',
    occasionSlug: 'religious-cultural',
    collection: 'Religious & Cultural',
    aesthetic: 'Religious & Cultural',
    motif: 'diya',
    description: 'Deep indigo night with glowing diyas — for poojas, festivals, jatres, and community utsavs.',
    tags: ['Glowing Diyas', 'Pooja Timings', 'Programme'],
    theme: { bg: '#141433', bg2: '#1d1d45', surface: 'rgba(255,214,140,0.06)', ink: '#ffd98a', text: '#d9d4ec', accent: '#f59e0b', accent2: '#f97316', gate: 'radial-gradient(circle at 50% 45%, #3b2a6b 0%, #1d1d45 55%, #0b0b1f 100%)' },
    invocation: '॥ ಓಂ ಶ್ರೀ ಸತ್ಯನಾರಾಯಣಾಯ ನಮಃ ॥',
    kicker: 'You are cordially invited to the',
    names: ['Satyanarayana Pooja'],
    subtitle: 'and prasad seva',
    message: 'Kindly join us with your family for the pooja, aarti, and prasad, and receive the blessings of the Lord.',
    date: '2026-12-31T18:00:00+05:30',
    venue: { name: 'Shri Hanuman Temple Hall', address: 'Old City, Bidar, Karnataka' },
    events: [
      { name: 'Pooja', date: '2026-12-31', time: '6:00 PM', venue: 'Temple Hall' },
      { name: 'Aarti', date: '2026-12-31', time: '7:30 PM', venue: 'Temple Hall' },
      { name: 'Prasad', date: '2026-12-31', time: '8:00 PM', venue: 'Temple Hall' },
    ],
    families: [{ title: 'Organised by', names: 'Patil Family' }],
    photos: [P.diya],
    rsvpBy: '2026-12-29',
  },
  {
    slug: 'golden-jubilee',
    title: 'Golden Jubilee',
    occasionSlug: 'anniversary',
    collection: 'Anniversary',
    aesthetic: 'Wedding Anniversary',
    motif: 'jubilee',
    description: 'Midnight navy and gold foil celebrating fifty years together, with a memory gallery and celebration programme.',
    tags: ['50 Years', 'Memory Gallery', 'Gold Foil'],
    theme: { bg: '#0d1b2a', bg2: '#13263b', surface: 'rgba(230,200,120,0.06)', ink: '#f1d48a', text: '#d5dce6', accent: '#d4af37', accent2: '#9fb3c8', gate: 'radial-gradient(circle at 50% 40%, #1f3a5c 0%, #13263b 55%, #070f19 100%)' },
    kicker: 'Fifty golden years',
    names: ['Shanta', 'Ramesh'],
    joiner: '&',
    subtitle: 'invite you to celebrate their Golden Jubilee',
    message: 'Fifty years of love, laughter, and family. Please join us for an evening of memories and celebration.',
    date: '2027-02-20T19:00:00+05:30',
    venue: BELDALE,
    events: [
      { name: 'Blessing Ceremony', date: '2027-02-20', time: '7:00 PM', venue: BELDALE.name },
      { name: 'Dinner', date: '2027-02-20', time: '8:30 PM', venue: BELDALE.name },
    ],
    families: [{ title: 'With love from', names: 'Children & Grandchildren' }],
    photos: [P.anniversary, P.wedding2],
    rsvpBy: '2027-02-12',
  },
];

export const findSample = (slug: string) => SAMPLE_DESIGNS.find((s) => s.slug === slug);
export const samplesFor = (occasionSlug: string) => SAMPLE_DESIGNS.filter((s) => s.occasionSlug === occasionSlug);
