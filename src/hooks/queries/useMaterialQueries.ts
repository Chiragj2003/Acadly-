import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getStudyMaterials,
  createStudyMaterial,
  uploadStudyMaterialFile,
  getSignedMaterialUrl,
  PDFMaterialItem,
} from '@/services/materialService';
import { INITIAL_PDF_MATERIALS } from '@/data/dummyAcademicData';
import { type StudyMaterial } from '@/types/database';

export const MATERIALS_QUERY_KEY = 'study_materials';

export function useStudyMaterials(
  instituteId?: string,
  batchId?: string,
  category?: string
) {
  return useQuery<PDFMaterialItem[]>({
    queryKey: [MATERIALS_QUERY_KEY, instituteId, batchId, category],
    queryFn: async () => {
      const rows = await getStudyMaterials(instituteId!, batchId, category);
      if (rows && rows.length > 0) {
        return rows.map((r) => ({
          id: r.id,
          subject: 'Subject',
          emoji: '📄',
          title: r.title,
          subtitle: r.description || 'Study document',
          category: (r.category as any) || 'notes',
          author: 'Faculty Mentor',
          fileSizeBytes: r.file_size_bytes
            ? `${(r.file_size_bytes / (1024 * 1024)).toFixed(1)} MB PDF`
            : '1.8 MB PDF',
          createdAt: 'Recently',
          storagePath: r.file_url,
        }));
      }
      if (__DEV__) {
        return INITIAL_PDF_MATERIALS;
      }
      return [];
    },
    enabled: Boolean(instituteId || __DEV__),
  });
}

export function useUploadMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      fileUri: string;
      fileName: string;
      title: string;
      subjectId?: string;
      batchId?: string;
      instituteId: string;
      category?: any;
      description?: string;
      uploadedBy: string;
    }) => {
      const { storagePath, fileSizeBytes } = await uploadStudyMaterialFile(
        params.fileUri,
        params.fileName
      );

      return createStudyMaterial({
        institute_id: params.instituteId,
        batch_id: params.batchId,
        subject_id: params.subjectId,
        title: params.title,
        subject: 'General',
        description: params.description,
        category: params.category || 'notes',
        file_url: storagePath,
        file_type: 'pdf',
        file_size_bytes: fileSizeBytes,
        file_size_formatted: `${(fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`,
        uploaded_by: params.uploadedBy,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [MATERIALS_QUERY_KEY, variables.instituteId],
      });
    },
  });
}

export function useSignedMaterialUrl(storagePath?: string) {
  return useQuery({
    queryKey: ['signed_material_url', storagePath],
    queryFn: () => getSignedMaterialUrl(storagePath!),
    enabled: Boolean(storagePath),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}
