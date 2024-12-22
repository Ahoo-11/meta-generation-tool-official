import { UploadZone } from '@/components/UploadZone';
import { ImageGrid } from '@/components/ImageGrid';
import { MetadataPanel } from '@/components/MetadataPanel';
import { useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';

const Index = () => {
  const [selectedMetadata, setSelectedMetadata] = useState(null);
  const session = useSession();
  const supabase = useSupabaseClient();

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold tracking-tight mb-8 text-center">Image Meta-Generation</h1>
          <Auth 
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            theme="light"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-8 space-y-8 animate-fade-in">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Image Meta-Generation</h1>
            <p className="text-muted-foreground">
              Upload your images and let AI generate metadata for them.
            </p>
          </div>
          <button 
            onClick={() => supabase.auth.signOut()} 
            className="text-sm text-red-500 hover:text-red-600"
          >
            Sign Out
          </button>
        </div>

        <UploadZone />
        <ImageGrid />
      </main>

      <MetadataPanel
        metadata={selectedMetadata}
        onClose={() => setSelectedMetadata(null)}
      />
    </div>
  );
};

export default Index;