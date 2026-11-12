import * as FileSystem from 'expo-file-system';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { base64ToArrayBuffer } from '@/lib/binaryUtils';
import { type StudyMaterial } from '@/types/database';

export interface PDFMaterialItem {
  id: string;
  subject: string;
  emoji: string;
  title: string;
  subtitle: string;
  category: 'notes' | 'formula_sheet' | 'pyq' | 'dpp';
  author: string;
  fileSizeBytes: string;
  createdAt: string;
  storagePath?: string;
}

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

/**
 * Upload a study material or DPP PDF to Supabase Storage:
 * - Validates file size <= 20 MB
 * - Validates PDF type
 * - Reads via expo-file-system
 * - Stores storage path (never local file://)
 */
export const uploadStudyMaterialFile = async (
  fileUri: string,
  fileName: string
): Promise<{ storagePath: string; fileSizeBytes: number }> => {
  if (!isSupabaseConfigured) {
    return { storagePath: `study-materials/${fileName}`, fileSizeBytes: 1024 * 1024 };
  }

  // 1. Validation: File extension
  if (!fileName.toLowerCase().endsWith('.pdf')) {
    throw new Error('Only PDF documents are accepted for study materials.');
  }

  // 2. Validation: File size
  const info = await FileSystem.getInfoAsync(fileUri);
  if (!info.exists) {
    throw new Error('Selected file could not be found on device storage.');
  }

  const fileSizeBytes = info.size ?? 0;
  if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File size (${(fileSizeBytes / (1024 * 1024)).toFixed(1)} MB) exceeds the maximum allowed 20 MB limit.`);
  }

  // 3. Read file as Base64 via expo-file-system
  const base64Data = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const arrayBuffer = base64ToArrayBuffer(base64Data);

  // 4. Generate clean storage path
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `${Date.now()}_${sanitizedName}`;

  // 5. Upload to Supabase Storage bucket 'study-materials'
  const { error } = await supabase.storage
    .from('study-materials')
    .upload(storagePath, arrayBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  return { storagePath, fileSizeBytes };
};

/**
 * Generate a secure time-limited signed URL for viewing a study material.
 */
export const getSignedMaterialUrl = async (
  storagePath: string,
  expiresInSeconds = 3600
): Promise<string> => {
  if (!isSupabaseConfigured || !storagePath) return '';

  // If already an HTTP/HTTPS URL, return as is
  if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
    return storagePath;
  }

  const { data, error } = await supabase.storage
    .from('study-materials')
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    console.warn('[MaterialService] Failed to create signed URL:', error?.message);
    return '';
  }

  return data.signedUrl;
};

/**
 * Fetch all study materials for an institute, optionally filtered by batch or category.
 */
export const getStudyMaterials = async (
  instituteId: string,
  batchId?: string,
  category?: string
): Promise<StudyMaterial[]> => {
  if (!isSupabaseConfigured || !instituteId) return [];

  let query = supabase
    .from('study_materials')
    .select('*')
    .eq('institute_id', instituteId)
    .order('created_at', { ascending: false });

  if (batchId) {
    query = query.or(`batch_id.eq.${batchId},batch_id.is.null`);
  }

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load study materials: ${error.message}`);
  }

  return (data || []) as StudyMaterial[];
};

/**
 * Create a study material record in database with storage path.
 */
export const createStudyMaterial = async (
  materialData: Omit<StudyMaterial, 'id' | 'created_at'>
): Promise<StudyMaterial> => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }

  const { data, error } = await supabase
    .from('study_materials')
    .insert(materialData)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to save study material: ${error.message}`);
  }

  return data as StudyMaterial;
};
