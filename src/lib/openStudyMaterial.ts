import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { getSignedMaterialUrl } from '@/services/materialService';

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
