import { useEffect, useState } from 'react';
import { useHistoryStore } from '@/stores/historyStore';
import { ProcessingSession } from '@/types/supabase';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, Download, Eye, RefreshCw, FileDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { exportSessionToCSV, exportSessionsToCSV } from '@/utils/exportUtils';
import { SessionDetailsModal } from './SessionDetailsModal';
import { templates } from '@/utils/csvTemplates';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const HistoryTab = () => {
  const {
    sessions,
    isLoadingSessions,
    hasMoreSessions,
    fetchSessions,
    fetchMoreSessions,
    refreshAll,
    selectSession,
    selectedSessionImages,
    isLoadingImages
  } = useHistoryStore();

  const [selectedSession, setSelectedSession] = useState<ProcessingSession | null>(null);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("AdobeStock");

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleExport = async (session: ProcessingSession) => {
    setIsExporting(session.id);
    try {
      // First, load the images for this session if not already loaded
      await selectSession(session.id);
      
      // Wait for images to load
      if (selectedSessionImages.length > 0) {
        exportSessionToCSV(session, selectedSessionImages, selectedTemplate);
      }
    } catch (error) {
      console.error('Error exporting session:', error);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportAll = async () => {
    setIsExportingAll(true);
    try {
      exportSessionsToCSV(sessions);
    } catch (error) {
      console.error('Error exporting all sessions:', error);
    } finally {
      setIsExportingAll(false);
    }
  };

  const handleViewDetails = (session: ProcessingSession) => {
    setSelectedSession(session);
  };

  const handleCloseDetails = () => {
    setSelectedSession(null);
  };

  return (
    <div className="min-h-screen bg-background pl-72">
      <div className="max-w-[1500px] mx-auto p-8 relative">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary/90 to-primary bg-clip-text text-transparent">
              Processing History
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              View your image processing history for the last 30 days
            </p>
          </div>
          <div className="flex gap-4 items-center">
            {sessions.length > 0 && (
              <>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground mb-1">Export Template</span>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger className="w-[180px]">
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
                </div>
                <Button
                  variant="outline"
                  onClick={handleExportAll}
                  disabled={isExportingAll || isLoadingSessions}
                  className="h-10"
                >
                  {isExportingAll ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="mr-2 h-4 w-4" />
                  )}
                  Export All
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => refreshAll()}
              disabled={isLoadingSessions}
              className="h-10 w-10"
            >
              {isLoadingSessions ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <RefreshCw className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        <div className="rounded-xl border bg-card">
          {sessions.length === 0 && !isLoadingSessions ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No processing history found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Process some images to see your history here
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch Name</TableHead>
                      <TableHead className="text-center">Images</TableHead>
                      <TableHead className="text-center">Success Rate</TableHead>
                      <TableHead className="text-center">Credits Used</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => {
                      const successRate = session.image_count > 0
                        ? Math.round((session.success_count / session.image_count) * 100)
                        : 0;
                      
                      return (
                        <TableRow key={session.id}>
                          <TableCell className="font-medium">
                            {session.session_name}
                            <div className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{session.image_count}</TableCell>
                          <TableCell className="text-center">
                            <span
                              className={`inline-block px-2 py-1 rounded-full text-xs ${
                                successRate >= 90
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : successRate >= 70
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              }`}
                            >
                              {successRate}%
                            </span>
                          </TableCell>
                          <TableCell className="text-center">{session.credits_used}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewDetails(session)}
                                title="View Details"
                                className="hover:bg-primary/10"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleExport(session)}
                                disabled={isExporting === session.id}
                                title={`Export as ${selectedTemplate}`}
                                className="hover:bg-primary/10"
                              >
                                {isExporting === session.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {hasMoreSessions && (
                <div className="p-4 text-center border-t">
                  <Button
                    variant="outline"
                    onClick={() => fetchMoreSessions()}
                    disabled={isLoadingSessions}
                    className="w-[200px]"
                  >
                    {isLoadingSessions ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedSession && (
        <SessionDetailsModal
          session={selectedSession}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
};
