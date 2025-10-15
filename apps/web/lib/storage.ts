/**
 * Firebase Storage Helper
 * 
 * This module provides utilities for storing and retrieving documents
 * from Firebase Storage, including PDF documents from airSlate.
 */

import { storage } from "@/lib/firebase";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  getMetadata,
} from "firebase/storage";

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface StorageResult {
  path: string;
  downloadUrl: string;
  size: number;
  contentType: string;
}

/**
 * Upload a file to Firebase Storage
 */
export async function uploadFile(
  path: string,
  file: File | Blob,
  options?: UploadOptions
): Promise<StorageResult> {
  try {
    const storageRef = ref(storage, path);

    // Upload file
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: options?.contentType || "application/octet-stream",
      customMetadata: options?.metadata,
    });

    // Get download URL
    const downloadUrl = await getDownloadURL(snapshot.ref);

    return {
      path: snapshot.ref.fullPath,
      downloadUrl,
      size: snapshot.metadata.size,
      contentType: snapshot.metadata.contentType || "application/octet-stream",
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

/**
 * Download a file from a URL and upload to Firebase Storage
 */
export async function downloadAndUpload(
  sourceUrl: string,
  destinationPath: string,
  options?: UploadOptions
): Promise<StorageResult> {
  try {
    // Download file from source URL
    const response = await fetch(sourceUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const blob = await response.blob();

    // Upload to Firebase Storage
    return await uploadFile(destinationPath, blob, {
      contentType: options?.contentType || response.headers.get("content-type") || "application/octet-stream",
      metadata: options?.metadata,
    });
  } catch (error) {
    console.error("Error downloading and uploading file:", error);
    throw error;
  }
}

/**
 * Get download URL for a file
 */
export async function getFileUrl(path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error("Error getting file URL:", error);
    throw error;
  }
}

/**
 * Delete a file from Firebase Storage
 */
export async function deleteFile(path: string): Promise<void> {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
}

/**
 * Get file metadata
 */
export async function getFileMetadata(path: string) {
  try {
    const storageRef = ref(storage, path);
    return await getMetadata(storageRef);
  } catch (error) {
    console.error("Error getting file metadata:", error);
    throw error;
  }
}

/**
 * Generate a storage path for a form document
 */
export function generateFormDocumentPath(
  orgId: string,
  category: string,
  submissionId: string,
  filename: string = "document.pdf"
): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  
  return `orgs/${orgId}/forms/${category}/${year}/${month}/${submissionId}/${filename}`;
}

/**
 * Store airSlate document in Firebase Storage
 */
export async function storeAirSlateDocument(
  airslateDownloadUrl: string,
  orgId: string,
  category: string,
  submissionId: string,
  metadata?: Record<string, string>
): Promise<StorageResult> {
  try {
    const storagePath = generateFormDocumentPath(
      orgId,
      category,
      submissionId,
      "document.pdf"
    );

    return await downloadAndUpload(airslateDownloadUrl, storagePath, {
      contentType: "application/pdf",
      metadata: {
        source: "airslate",
        orgId,
        category,
        submissionId,
        uploadedAt: new Date().toISOString(),
        ...metadata,
      },
    });
  } catch (error) {
    console.error("Error storing airSlate document:", error);
    throw error;
  }
}

/**
 * Generate a signed URL with expiration
 * Note: This requires Firebase Storage rules to be configured properly
 */
export async function generateSignedUrl(
  path: string,
  expirationMinutes: number = 60
): Promise<string> {
  try {
    // Firebase Storage getDownloadURL already returns a long-lived token URL
    // For true signed URLs with custom expiration, you'd need to use
    // Firebase Admin SDK on the server side
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error("Error generating signed URL:", error);
    throw error;
  }
}

/**
 * Batch delete files
 */
export async function deleteFiles(paths: string[]): Promise<void> {
  try {
    await Promise.all(paths.map((path) => deleteFile(path)));
  } catch (error) {
    console.error("Error deleting files:", error);
    throw error;
  }
}

/**
 * Check if file exists
 */
export async function fileExists(path: string): Promise<boolean> {
  try {
    await getFileMetadata(path);
    return true;
  } catch (error: any) {
    if (error.code === "storage/object-not-found") {
      return false;
    }
    throw error;
  }
}
