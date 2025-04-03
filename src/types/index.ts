import { categories } from '@/config/imageAnalysis';

// Define ImageCategory type locally
type ImageCategory = typeof categories[number];

export type ApiProvider = 'openrouter';

export interface ImageMetadata {
  fileName: string;
  keywords: string[];
  description: string;
  title: string;
  category: ImageCategory;
  success?: boolean;
  error?: string;
}

export interface MetadataResult extends ImageMetadata {
  success: boolean;
}

export interface ProgressInfo {
  totalImages: number;
  processedImages: number;
  successfulImages: number;
  failedImages: number;
  processingTimeMs: number;
  currentBatch?: number;
  totalBatches?: number;
  status: 'processing' | 'completed' | 'failed';
}

export interface BatchError {
  fileName: string;
  error: string | {
    name: string;
    message: string;
    stack?: string;
  };
  processingTime: number;
}

export interface BatchStats {
  batchNumber: number;
  size: number;
  successful: number;
  failed: number;
  timeMs: number;
  errors: BatchError[];
}

export interface GlobalStats {
  totalImages: number;
  successfulImages: number;
  failedImages: number;
  processingTimeMs: number;
  batchStats: BatchStats[];
}

export interface ProcessedImage {
  fileName: string;
  mimeType: string;
  base64Data: string;
  originalFile?: File;
} 