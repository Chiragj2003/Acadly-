import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { type ExamResult, type Student360Profile } from '@/types/database';

export interface ProgressSummaryData {
  studentName: string;
  rollNumber: string;
  batchName: string;
  instituteName: string;
  overallAttendanceRate: number;
  grade?: string;
  board?: string;
  targetExam?: string;
  results: {
    examTitle: string;
    subject?: string;
    marksObtained: number;
    maxMarks: number;
    percentage: number;
    grade?: string;
    remarks?: string;
  }[];
  teacherRemarks?: string[];
}

/**
 * Generate a student progress summary / report card HTML.
 */
function buildReportCardHTML(data: ProgressSummaryData): string {
  const resultRows = data.results.length > 0
    ? data.results
        .map(
          (r) => `
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #E6E2DA; font-weight: 600; color: #2A2724;">${r.examTitle}</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #E6E2DA; text-align: center; color: #4A463F;">${r.marksObtained} / ${r.maxMarks}</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #E6E2DA; text-align: center; font-weight: 700; color: ${r.percentage >= 75 ? '#16a34a' : r.percentage >= 40 ? '#d97706' : '#dc2626'};">${r.percentage}%</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #E6E2DA; text-align: center; color: #1C1C1E; font-weight: 700;">${r.grade || 'A'}</td>
        </tr>
      `
        )
        .join('')
    : `<tr><td colspan="4" style="padding: 14px; text-align: center; color: #8C877E;">No examination records logged yet.</td></tr>`;

  const remarksList = (data.teacherRemarks || [])
    .map((rm) => `<li style="margin-bottom: 6px; color: #3B372F;">${rm}</li>`)
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Student Academic Report Card</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #1C1C1E;
            padding: 36px 32px;
            background-color: #ffffff;
            margin: 0;
          }
          .header {
            border-bottom: 2px solid #1C1C1E;
            padding-bottom: 20px;
            margin-bottom: 24px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .inst-name {
            font-size: 20px;
            font-weight: 900;
            color: #1e3a8a;
            letter-spacing: -0.5px;
          }
          .badge {
            background-color: #EEF4FC;
            color: #121212;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 9999px;
            border: 1px solid #bfdbfe;
            display: inline-block;
            margin-top: 4px;
          }
          .student-card {
            background-color: #F3F1EC;
            border: 1px solid #E6E2DA;
            border-radius: 12px;
            padding: 16px 20px;
            margin-bottom: 24px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
          }
          .student-field label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            color: #6E6A63;
            display: block;
            margin-bottom: 2px;
          }
          .student-field span {
            font-size: 13px;
            font-weight: 700;
            color: #1C1C1E;
          }
          .section-title {
            font-size: 14px;
            font-weight: 800;
            color: #2A2724;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
            border-left: 3px solid #1C1C1E;
            padding-left: 8px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
            font-size: 12px;
          }
          th {
            background-color: #EDE9E1;
            padding: 10px 14px;
            text-align: left;
            font-weight: 700;
            color: #4A463F;
            border-bottom: 1px solid #D8D3CA;
          }
          .remarks-box {
            background-color: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 10px;
            padding: 14px 18px;
            margin-bottom: 28px;
          }
          .footer {
            border-top: 1px solid #E6E2DA;
            padding-top: 16px;
            font-size: 10px;
            color: #8C877E;
            display: flex;
            justify-content: space-between;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="inst-name">${data.instituteName}</div>
            <div class="badge">Official Term Progress Summary</div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #6E6A63;">
            <div>Generated: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            <div>Acadly Verified Record</div>
          </div>
        </div>

        <div class="student-card">
          <div class="student-field">
            <label>Student Name</label>
            <span>${data.studentName}</span>
          </div>
          <div class="student-field">
            <label>Roll / ID</label>
            <span>${data.rollNumber}</span>
          </div>
          <div class="student-field">
            <label>Enrolled Batch</label>
            <span>${data.batchName}</span>
          </div>
          <div class="student-field">
            <label>Academic Board</label>
            <span>${data.board || 'CBSE'}</span>
          </div>
          <div class="student-field">
            <label>Class / Grade</label>
            <span>${data.grade || 'Class 12'}</span>
          </div>
          <div class="student-field">
            <label>Attendance Rate</label>
            <span style="color: ${data.overallAttendanceRate >= 85 ? '#16a34a' : '#d97706'}; font-weight: 800;">
              ${data.overallAttendanceRate}%
            </span>
          </div>
        </div>

        <div class="section-title">Examination & Marks Breakdown</div>
        <table>
          <thead>
            <tr>
              <th>Assessment Title</th>
              <th style="text-align: center;">Score</th>
              <th style="text-align: center;">Percentage</th>
              <th style="text-align: center;">Grade</th>
            </tr>
          </thead>
          <tbody>
            ${resultRows}
          </tbody>
        </table>

        ${
          data.teacherRemarks && data.teacherRemarks.length > 0
            ? `
            <div class="section-title">Faculty Observations & Remarks</div>
            <div class="remarks-box">
              <ul style="margin: 0; padding-left: 18px; font-size: 12px; line-height: 1.6;">
                ${remarksList}
              </ul>
            </div>
          `
            : ''
        }

        <div class="footer">
          <div>Acadly Student Analytics Engine • Automated Evaluation</div>
          <div>Confidential Student Academic Record</div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate PDF progress summary and share / download to device storage.
 */
export async function exportStudentReportCardPDF(data: ProgressSummaryData): Promise<void> {
  try {
    const html = buildReportCardHTML(data);
    const { uri } = await Print.printToFileAsync({ html });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `Academic Progress Summary - ${data.studentName}`,
      });
    } else {
      Alert.alert('Report Card Generated', `PDF saved successfully to:\n${uri}`);
    }
  } catch (error: any) {
    Alert.alert('Export Error', error?.message || 'Could not generate report card PDF.');
  }
}
