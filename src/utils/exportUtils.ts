
interface ImageMetadata {
  fileName: string;
  metadata?: string;
  error?: string;
  success: boolean;
}

export const exportToCSV = (data: ImageMetadata[]) => {
  // Define CSV headers
  const headers = ['File Name', 'Success', 'Metadata', 'Error'];
  
  // Convert data to CSV rows
  const rows = data.map(item => [
    item.fileName,
    item.success.toString(),
    item.metadata || '',
    item.error || ''
  ]);
  
  // Combine headers and rows, ensuring all values are strings before replace
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `image_metadata_${new Date().toISOString()}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
