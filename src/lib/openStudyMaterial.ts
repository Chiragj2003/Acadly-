import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { getSignedMaterialUrl } from '@/services/materialService';
import { supabase } from '@/lib/supabase';

/**
 * Open the real uploaded file for a study material (via a short-lived signed URL).
 * Replaces the old behaviour of showing a generated sample PDF picked by subject.
 */
export async function openStudyMaterial(storagePath?: string): Promise<boolean> {
  try {
    const url = storagePath ? await getSignedMaterialUrl(storagePath) : '';
    if (!url) {
      Alert.alert('Not available', 'This file could not be opened. Ask your teacher to upload it again.');
      return false;
    }
    await WebBrowser.openBrowserAsync(url);
    return true;
  } catch {
    Alert.alert('Not available', 'This file could not be opened right now. Please try again.');
    return false;
  }
}

/** Open a student's uploaded answer sheet from the private student-submissions bucket. */
export async function openSubmissionFile(storagePath?: string): Promise<boolean> {
  try {
    if (!storagePath) {
      Alert.alert('No file', 'This submission has no uploaded file.');
      return false;
    }
    const url = storagePath.startsWith('http')
      ? storagePath
      : (await supabase.storage.from('student-submissions').createSignedUrl(storagePath, 3600)).data?.signedUrl;
    if (!url) {
      Alert.alert('Not available', 'This file could not be opened.');
      return false;
    }
    await WebBrowser.openBrowserAsync(url);
    return true;
  } catch {
    Alert.alert('Not available', 'This file could not be opened right now. Please try again.');
    return false;
  }
}
