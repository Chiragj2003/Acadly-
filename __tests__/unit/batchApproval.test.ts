import { validateBatchApproval } from '@/lib/academicHelpers';

describe('Academic Helpers - Batch Approval Logic', () => {
  const validStudentUUID = 'e3b0c442-98fc-1c14-9afb-4c7fa4390001';
  const validBatchUUID = 'f4c1d553-09ad-2d25-0bec-5d8ab5400002';

  it('approves valid pending request with correct UUIDs', () => {
    const request = {
      id: 'req-01',
      status: 'pending',
      student_id: validStudentUUID,
    };

    const result = validateBatchApproval(request, validBatchUUID);
    expect(result.valid).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('rejects approval if request is already approved or rejected', () => {
    const request = {
      id: 'req-02',
      status: 'approved',
      student_id: validStudentUUID,
    };

    const result = validateBatchApproval(request, validBatchUUID);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Cannot approve request with status');
  });

  it('rejects approval if target batch ID is not a valid UUID', () => {
    const request = {
      id: 'req-03',
      status: 'pending',
      student_id: validStudentUUID,
    };

    // Mock string ID like 'batch-01' should fail
    const result = validateBatchApproval(request, 'batch-01');
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Invalid target batch UUID');
  });

  it('rejects approval if student ID is not a valid UUID', () => {
    const request = {
      id: 'req-04',
      status: 'pending',
      student_id: 'invalid-student-id',
    };

    const result = validateBatchApproval(request, validBatchUUID);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Invalid student UUID');
  });
});
