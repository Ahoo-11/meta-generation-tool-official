import { categories } from '@/config/imageAnalysis';
import { CSVTemplate, getTemplate } from './csvTemplates';
import { ProcessedImage, ProcessingSession } from '@/types/supabase';
import { ImageMetadata } from '@/types';

// Define ImageCategory type locally
type ImageCategory = typeof categories[number];

interface ExportResult {
  fileName: string;
  metadata?: ImageMetadata;
  error?: string;
  success: boolean;
}

export const exportToCSV = (data: ExportResult[], templateName: string = "AdobeStock") => {
  const template = getTemplate(templateName);
  if (!template) {
    throw new Error(`Template ${templateName} not found`);
  }

  // Convert data to CSV rows
  const rows = data.map(item => {
    if (!item.success || !item.metadata) {
      return template.headers.map(() => '');
    }
    const formattedData = template.formatData(item.metadata, item.fileName);
    return template.headers.map(header => formattedData[header] || '');
  });

  // Combine headers and rows
  const csvContent = [
    template.headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadCSV(blob, `${templateName.toLowerCase()}_metadata_${new Date().toISOString()}.csv`);
};

/**
 * Export processing session data to CSV
 */
export const exportSessionToCSV = (session: ProcessingSession, images: ProcessedImage[], templateName: string = "AdobeStock") => {
  const template = getTemplate(templateName);
  if (!template) {
    throw new Error(`Template ${templateName} not found`);
  }

  // Convert images to CSV rows
  const rows = images
    .filter(image => image.status === 'completed') // Only include successfully processed images
    .map(image => {
      const metadata: ImageMetadata = {
        title: image.title || '',
        description: image.description || '',
        keywords: image.keywords || [],
        category: (image.category || 'Graphic Resources') as ImageCategory,
        fileName: image.file_name,
      };
      const formattedData = template.formatData(metadata, image.file_name);
      return template.headers.map(header => formattedData[header] || '');
    });

  // Combine headers and rows
  const csvContent = [
    template.headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadCSV(blob, `${templateName.toLowerCase()}_metadata_${new Date().toISOString()}.csv`);
};

/**
 * Export multiple sessions summary to CSV
 */
export const exportSessionsToCSV = (sessions: ProcessingSession[]) => {
  // Define headers for the sessions summary CSV
  const headers = [
    'Session ID',
    'Session Name',
    'Date',
    'Total Images',
    'Success Count',
    'Failure Count',
    'Success Rate',
    'Credits Used',
    'API Provider'
  ];

  // Convert sessions to CSV rows
  const rows = sessions.map(session => {
    const successRate = session.image_count > 0
      ? Math.round((session.success_count / session.image_count) * 100)
      : 0;
    
    return [
      session.id,
      session.session_name,
      new Date(session.created_at).toLocaleString(),
      session.image_count,
      session.success_count,
      session.image_count - session.success_count,
      `${successRate}%`,
      session.credits_used,
      'OpenRouter'
    ];
  });

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadCSV(blob, `processing_sessions_${new Date().toISOString()}.csv`);
};

/**
 * Helper function to download a CSV blob
 */
const downloadCSV = (blob: Blob, filename: string) => {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
