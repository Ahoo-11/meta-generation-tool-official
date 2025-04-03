import { useEffect, useState } from 'react';
import { useHistoryStore } from '@/stores/historyStore';
import { ProcessingSession } from '@/types/supabase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { exportSessionToCSV } from '@/utils/exportUtils';
import { templates } from '@/utils/csvTemplates';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SessionDetailsModalProps {
  session: ProcessingSession;
  onClose: () => void;
}

export const SessionDetailsModal = ({ session, onClose }: SessionDetailsModalProps) => {
  const {
    selectedSessionImages,
    isLoadingImages,
    selectSession,
  } = useHistoryStore();

  const [selectedTemplate, setSelectedTemplate] = useState("AdobeStock");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    selectSession(session.id);
  }, [session.id, selectSession]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      exportSessionToCSV(session, selectedSessionImages, selectedTemplate);
    } catch (error) {
      console.error('Error exporting session:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={!!session} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle>{session.session_name}</DialogTitle>
              <DialogDescription>
                Processed on {new Date(session.created_at).toLocaleString()}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.name} value={template.name}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isExporting || isLoadingImages || selectedSessionImages.length === 0}
              >
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Export
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 py-4">
          <div className="flex flex-col items-center p-2 bg-muted rounded-md">
            <span className="text-sm text-muted-foreground">Total Images</span>
            <span className="text-2xl font-bold">{session.image_count}</span>
          </div>
          <div className="flex flex-col items-center p-2 bg-muted rounded-md">
            <span className="text-sm text-muted-foreground">Success Rate</span>
            <span className="text-2xl font-bold">
              {session.image_count > 0
                ? Math.round((session.success_count / session.image_count) * 100)
                : 0}%
            </span>
          </div>
          <div className="flex flex-col items-center p-2 bg-muted rounded-md">
            <span className="text-sm text-muted-foreground">Credits Used</span>
            <span className="text-2xl font-bold">{session.credits_used}</span>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <h3 className="font-medium mb-2">Processed Images</h3>
          
          {isLoadingImages ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : selectedSessionImages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No images found for this session</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(80vh-250px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Keywords</TableHead>
                    <TableHead className="text-right">Processing Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedSessionImages.map((image) => (
                    <TableRow key={image.id}>
                      <TableCell className="font-medium">{image.file_name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={image.status === 'completed' ? 'default' : 'destructive'}
                        >
                          {image.status === 'completed' ? 'Success' : 'Failed'}
                        </Badge>
                      </TableCell>
                      <TableCell>{image.category || '-'}</TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {image.keywords && image.keywords.length > 0
                            ? image.keywords.slice(0, 3).join(', ') + 
                              (image.keywords.length > 3 ? ` +${image.keywords.length - 3} more` : '')
                            : '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {image.processing_time_ms
                          ? `${(image.processing_time_ms / 1000).toFixed(2)}s`
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
