import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

export interface PDFDocumentContent {
  id: string;
  title: string;
  subtitle: string;
  subject: string;
  author: string;
  category: 'notes' | 'formula_sheet' | 'pyq' | 'dpp';
  date: string;
  sections: {
    heading: string;
    items: string[];
  }[];
}

export const DUMMY_PDF_CATALOG: PDFDocumentContent[] = [
  {
    id: 'pdf-formula-01',
    title: 'Kinematics & Rotational Mechanics - Ultimate Formula Sheet',
    subtitle: 'High-Yield Equations, Vector Shortcuts & Dimensional Checks',
    subject: 'Physics',
    author: 'Prof. Vikram Joshi (IIT Bombay)',
    category: 'formula_sheet',
    date: 'March 2026 Edition',
    sections: [
      {
        heading: '1. Rectilinear Kinematics (Uniform Acceleration)',
        items: [
          'v = u + a·t',
          's = u·t + ½·a·t²',
          'v² = u² + 2·a·s',
          's_nth = u + ½·a·(2n - 1) [Distance in n-th second]',
          'Stopping distance: d = v² / (2·μ·g)',
        ],
      },
      {
        heading: '2. Projectile Motion (Ground-to-Ground)',
        items: [
          'Time of flight: T = (2·u·sinθ) / g',
          'Maximum Height: H = (u²·sin²θ) / (2·g)',
          'Horizontal Range: R = (u²·sin2θ) / g',
          'Trajectory Equation: y = x·tanθ - (g·x²) / (2·u²·cos²θ)',
          'Radius of Curvature at apex: r = (u²·cos²θ) / g',
        ],
      },
      {
        heading: '3. Rotational Dynamics & Moment of Inertia',
        items: [
          'Torque: τ = I·α = r × F',
          'Angular Momentum: L = I·ω = r × p',
          'Rotational Kinetic Energy: K_rot = ½·I·ω²',
          'Parallel Axis Theorem: I = I_cm + M·d²',
          'Perpendicular Axis Theorem: I_z = I_x + I_y (for planar laminas)',
        ],
      },
    ],
  },
  {
    id: 'pdf-dpp-02',
    title: 'Calculus DPP #04: Definite Integrals & Areas',
    subtitle: '20 Daily Practice Questions with Stepwise Hints',
    subject: 'Mathematics',
    author: 'Prof. Meera Sen (Maths Faculty)',
    category: 'dpp',
    date: 'Batch Sakura 🌸 2026',
    sections: [
      {
        heading: 'Part A: Standard Properties of Definite Integrals',
        items: [
          'Q1. Evaluate ∫₀^(π/2) [sin³x / (sin³x + cos³x)] dx using King’s Property.',
          'Q2. Prove ∫₀^π [x·sin x / (1 + cos²x)] dx = π²/4.',
          'Q3. Find the value of ∫₋₁¹ ln[(2 - x)/(2 + x)] dx using odd/even function symmetry.',
        ],
      },
      {
        heading: 'Part B: Area Under Curves',
        items: [
          'Q4. Compute the area enclosed by the parabola y² = 4ax and its latus rectum x = a.',
          'Q5. Determine the area shared between the circle x² + y² = 16 and parabola y² = 6x.',
          'Q6. Find the area between y = sin x and y = cos x between x = 0 and x = π/2.',
        ],
      },
    ],
  },
  {
    id: 'pdf-pyq-03',
    title: 'NEET & JEE 10-Year PYQ Bank: Organic Reaction Mechanisms',
    subtitle: 'SN1 vs SN2, E1/E2 Eliminations & Carbonyl Condensations',
    subject: 'Chemistry',
    author: 'Dr. Neha Kapoor (Chemistry HoD)',
    category: 'pyq',
    date: 'Official Solved Archive',
    sections: [
      {
        heading: 'High-Yield Reactions & Named Conversions',
        items: [
          'Aldol Condensation: Enolate formation via α-hydrogen abstraction followed by nucleophilic addition to carbonyl.',
          'Cannizzaro Reaction: Non-enolizable aldehydes undergoing simultaneous oxidation and reduction in 50% NaOH.',
          'Reimer-Tiemann Reaction: Phenol + CHCl₃ + aq. KOH → Salicylaldehyde via dichlorocarbene intermediate.',
          'Hoffmann Bromamide Degradation: Primary amide + Br₂ + 4 KOH → Primary amine with one less carbon atom.',
        ],
      },
      {
        heading: 'Acidic & Basic Strength Trends',
        items: [
          'Carboxylic acids: -I / -M groups (e.g. -NO₂, -CF₃) increase acidity; +I groups decrease acidity.',
          'Substituted anilines: ortho-substituted anilines are weaker bases than aniline (Ortho Effect).',
        ],
      },
    ],
  },
  {
    id: 'pdf-notes-04',
    title: 'Genetics & Molecular Biology - Master Revision Notes',
    subtitle: 'DNA Replication, Transcription, Translation & Lac Operon',
    subject: 'Biology',
    author: 'Dr. Rajesh Verma (Biology Dept)',
    category: 'notes',
    date: 'Class 12 Medical Special',
    sections: [
      {
        heading: 'Central Dogma of Molecular Biology',
        items: [
          'DNA Replication: Semi-conservative (Meselson & Stahl experiment using ¹⁵N). Leading strand is continuous; lagging strand has Okazaki fragments.',
          'Transcription: RNA Polymerase II synthesizes hnRNA in 5’→3’ direction. Capping (m⁷Gppp) at 5’ end, Polyadenylation at 3’ end.',
          'Genetic Code: Triplet, degenerate, non-overlapping, unambiguous, and universal.',
          'Lac Operon: Inducible operon. Lactose / allolactose acts as inducer binding the repressor protein.',
        ],
      },
    ],
  },
];

/**
 * Generate full HTML markup for PDF document
 */
export function buildDocumentHTML(doc: PDFDocumentContent): string {
  const sectionsHTML = doc.sections
    .map(
      sec => `
      <div style="margin-top: 24px; padding: 18px; background: #fffcf7; border: 2px solid #f0e6dc; border-radius: 16px;">
        <h3 style="margin: 0 0 12px 0; color: #2d1f1d; font-size: 16px; font-weight: 800; border-bottom: 2px dashed #ffd5cc; padding-bottom: 6px;">
          ${sec.heading}
        </h3>
        <ul style="margin: 0; padding-left: 20px; color: #4a3b37; font-size: 13px; line-height: 1.8;">
          ${sec.items.map(item => `<li style="margin-bottom: 6px;">${item}</li>`).join('')}
        </ul>
      </div>
    `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${doc.title}</title>
        <style>
          @page { margin: 28mm 18mm 28mm 18mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #ffffff;
            color: #2d1f1d;
            margin: 0;
            padding: 24px;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #ff7d6b;
            padding-bottom: 20px;
            margin-bottom: 20px;
          }
          .tag {
            display: inline-block;
            background: #fff0ed;
            color: #ff7d6b;
            font-weight: 800;
            font-size: 11px;
            padding: 4px 14px;
            border-radius: 999px;
            border: 1px solid #ffd5cc;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .title {
            font-size: 24px;
            font-weight: 900;
            color: #2d1f1d;
            margin: 12px 0 6px 0;
            line-height: 1.25;
          }
          .subtitle {
            font-size: 13px;
            color: #7d6f6a;
            margin: 0 0 14px 0;
          }
          .meta {
            display: flex;
            justify-content: space-around;
            background: #fbf8f5;
            padding: 10px 16px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            color: #5d4f4b;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 11px;
            color: #a89993;
            border-top: 1px solid #eee;
            padding-top: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="tag">Acadly 🌸 Learning Library • ${doc.subject}</div>
          <h1 class="title">${doc.title}</h1>
          <p class="subtitle">${doc.subtitle}</p>
          <div class="meta">
            <div>👨‍🏫 <strong>Author:</strong> ${doc.author}</div>
            <div>📅 <strong>Edition:</strong> ${doc.date}</div>
            <div>📑 <strong>Type:</strong> ${doc.category.toUpperCase()}</div>
          </div>
        </div>

        ${sectionsHTML}

        <div class="footer">
          <p>Created with Acadly • Coaching & Tuition Management Platform 🌸</p>
          <p>For verified classroom use only. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate PDF file on device and trigger sharing or opening
 */
export async function generateAndSharePDF(doc: PDFDocumentContent): Promise<void> {
  try {
    const html = buildDocumentHTML(doc);
    const { uri } = await Print.printToFileAsync({ html });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `Download / Share ${doc.title}`,
      });
    } else {
      Alert.alert('PDF Created', `File saved to ${uri}`);
    }
  } catch (error: any) {
    Alert.alert('PDF Error', error?.message || 'Could not generate PDF.');
  }
}
