import { useEffect } from 'react';
import { useHistoryStore } from '@/stores/historyStore';
import { useProfileStore } from '@/stores/profileStore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { CategoryDistributionChart } from './CategoryDistributionChart';
import { KeywordCloudChart } from './KeywordCloudChart';

export const StatsTab = () => {
  const { userStats, isLoadingStats, fetchUserStats } = useHistoryStore();
  const { profile } = useProfileStore();

  useEffect(() => {
    fetchUserStats();
  }, [fetchUserStats]);

  const renderStatCard = (title: string, value: string | number, description: string) => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background pl-72">
      <div className="max-w-[1500px] mx-auto p-8 relative">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary/90 to-primary bg-clip-text text-transparent">
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Track your image processing statistics and usage
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchUserStats()}
            disabled={isLoadingStats}
            className="h-10 w-10"
          >
            {isLoadingStats ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <RefreshCw className="h-5 w-5" />
            )}
          </Button>
        </div>

        {isLoadingStats ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !userStats ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No statistics available</p>
            <p className="text-sm text-muted-foreground mt-2">
              Process some images to see your statistics here
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {renderStatCard(
                'Total Images',
                userStats.total_images_processed,
                'Total number of images processed'
              )}
              {renderStatCard(
                'Success Rate',
                userStats.total_images_processed > 0
                  ? `${Math.round(
                      (userStats.total_images_succeeded / userStats.total_images_processed) * 100
                    )}%`
                  : '0%',
                'Percentage of successfully processed images'
              )}
              {renderStatCard(
                'Credits Used',
                userStats.total_credits_used,
                'Total credits consumed'
              )}
              {renderStatCard(
                'Credits Remaining',
                profile?.credits || 0,
                'Available credits in your account'
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Category Distribution</CardTitle>
                  <CardDescription>
                    Distribution of images by category
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <CategoryDistributionChart 
                    data={userStats.category_distribution || {}} 
                  />
                </CardContent>
              </Card>

              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Popular Keywords</CardTitle>
                  <CardDescription>
                    Most frequently used keywords across your images
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                  <KeywordCloudChart 
                    data={userStats.common_keywords || {}} 
                  />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Usage</CardTitle>
                <CardDescription>
                  Images processed this month: {userStats.monthly_images_processed}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="w-full bg-muted rounded-full h-4">
                    <div
                      className="bg-primary h-4 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          (userStats.monthly_images_processed / 1000) * 100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <span className="ml-4 text-sm font-medium">
                    {userStats.monthly_images_processed} / 1000
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Monthly usage indicator (example limit of 1000 images)
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
