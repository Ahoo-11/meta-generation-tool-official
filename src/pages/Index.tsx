import { ImageUploader } from '@/components/ImageUploader';

const Index = () => {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-8 text-center">
          Image Meta-Generation
        </h1>
        <ImageUploader />
      </div>
    </div>
  );
};

export default Index;