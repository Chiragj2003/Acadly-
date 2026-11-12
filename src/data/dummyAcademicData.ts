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

import { Student360Profile } from '@/types/database';

export const INITIAL_STUDENTS_ROSTER: Student360Profile[] = [
  {
    id: 'stud-amelia',
    name: 'Amelia Sharma',
    rollNumber: '#01',
    grade: 'Class 12 Science',
    board: 'CBSE',
    school: 'Delhi Public School (R.K. Puram)',
    targetExam: 'IIT-JEE 2026',
    batchName: 'Class 12 • JEE Advanced (Morning)',
    parentLinkCode: 'STU-AMELIA-902',
    guardianName: 'Rajesh Sharma (Father)',
    guardianPhone: '+91 98230 44551',
    address: 'Flat 402, Lotus Towers, Pune, Maharashtra',
    bloodGroup: 'B+',
    previousPercentage: '96.2% in Class 10',
    weakSubjects: ['Rotational Mechanics', 'Ionic Equilibrium'],
    overallAttendance: 96.4,
    feeStatus: 'Paid Full (₹45,000)',
    rank: 1,
    percentile: 98.8,
    teacherRemarks: ['Exceptionally strong in calculus.', 'Active class contributor & doubt helper.'],
  },
  {
    id: 'stud-kabir',
    name: 'Kabir Singhania',
    rollNumber: '#02',
    grade: 'Class 11 Science',
    board: 'CBSE',
    school: 'The Mother International',
    targetExam: 'IIT-JEE 2026',
    batchName: 'Class 12 • JEE Advanced (Morning)',
    parentLinkCode: 'STU-KABIR-118',
    guardianName: 'Rajesh Singhania (Father)',
    guardianPhone: '+91 98110 33442',
    address: 'B-14 Green Park, New Delhi',
    bloodGroup: 'O+',
    previousPercentage: '94.2% in Class 10',
    weakSubjects: ['Organic Chemistry', 'Vectors'],
    overallAttendance: 92.1,
    feeStatus: 'Paid Full (₹45,000)',
    rank: 5,
    percentile: 91.2,
    teacherRemarks: ['Very active in doubt sessions.', 'Consistent homework solver.'],
  },
  {
    id: 'stud-zoya',
    name: 'Zoya Khan',
    rollNumber: '#03',
    grade: 'Class 12 Pre-Medical',
    board: 'ICSE',
    school: 'St. Xavier High School',
    targetExam: 'NEET Medical 2026',
    batchName: 'NEET-UG • Target 680+ Batch',
    parentLinkCode: 'STU-ZOYA-124',
    guardianName: 'Dr. Farooq Khan (Father)',
    guardianPhone: '+91 98900 22119',
    address: '77 Hill Road, Bandra, Mumbai',
    bloodGroup: 'A+',
    previousPercentage: '97.4% in Class 10',
    weakSubjects: ['Physics Numerical Problems'],
    overallAttendance: 98.0,
    feeStatus: 'Paid Full (₹40,000)',
    rank: 2,
    percentile: 98.5,
    teacherRemarks: ['Remarkable conceptual clarity in Botany & Organic Chemistry.'],
  },
  {
    id: 'stud-aarav',
    name: 'Aarav Mehta',
    rollNumber: '#04',
    grade: 'Class 12 Science',
    board: 'CBSE',
    school: 'Modern High School (Vasant Vihar)',
    targetExam: 'IIT-JEE 2026',
    batchName: 'Class 12 • JEE Advanced (Morning)',
    parentLinkCode: 'STU-AARAV-104',
    guardianName: 'Vikram Mehta (Father)',
    guardianPhone: '+91 98200 55123',
    address: 'C-24 Defence Colony, New Delhi',
    bloodGroup: 'B+',
    previousPercentage: '91.0% in Class 10',
    weakSubjects: ['Thermodynamics', 'Probability'],
    overallAttendance: 88.5,
    feeStatus: 'Paid Full (₹45,000)',
    rank: 8,
    percentile: 87.0,
    teacherRemarks: ['Needs targeted practice on speed in numerical calculations.'],
  },
  {
    id: 'stud-ananya',
    name: 'Ananya Deshmukh',
    rollNumber: '#05',
    grade: 'Class 12 Science',
    board: 'State Board (HSC)',
    school: 'Fergusson Junior College',
    targetExam: 'IIT-JEE & MHT-CET',
    batchName: 'Class 12 • JEE Advanced (Morning)',
    parentLinkCode: 'STU-ANANYA-205',
    guardianName: 'Dr. Sanjay Deshmukh',
    guardianPhone: '+91 98220 99881',
    address: 'Prabhat Road, Pune, Maharashtra',
    bloodGroup: 'O-',
    previousPercentage: '95.6% in Class 10',
    weakSubjects: ['Complex Numbers'],
    overallAttendance: 94.7,
    feeStatus: 'Paid Full (₹45,000)',
    rank: 4,
    percentile: 93.4,
    teacherRemarks: ['Consistently top unit test scores in Coordinate Geometry.'],
  },
  {
    id: 'stud-rohan',
    name: 'Rohan Kulkarni',
    rollNumber: '#06',
    grade: 'Class 11 Science',
    board: 'CBSE',
    school: 'DAV Public School',
    targetExam: 'IIT-JEE 2026',
    batchName: 'Class 11 Foundation Batch',
    parentLinkCode: 'STU-ROHAN-306',
    guardianName: 'Sunita Kulkarni (Mother)',
    guardianPhone: '+91 98231 44502',
    address: 'Kothrud, Pune, Maharashtra',
    bloodGroup: 'AB+',
    previousPercentage: '86.4% in Class 10',
    weakSubjects: ['Newtonian Mechanics', 'Stoichiometry'],
    overallAttendance: 85.0,
    feeStatus: 'Pending Fee (₹3,500)',
    rank: 12,
    percentile: 82.1,
    teacherRemarks: ['Shows sincere curiosity, requires extra guidance on problem decomposition.'],
  },
  {
    id: 'stud-diya',
    name: 'Diya Patel',
    rollNumber: '#07',
    grade: 'Class 12 Pre-Medical',
    board: 'CBSE',
    school: 'The Heritage School',
    targetExam: 'NEET Medical 2026',
    batchName: 'NEET-UG • Target 680+ Batch',
    parentLinkCode: 'STU-DIYA-407',
    guardianName: 'Bhavin Patel (Father)',
    guardianPhone: '+91 98790 12345',
    address: 'Bodakdev, Ahmedabad, Gujarat',
    bloodGroup: 'A-',
    previousPercentage: '96.8% in Class 10',
    weakSubjects: ['Ray Optics'],
    overallAttendance: 97.2,
    feeStatus: 'Paid Full (₹40,000)',
    rank: 3,
    percentile: 96.1,
    teacherRemarks: ['Outstanding recall in Organic Synthesis & Cell Biology.'],
  },
  {
    id: 'stud-ishaan',
    name: 'Ishaan Verma',
    rollNumber: '#08',
    grade: 'Class 11 Science',
    board: 'CBSE',
    school: 'Amity International School',
    targetExam: 'IIT-JEE 2026',
    batchName: 'Class 11 Foundation Batch',
    parentLinkCode: 'STU-ISHAAN-508',
    guardianName: 'Manish Verma (Father)',
    guardianPhone: '+91 98101 23456',
    address: 'Sector 44, Noida, UP',
    bloodGroup: 'B+',
    previousPercentage: '92.0% in Class 10',
    weakSubjects: ['Permutations & Combinations'],
    overallAttendance: 91.0,
    feeStatus: 'Pending Fee (₹1,500)',
    rank: 7,
    percentile: 89.5,
    teacherRemarks: ['Strong numerical instincts, needs regular DPP submission discipline.'],
  },
];

import { CommunityPost } from '@/services/communityService';
import { PDFMaterialItem } from '@/services/materialService';

export const INITIAL_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 'post-1',
    author: 'Amelia Sharma',
    role: 'student',
    avatarEmoji: '🌸',
    timeAgo: '2h ago',
    subject: 'Physics',
    title: 'Why is electric field inside a hollow spherical conductor strictly zero?',
    content: 'In Gauss law we take a Gaussian sphere inside radius R. Since enclosed charge q=0, flux is 0. But how does charge on the outer shell cancel out the field at EVERY non-central point?',
    upvotes: 18,
    hasTeacherAnswer: true,
    teacherName: 'Prof. Vikram Joshi (Faculty)',
    teacherVerifiedText: 'Great conceptual doubt! By inverse-square law, a larger patch of surface charge further away subtends the exact same solid angle as a smaller, closer patch. Their fields cancel vectorially everywhere inside!',
    attachmentName: 'Gauss_Law_Spherical_Derivation.pdf',
    comments: [
      {
        id: 'c1',
        author: 'Prof. Vikram Joshi',
        role: 'teacher',
        text: 'Review chapter 2 page 48 in your formula sheet for the solid angle diagram.',
        createdAt: '1h ago',
        isTeacherVerified: true,
      },
      {
        id: 'c2',
        author: 'Kabir Singhania',
        role: 'student',
        text: 'That solid angle explanation finally made it click for me too! Thanks sir.',
        createdAt: '45m ago',
        isTeacherVerified: false,
      },
    ],
  },
  {
    id: 'post-2',
    author: 'Kabir Singhania',
    role: 'student',
    avatarEmoji: '🚀',
    timeAgo: '4h ago',
    subject: 'Mathematics',
    title: 'Quick trick for evaluating limits with [1^infinity] indeterminate form?',
    content: 'Whenever limit as x->a of [f(x)]^g(x) gives 1^inf, can we directly write e^lim [g(x) * (f(x) - 1)]?',
    upvotes: 12,
    hasTeacherAnswer: true,
    teacherName: 'Prof. Meera Sen (Maths Faculty)',
    teacherVerifiedText: 'Yes! That standard exponential identity holds whenever f(x) -> 1 and g(x) -> ∞. Always verify both conditions before applying.',
    comments: [
      {
        id: 'c3',
        author: 'Prof. Meera Sen',
        role: 'teacher',
        text: 'Be careful when g(x) oscillates or when limit does not exist.',
        createdAt: '3h ago',
        isTeacherVerified: true,
      },
    ],
  },
];

export const INITIAL_PDF_MATERIALS: PDFMaterialItem[] = [
  {
    id: 'pdf-01',
    subject: 'Physics',
    emoji: '⚡',
    title: 'Kinematics & Rotational Mechanics Formula Sheet',
    subtitle: 'High-Yield Equations, Vector Shortcuts & Dimensional Checks',
    category: 'formula_sheet',
    author: 'Prof. Vikram Joshi (IIT Bombay)',
    fileSizeBytes: '3.4 MB PDF',
    createdAt: 'Today',
  },
  {
    id: 'pdf-02',
    subject: 'Mathematics',
    emoji: '📐',
    title: 'Calculus DPP #04: Definite Integrals & Areas',
    subtitle: '20 Daily Practice Questions with King’s Property Hints',
    category: 'dpp',
    author: 'Prof. Meera Sen (Maths Faculty)',
    fileSizeBytes: '2.8 MB PDF',
    createdAt: 'Yesterday',
  },
  {
    id: 'pdf-03',
    subject: 'Chemistry',
    emoji: '🧪',
    title: 'Organic Reaction Mechanisms: Aldehydes & Ketones',
    subtitle: 'Color reaction chart: Tollens, Fehling, & Aldol Condensation',
    category: 'notes',
    author: 'Dr. Rohan Kulkarni',
    fileSizeBytes: '1.9 MB PDF',
    createdAt: '2 days ago',
  },
  {
    id: 'pdf-04',
    subject: 'Biology',
    emoji: '🌿',
    title: 'Neural Control & Synaptic Transmission (PYQ)',
    subtitle: '10-Year Solved Questions with Color-Coded Axon Diagrams',
    category: 'pyq',
    author: 'Dr. Ananya Ray',
    fileSizeBytes: '4.2 MB PDF',
    createdAt: '3 days ago',
  },
  {
    id: 'pdf-05',
    subject: 'Physics',
    emoji: '🔬',
    title: 'Modern Physics & Photoelectric Effect Cheat Sheet',
    subtitle: 'Einstein equation, stopping potential & de Broglie wavelengths',
    category: 'formula_sheet',
    author: 'Prof. Vikram Joshi',
    fileSizeBytes: '2.1 MB PDF',
    createdAt: '4 days ago',
  },
];
