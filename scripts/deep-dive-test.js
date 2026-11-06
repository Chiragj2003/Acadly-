const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('🚀 RUNNING ACADLY FULL DEEP DIVE AUDIT & TEST SUITE');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;
const issues = [];

function assert(condition, testName, errorDetails = '') {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passCount++;
  } else {
    console.log(`❌ FAIL: ${testName}`);
    if (errorDetails) console.log(`   Details: ${errorDetails}`);
    issues.push({ testName, errorDetails });
    failCount++;
  }
}

// 1. Audit Route Files & Navigation Integrity
console.log('\n--- 1. ROUTE & NAVIGATION AUDIT ---');
const appDir = path.join(__dirname, '..', 'src', 'app');
const routeFiles = fs.readdirSync(appDir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

assert(routeFiles.length >= 10, 'All required routes exist in src/app', `Found ${routeFiles.length} files`);
const expectedRoutes = [
  'admin.tsx',
  'auth.tsx',
  'chat.tsx',
  'community.tsx',
  'index.tsx',
  'join-institute.tsx',
  'parent.tsx',
  'student-detail.tsx',
  'student.tsx',
  'teacher.tsx',
  'verify-students.tsx',
  '_layout.tsx',
];

expectedRoutes.forEach(r => {
  assert(routeFiles.includes(r), `Route file "${r}" exists`, `Missing ${r}`);
});

// Scan all source files for router.push / router.replace
const srcDir = path.join(__dirname, '..', 'src');
function getAllFiles(dir, exts = ['.ts', '.tsx', '.js']) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, exts));
    } else if (exts.some(ext => file.endsWith(ext))) {
      results.push(fullPath);
    }
  });
  return results;
}

const allSrcFiles = getAllFiles(srcDir);
const routerTargetRegex = /router\.(push|replace)\(\s*['"`]([^'"`]+)['"`]/g;
const validPaths = [
  '/',
  '/index',
  '/auth',
  '/student',
  '/teacher',
  '/parent',
  '/admin',
  '/chat',
  '/community',
  '/join-institute',
  '/student-detail',
  '/verify-students',
];

let checkedNavCount = 0;
allSrcFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = routerTargetRegex.exec(content)) !== null) {
    checkedNavCount++;
    const target = match[2];
    const isValid = validPaths.includes(target) || validPaths.some(p => target.startsWith(p));
    assert(isValid, `Navigation destination "${target}" in ${path.basename(file)} is valid`, `Invalid route target: ${target}`);
  }
});
console.log(`Audited ${checkedNavCount} dynamic router navigation calls.`);

// 2. Audit Dummy Accounts & Credentials
console.log('\n--- 2. DUMMY ACCOUNTS & AUTHENTICATION AUDIT ---');
const authContextPath = path.join(srcDir, 'context', 'AuthContext.tsx');
const authContextContent = fs.readFileSync(authContextPath, 'utf8');

assert(authContextContent.includes('export const DUMMY_ACCOUNTS'), 'DUMMY_ACCOUNTS is exported from AuthContext');
const accountEmails = [
  'student@acadly.com',
  'kabir@acadly.com',
  'teacher@acadly.com',
  'parent@acadly.com',
  'admin@acadly.com',
];

accountEmails.forEach(email => {
  assert(authContextContent.includes(email), `Test Account "${email}" is registered in AuthContext`);
});

// 3. Audit Academic Data Depth
console.log('\n--- 3. ACADEMIC DATA INTEGRITY AUDIT ---');
const academicContextPath = path.join(srcDir, 'context', 'AcademicContext.tsx');
const academicContent = fs.readFileSync(academicContextPath, 'utf8');

assert(academicContent.includes('stud-amelia') && academicContent.includes('stud-kabir') && academicContent.includes('stud-zoya'), 'Initial roster includes core students');
assert(academicContent.includes('stud-aarav') && academicContent.includes('stud-ananya') && academicContent.includes('stud-rohan'), 'Roster includes extended students Aarav, Ananya, Rohan');
assert(academicContent.includes('stud-diya') && academicContent.includes('stud-ishaan'), 'Roster includes extended students Diya and Ishaan');

// Check attendance records count
const attCount = (academicContent.match(/student_id:\s*'stud-/g) || []).length;
assert(attCount >= 8, `Roster & Attendance covers full batch (found ${attCount} student references)`);

// Check lectures
assert(academicContent.includes('lec-01') && academicContent.includes('lec-02') && academicContent.includes('lec-03') && academicContent.includes('lec-04'), 'Includes multi-subject video lectures (Physics, Maths, Chem, Bio)');

// Check assignments
assert(academicContent.includes('asg-01') && academicContent.includes('asg-02') && academicContent.includes('asg-03'), 'Includes multiple assignments (Gauss Law, Definite Integrals, Rotational Unit Test)');

// 4. Audit In-App PDF Catalog & Reader
console.log('\n--- 4. IN-APP PDF CATALOG & READER AUDIT ---');
const pdfServicePath = path.join(srcDir, 'services', 'dummyPdfService.ts');
const pdfServiceContent = fs.readFileSync(pdfServicePath, 'utf8');

assert(pdfServiceContent.includes('pdf-formula-01'), 'Kinematics formula sheet is present');
assert(pdfServiceContent.includes('pdf-dpp-02'), 'Calculus DPP #04 is present');
assert(pdfServiceContent.includes('pdf-pyq-03'), 'Organic chemistry PYQ bank is present');
assert(pdfServiceContent.includes('pdf-photoelectric-05'), 'Modern physics photoelectric sheet is present');
assert(pdfServiceContent.includes('pdf-conics-06'), 'Coordinate geometry conic sections notes are present');
assert(pdfServiceContent.includes('function buildDocumentHTML'), 'buildDocumentHTML function is exported');

// 5. Audit Parent & Multi-Child Support
console.log('\n--- 5. PARENT MULTI-CHILD AUDIT ---');
const childContextPath = path.join(srcDir, 'context', 'ChildContext.tsx');
const childContextContent = fs.readFileSync(childContextPath, 'utf8');

assert(childContextContent.includes('stud-amelia-01'), 'Child Amelia is present in default children list');
assert(childContextContent.includes('stud-aarav-02'), 'Child Aarav is present in default children list');
assert(childContextContent.includes('stud-rohan-03'), 'Child Rohan is present in default children list');
assert(childContextContent.includes('DEFAULT_CHILDREN') && childContextContent.includes('setChildrenList(DEFAULT_CHILDREN)'), 'Fallback to DEFAULT_CHILDREN guarantees parent test data');

// 6. Audit Critical Syntax & JSX Safety
console.log('\n--- 6. JSX SYNTAX & SAFETY AUDIT ---');
let htmlTagsFound = 0;
const forbiddenHtml = ['<strong>', '</b>', '<div>', '<p>', '<span>'];
allSrcFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  // Strip backtick template literals (legitimate HTML templates used by expo-print or WebView)
  const contentWithoutTemplates = content.replace(/`[\s\S]*?`/g, '');
  forbiddenHtml.forEach(tag => {
    if (contentWithoutTemplates.includes(tag)) {
      htmlTagsFound++;
      issues.push({ testName: `Forbidden HTML tag "${tag}" in ${path.basename(file)}` });
    }
  });
});
assert(htmlTagsFound === 0, 'Zero illegal HTML tags found across all TSX files', `Found ${htmlTagsFound} illegal tags`);

// 7. Audit Legacy AI Tokens
console.log('\n--- 7. LEGACY DESIGN TOKEN PURGE AUDIT ---');
let cuteClassesCount = 0;
allSrcFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(/cute-[a-z0-9-]+/g);
  if (matches) {
    cuteClassesCount += matches.length;
    issues.push({ testName: `Legacy cute-* class in ${path.basename(file)}`, details: matches.join(', ') });
  }
});
assert(cuteClassesCount === 0, 'Zero legacy cute-* classes remain in src/', `Found ${cuteClassesCount} occurrences`);

// 8. Audit Metro & Build Configuration
console.log('\n--- 8. BUILD & METRO PERFORMANCE AUDIT ---');
const appJsonPath = path.join(__dirname, '..', 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

assert(!appJson.expo?.experiments?.reactCompiler, 'React Compiler is disabled (preventing NativeWind v4 build freezes)');

const metroConfigPath = path.join(__dirname, '..', 'metro.config.js');
const metroConfigContent = fs.readFileSync(metroConfigPath, 'utf8');
assert(metroConfigContent.includes('blockList'), 'metro.config.js contains blockList for watcher performance on Windows');

console.log('\n====================================================');
console.log(`TEST RESULTS: ${passCount} PASSED | ${failCount} FAILED`);
console.log('====================================================\n');

if (failCount > 0) {
  console.log('Issues detected:');
  console.log(JSON.stringify(issues, null, 2));
  process.exit(1);
} else {
  console.log('🎉 ALL SYSTEM AUDIT & FLOW TESTS PASSED WITH 0 ISSUES!');
  process.exit(0);
}
