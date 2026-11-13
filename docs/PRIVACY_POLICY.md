# Acadly Privacy Policy & AI Data Handling Disclosure

**Effective Date:** November 2026  
**Last Updated:** November 2026

## 1. Overview
Acadly ("we", "our", or "the platform") is dedicated to protecting the privacy, security, and academic integrity of educators, students, and parents. This policy outlines our collection, storage, and processing practices, specifically emphasizing our artificial intelligence (AI) integration with Google Gemini.

---

## 2. Artificial Intelligence & Third-Party LLM Disclosure

Acadly incorporates Google Gemini API to empower educators with:
1. **Automated Quiz Draft Generation**: Creating conceptual draft multiple-choice questions from teacher notes, curriculum outlines, or lecture transcripts.
2. **Formative Submission Evaluation Assistance**: Providing initial suggestions for numerical and written derivation scores with constructive feedback.

### Zero-PII (Personally Identifiable Information) Transmission Guarantee
> **Short Disclosure:**  
> *"Acadly uses Google Gemini API to analyze academic notes and suggest grading feedback. No student personally identifiable information (PII) is shared with AI models."*

When interacting with the Google Gemini API:
- **No Student PII is Transmitted**: Student names, email addresses, phone numbers, roll numbers, institute IDs, parent details, and internal user UUIDs are strictly stripped before invoking AI evaluation endpoints.
- **Content Scoping**: Only raw assignment prompts, teacher-supplied evaluation rubrics, and the academic content of the written submission are transmitted.
- **Ephemeral Processing**: Submissions sent to Google Gemini are evaluated under enterprise API terms and are not retained or utilized to train general foundation models.
- **Untrusted Input Boundaries**: All student text is compartmentalized and guarded against prompt injection. AI suggestions are strictly advisory.

---

## 3. Human-in-the-Loop Teacher Authority
- **Zero Auto-Publishing**: Quizzes generated with AI are strictly created as editable drafts. Faculty members review, edit, and approve every question, option, and explanation before publishing.
- **Teacher-Approved Grades**: AI grading suggestions are categorized under a `pending_review` status. Students are displayed an advisory notice (*"AI-checked, awaiting teacher review"*). No AI score is finalized or published until the teacher explicitly reviews, adjusts, and confirms the grade. The final grade remains solely the teacher's professional assessment.

---

## 4. Daily Usage Quotas & Rate Safeguards
- Faculty accounts are governed by a fair-usage daily quota (default: 25 AI calls per calendar day) enforced atomically at the database layer.
- Rate-limited calls employ automated exponential backoff to ensure predictable platform performance.

---

## 5. Contact & Data Subject Rights
Users may request data exports or invoke their right to account deletion at any time via the Acadly application settings. All associated data is deleted in accordance with data protection regulations.
