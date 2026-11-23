import React from 'react';
import { render } from '@testing-library/react-native';
import i18n from '@/i18n';
import { LanguageSwitcher } from '@/components/ui';

describe('i18n Hindi Rendering & English Literal Purge', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('hi');
  });

  afterAll(async () => {
    await i18n.changeLanguage('en');
  });

  it('renders LanguageSwitcher in Hindi mode with active Hindi label', async () => {
    const { getByText, getByLabelText } = await render(<LanguageSwitcher />);

    // The row label is translated
    expect(getByText('ऐप की भाषा')).toBeTruthy();

    // The Hindi option is the selected one; English is not
    expect(getByLabelText('हिन्दी में बदलें').props.accessibilityState).toEqual(expect.objectContaining({ selected: true }));
    expect(getByLabelText('Switch to English').props.accessibilityState).toEqual(expect.objectContaining({ selected: false }));
  });

  it('verifies that core academic, role, and attendance literals render in Hindi', () => {
    const t = i18n.t.bind(i18n);

    // Verify key translation returns valid Devanagari Hindi text
    expect(t('roles.student')).toBe('विद्यार्थी');
    expect(t('roles.teacher')).toBe('शिक्षक / संकाय');
    expect(t('roles.parent')).toBe('अभिभावक / माता-पिता');
    expect(t('roles.admin')).toBe('निदेशक / व्यवस्थापक');

    expect(t('attendance.title')).toBe('उपस्थिति एवं हाजिरी');
    expect(t('attendance.present')).toBe('उपस्थित');
    expect(t('attendance.absent')).toBe('अनुपस्थित');
    expect(t('attendance.late')).toBe('देर से');
    expect(t('attendance.markAllPresent')).toBe('सभी को उपस्थित चिह्नित करें');

    expect(t('academic.quiz')).toBe('इंटरएक्टिव क्विज');
    expect(t('academic.reportCard')).toBe('सत्र प्रगति रिपोर्ट कार्ड (PDF) डाउनलोड करें');
    expect(t('academic.exportData')).toBe('शैक्षणिक रिकॉर्ड (JSON) निर्यात करें');

    expect(t('common.save')).toBe('सहेजें');
    expect(t('common.cancel')).toBe('रद्द करें');
    expect(t('common.signOut')).toBe('साइन आउट');

    expect(t('auth.signIn')).toBe('साइन इन करें');
    expect(t('auth.signUp')).toBe('खाता बनाएं');
    expect(t('teacher.activeBatches')).toBe('सक्रिय बैच');
    expect(t('teacher.commitRollCall')).toBe('हाजिरी दर्ज करें');
    expect(t('student.home')).toBe('होम');

    // Assert that the raw English strings are completely absent
    const englishLiterals = [
      'Roll Call & Attendance',
      'Mark All Present',
      'Download Term Report Card (PDF)',
      'Export Academic Records (JSON)',
      'Active Batches',
      'Commit Roll Call',
    ];

    englishLiterals.forEach((eng) => {
      expect(t('attendance.title')).not.toEqual(eng);
      expect(t('academic.reportCard')).not.toEqual(eng);
      expect(t('academic.exportData')).not.toEqual(eng);
      expect(t('teacher.activeBatches')).not.toEqual(eng);
      expect(t('teacher.commitRollCall')).not.toEqual(eng);
    });
  });
});
