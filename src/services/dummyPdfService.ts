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
    date: 'Class 12 • JEE Advanced 2026',
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
  {
    id: 'pdf-photoelectric-05',
    title: 'Modern Physics & Quantum Optics - High Yield Bank',
    subtitle: 'Einstein Photoelectric Equation, de Broglie Waves & Bohr Radii',
    subject: 'Physics',
    author: 'Prof. Vikram Joshi (IIT Bombay)',
    category: 'formula_sheet',
    date: 'JEE Advanced High-Yield Pack',
    sections: [
      {
        heading: '1. Photoelectric Effect & Photons',
        items: [
          'Energy of photon: E = h·ν = (1240 / λ[nm]) eV',
          'Einstein Equation: K_max = h·ν - Φ = e·V₀ (where V₀ is stopping potential)',
          'de Broglie Wavelength: λ = h / p = h / √(2·m·K) = (12.27 / √V) Å for electrons',
        ],
      },
      {
        heading: '2. Bohr Model for Hydrogen-like Species',
        items: [
          'Radius of n-th orbit: r_n = 0.529 · (n² / Z) Å',
          'Velocity in n-th orbit: v_n = (2.18 × 10⁶) · (Z / n) m/s',
          'Total Energy: E_n = -13.6 · (Z² / n²) eV',
          'Rydberg Formula: 1 / λ = R · Z² · (1/n₁² - 1/n₂²)',
        ],
      },
    ],
  },
  {
    id: 'pdf-conics-06',
    title: 'Coordinate Geometry: Conic Sections Fast Track',
    subtitle: 'Parabola, Ellipse & Hyperbola Essentials, Tangents & Normals',
    subject: 'Mathematics',
    author: 'Dr. S. Ramanujan (Senior Faculty)',
    category: 'notes',
    date: 'JEE Rankers Special',
    sections: [
      {
        heading: '1. Standard Conic Equations & Eccentricity',
        items: [
          'Parabola (e = 1): y² = 4ax. Tangent in slope form: y = mx + a/m.',
          'Ellipse (e < 1): x²/a² + y²/b² = 1 where b² = a²(1 - e²). Tangent: y = mx ± √(a²m² + b²).',
          'Hyperbola (e > 1): x²/a² - y²/b² = 1 where b² = a²(e² - 1). Director circle is x² + y² = a² - b².',
        ],
      },
      {
        heading: '2. Common Tangent & Chord Shortcuts',
        items: [
          'Equation of chord with midpoint (x₁, y₁): T = S₁.',
          'Chord of contact from external point (x₁, y₁): T = 0.',
          'Pair of tangents from external point (x₁, y₁): S·S₁ = T².',
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
      <div style="margin-top: 20px; padding: 18px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h3 style="margin: 0 0 10px 0; color: #0f172a; font-size: 15px; font-weight: 700; border-bottom: 2px solid #2563eb; padding-bottom: 6px;">
          ${sec.heading}
        </h3>
        <ul style="margin: 0; padding-left: 20px; color: #334155; font-size: 13px; line-height: 1.8;">
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
          @page { margin: 24mm 18mm 24mm 18mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #ffffff;
            color: #0f172a;
            margin: 0;
            padding: 24px;
          }
          .header {
            text-align: left;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 18px;
            margin-bottom: 20px;
          }
          .tag {
            display: inline-block;
            background: #eff6ff;
            color: #1d4ed8;
            font-weight: 700;
            font-size: 11px;
            padding: 4px 12px;
            border-radius: 999px;
            border: 1px solid #bfdbfe;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .title {
            font-size: 22px;
            font-weight: 800;
            color: #0f172a;
            margin: 12px 0 6px 0;
            line-height: 1.25;
          }
          .subtitle {
            font-size: 13px;
            color: #64748b;
            margin: 0 0 14px 0;
          }
          .meta {
            display: flex;
            justify-content: space-between;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 10px 16px;
            border-radius: 10px;
            font-size: 12px;
            font-weight: 600;
            color: #334155;
          }
          .footer {
            margin-top: 36px;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="tag">Acadly Academic Publishing • ${doc.subject}</div>
          <h1 class="title">${doc.title}</h1>
          <p class="subtitle">${doc.subtitle}</p>
          <div class="meta">
            <div><strong>Faculty:</strong> ${doc.author}</div>
            <div><strong>Session:</strong> ${doc.date}</div>
            <div><strong>Category:</strong> ${doc.category.toUpperCase()}</div>
          </div>
        </div>

        ${sectionsHTML}

        <div class="footer">
          <p>Acadly Education Management Platform • Official Classroom Resource</p>
          <p>For enrolled student reference only. All rights reserved.</p>
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
