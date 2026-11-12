import {
  DEV_STUDENT_USER_ID,
  DEV_STUDENT_2_USER_ID,
  DEV_TEACHER_USER_ID,
  DEV_PARENT_USER_ID,
  DEV_ADMIN_USER_ID,
  type DummyAccount,
} from '@/lib/devSeedHelper';

export { type DummyAccount };

/**
 * DEV ONLY: Preset 1-tap quick demo accounts for rapid testing & evaluation.
 * Note: These accounts are strictly gated behind __DEV__ and MUST NEVER be bundled
 * or referenced in production code paths.
 */
export const DUMMY_ACCOUNTS: DummyAccount[] = [
  {
    id: DEV_STUDENT_USER_ID,
    role: 'student',
    name: 'Amelia Sharma',
    email: 'student@acadly.com',
    password: 'Password123!',
    roleLabel: 'Student (Class 12 Topper)',
    badge: 'JEE Advanced',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    avatarInitials: 'AS',
    description: 'Top ranker, 96.4% attendance, all DPPs submitted, full analytics view.',
  },
  {
    id: DEV_STUDENT_2_USER_ID,
    role: 'student',
    name: 'Kabir Singhania',
    email: 'kabir@acadly.com',
    password: 'Password123!',
    roleLabel: 'Student (Class 11 Science)',
    badge: 'IIT-JEE 2026',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    avatarInitials: 'KS',
    description: 'Active doubt poster, 89.2% attendance, 2 pending assignments.',
  },
  {
    id: DEV_TEACHER_USER_ID,
    role: 'teacher',
    name: 'Prof. Vikram Joshi',
    email: 'teacher@acadly.com',
    password: 'Password123!',
    roleLabel: 'Senior Physics Faculty',
    badge: 'Code: JOSHI-MATH-89',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    avatarInitials: 'VJ',
    description: 'Manages batch roll call, interactive DPP builder, test marks, and doubt channels.',
  },
  {
    id: DEV_PARENT_USER_ID,
    role: 'parent',
    name: 'Rajesh Sharma',
    email: 'parent@acadly.com',
    password: 'Password123!',
    roleLabel: 'Parent / Guardian',
    badge: 'Child: Amelia Sharma',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    avatarInitials: 'RS',
    description: 'Tracks daughter attendance, downloads term report cards, links with tuition faculty.',
  },
  {
    id: DEV_ADMIN_USER_ID,
    role: 'admin',
    name: 'Director Rajesh Gupta',
    email: 'admin@acadly.com',
    password: 'Password123!',
    roleLabel: 'Academy Director & Admin',
    badge: 'Academy Center',
    badgeColor: 'bg-slate-900 text-white border-slate-800',
    avatarInitials: 'RG',
    description: 'Center-wide admissions, teacher verification requests, batch schedules, faculty rosters.',
  },
];
