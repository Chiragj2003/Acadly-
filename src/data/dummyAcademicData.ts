// ==============================================================================
// ACADLY CUTE & HUMAN DUMMY ACADEMIC DATA
// Crafted with warm, relatable coaching notes, realistic schedules & friendly study vibes
// ==============================================================================

export interface StudyNote {
  id: string;
  subject: string;
  emoji: string;
  title: string;
  subtitle: string;
  chapter: string;
  author: string;
  badge: string;
  badgeColor: string;
  fileSizeBytes: string;
  readTime: string;
  colorBg: string;
  colorBorder: string;
  keyTakeaways: string[];
  sampleContent: string;
}

export interface CuteBatch {
  id: string;
  name: string;
  mascot: string;
  grade: string;
  room: string;
  timing: string;
  studentCount: number;
  attendanceRate: number;
  themeColor: string;
}

export const CUTE_BATCHES: CuteBatch[] = [
  {
    id: 'batch-jee-adv-12',
    name: 'Class 12 • JEE Advanced (Morning)',
    mascot: '📐',
    grade: 'Grade 12 Science (PCM)',
    room: 'Hall A (Senior Wing)',
    timing: '04:00 PM – 06:30 PM',
    studentCount: 28,
    attendanceRate: 96.4,
    themeColor: '#eff6ff',
  },
  {
    id: 'batch-phy-calc-11',
    name: 'Class 11 • Physics & Calculus Mastery',
    mascot: '⚙️',
    grade: 'Grade 11 Advanced IIT-JEE',
    room: 'Einstein Hall 204',
    timing: '06:45 PM – 09:15 PM',
    studentCount: 34,
    attendanceRate: 94.2,
    themeColor: '#f0fdf4',
  },
  {
    id: 'batch-neet-680',
    name: 'NEET-UG • Target 680+ Batch',
    mascot: '🔬',
    grade: 'Grade 11 & 12 Pre-Medical',
    room: 'Curie Hall B',
    timing: '02:30 PM – 05:00 PM',
    studentCount: 30,
    attendanceRate: 97.5,
    themeColor: '#fef3c7',
  },
  {
    id: 'batch-cbse-10',
    name: 'Class 10 CBSE • Board Toppers',
    mascot: '📚',
    grade: 'Grade 10 Foundation & Boards',
    room: 'Room 102 (Garden Floor)',
    timing: '05:30 PM – 07:00 PM',
    studentCount: 22,
    attendanceRate: 98.1,
    themeColor: '#f5f3ff',
  },
];

export const CUTE_STUDY_NOTES: StudyNote[] = [
  {
    id: 'note-bio-01',
    subject: 'Biology',
    emoji: '🌿',
    title: 'Photosynthesis & Light Cycles in Depth',
    subtitle: 'Handwritten summaries with color-coded chloroplast diagrams',
    chapter: 'Unit 3: Plant Physiology',
    author: 'Dr. Ananya Ray',
    badge: 'Must Read 🌸',
    badgeColor: '#ffccd5',
    fileSizeBytes: '3.4 MB PDF',
    readTime: '12 min read',
    colorBg: '#fef2f2',
    colorBorder: '#fecdd3',
    keyTakeaways: [
      'Thylakoid membrane is where PS-I and PS-II photophosphorylation occurs.',
      'Calvin cycle fixes 1 CO₂ using 3 ATP and 2 NADPH per round.',
      'RuBisCO enzyme binds both CO₂ and O₂ depending on concentration.',
    ],
    sampleContent: `✨ Biology Quick Cheat Sheet:
1. Photosystem II absorbs light at 680 nm (P680) and splits water:
   2H₂O → 4H⁺ + 4e⁻ + O₂
2. Electron transport creates a proton gradient inside the thylakoid lumen.
3. ATP Synthase (CF₀-CF₁ complex) uses this proton motive force to generate ATP.
4. Dark reaction (Calvin Cycle) takes place in the stroma — no light needed directly!`,
  },
  {
    id: 'note-phy-02',
    subject: 'Physics',
    emoji: '⚡',
    title: 'Electrostatics & Gauss Law Intuition',
    subtitle: 'Visual mind-map of electric flux, spherical shells & dipoles',
    chapter: 'Chapter 1 & 2: Charges & Fields',
    author: 'Prof. Vikram Joshi',
    badge: 'Formula Sheet ⚡',
    badgeColor: '#fef3c7',
    fileSizeBytes: '2.1 MB PDF',
    readTime: '8 min read',
    colorBg: '#fffbeb',
    colorBorder: '#fde68a',
    keyTakeaways: [
      'Total electric flux through any closed Gaussian surface = Q_enclosed / ε₀.',
      'Electric field inside a uniformly charged conducting shell is strictly ZERO.',
      'Potential difference V = -∫ E · dr along the field line.',
    ],
    sampleContent: `⚡ Physics Master Formulas:
• Coulomb Force: F = (1 / 4πε₀) * (q₁q₂ / r²)
• Electric Field: E = F / q₀ (N/C or V/m)
• Dipole Torque: τ = p × E (Maximum torque when p is perpendicular to E)
• Capacitor with dielectric: C = K * (ε₀A / d)`,
  },
  {
    id: 'note-math-03',
    subject: 'Mathematics',
    emoji: '📐',
    title: 'Calculus: Derivatives & Curves Made Easy',
    subtitle: 'Graph sketches, tangent rules & local maxima-minima steps',
    chapter: 'Unit 4: Differential Calculus',
    author: 'Prof. Meera Sen',
    badge: 'Step-by-Step 📐',
    badgeColor: '#ede9fe',
    fileSizeBytes: '4.8 MB PDF',
    readTime: '15 min read',
    colorBg: '#f5f3ff',
    colorBorder: '#ddd6fe',
    keyTakeaways: [
      'Slope of tangent = dy/dx evaluated at that specific coordinate (x₁, y₁).',
      'For critical points: set f\'(x) = 0. Test sign change or check f\'\'(x).',
      'If f\'\'(x) < 0 at critical point, the curve is concave down (Local Maximum!).',
    ],
    sampleContent: `📐 Calculus Quick Reference:
• d/dx [sin(x)] = cos(x)
• d/dx [ln(x)] = 1/x
• Product Rule: (uv)' = u'v + uv'
• Quotient Rule: (u/v)' = (u'v - uv') / v²
• Chain Rule: dy/dx = (dy/du) * (du/dx)`,
  },
  {
    id: 'note-chem-04',
    subject: 'Chemistry',
    emoji: '🧪',
    title: 'Organic Chemistry: Aldehydes & Ketones',
    subtitle: 'Color reaction chart: Tollens, Fehling, & Aldol condensation',
    chapter: 'Chapter 12: Carbonyl Compounds',
    author: 'Dr. Rohan Kulkarni',
    badge: 'Exam Favorite 🧪',
    badgeColor: '#dcfce7',
    fileSizeBytes: '1.9 MB PDF',
    readTime: '10 min read',
    colorBg: '#f0fdf4',
    colorBorder: '#bbf7d0',
    keyTakeaways: [
      'Tollens reagent (ammoniacal AgNO₃) gives silver mirror only with Aldehydes.',
      'Fehling solution forms red Cu₂O precipitate with aliphatic aldehydes.',
      'Aldol condensation requires at least one α-hydrogen atom.',
    ],
    sampleContent: `🧪 Organic Reactions Quick Recall:
1. Tollens Test:
   R-CHO + 2[Ag(NH₃)₂]⁺ + 3OH⁻ → R-COO⁻ + 2Ag↓ (Silver Mirror!) + 4NH₃ + 2H₂O
2. Cannizzaro Reaction:
   Aldehydes with NO α-hydrogen (like Formaldehyde & Benzaldehyde) undergo self oxidation-reduction with 50% NaOH.`,
  },
];

export const DAILY_MOODS = [
  { id: 'happy', emoji: '🌸', label: 'Excited & Curious', color: '#ffb5a7' },
  { id: 'focus', emoji: '☕', label: 'Focused & Calm', color: '#b5e2fa' },
  { id: 'neutral', emoji: '☁️', label: 'Taking it Steady', color: '#e8e8e8' },
  { id: 'tired', emoji: '🌙', label: 'Need a Gentle Break', color: '#d8b4e2' },
];

export const DAILY_AFFIRMATIONS = [
  "You are learning, growing, and doing wonderfully today! 🌸",
  "One step, one equation, one paragraph at a time. Keep going! ☕",
  "Curiosity is your superpower. Ask every question! 🌟",
  "Proud of you for showing up today. Let's make it count! 🍀",
];
