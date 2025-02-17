
import { ImageMetadata } from '@/config/imageAnalysis';
import { CSVTemplate, getTemplate } from './csvTemplates';

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
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${templateName.toLowerCase()}_metadata_${new Date().toISOString()}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
