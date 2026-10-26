import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SubpageShell, FormSection, AsideBlock } from '@/components/dashboard/Subpage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Instagram, Image, Check, ArrowRight, X, Upload, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

const TestInstagramScrape = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scrapedPhotos, setScrapedPhotos] = useState<string[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleScrape = async () => {
    if (!url.trim()) {
      toast.error('Please enter an Instagram URL');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('scrape-instagram', {
        body: { instagramUrl: url }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.success) {
        // Check if it's the "not supported" error
        if (data?.error?.includes('not currently supported')) {
          toast.error('Instagram scraping requires enterprise access. Please upload photos manually instead.');
        } else {
          throw new Error(data?.error || 'Failed to scrape Instagram');
        }
        return;
      }

      if (data.data?.photos?.length > 0) {
        setScrapedPhotos(data.data.photos);
        toast.success(`Found ${data.data.photos.length} photos!`);
      } else {
        toast.info('No photos found. Try uploading manually.');
      }
    } catch (error) {
      console.error('Scrape error:', error);
      toast.error('Instagram scraping is not available. Please upload photos manually.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    setIsUploading(true);
    const newPhotos: string[] = [];

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image`);
          continue;
        }

        const fileName = `${user.id}/${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from('vendor-photos')
          .upload(fileName, file);

        if (error) {
          console.error('Upload error:', error);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('vendor-photos')
          .getPublicUrl(data.path);

        newPhotos.push(urlData.publicUrl);
      }

      if (newPhotos.length > 0) {
        setUploadedPhotos(prev => [...prev, ...newPhotos]);
        toast.success(`Uploaded ${newPhotos.length} photo(s)!`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photos');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const togglePhotoSelection = (photo: string) => {
    setSelectedPhotos(prev => 
      prev.includes(photo) 
        ? prev.filter(p => p !== photo)
        : prev.length < 6 
          ? [...prev, photo]
          : prev
    );
  };

  const handleContinue = () => {
    sessionStorage.setItem('vendorScrapedPhotos', JSON.stringify(selectedPhotos));
    sessionStorage.setItem('vendorInstagramUrl', url);
    navigate('/vendor/create-profile');
  };

  const allPhotos = [...uploadedPhotos, ...scrapedPhotos];

  const slots = Array.from({ length: 6 }, (_, i) => selectedPhotos[i]);

  return (
    <SubpageShell
      backLabel="Back"
      onBack={() => navigate(-1)}
      eyebrow="Profile setup · step 2"
      title="Add your photos"
      subtitle="Pick up to six photos of your work. The first one becomes your cover on host storefronts."
      aside={
        <>
          <AsideBlock title="Your selection">
            <p className="font-display text-4xl tabular-nums text-foreground">{selectedPhotos.length}<span className="text-muted-foreground"> / 6</span></p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {slots.map((photo, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-lg border border-dashed border-white/15">
                  {photo && (
                    <>
                      <img src={photo} alt={`Selected ${i + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => togglePhotoSelection(photo)}
                        className="absolute right-1 top-1 rounded-full bg-background/80 p-0.5 text-foreground"
                        aria-label="Remove photo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  )}
                  {i === 0 && <span className="absolute bottom-1 left-1 rounded bg-background/80 px-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">Cover</span>}
                </div>
              ))}
            </div>
            <div className="mt-5 flex gap-2">
              <Button onClick={handleContinue} disabled={selectedPhotos.length === 0} className="gap-2">
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" onClick={() => navigate('/vendor/create-profile')} className="text-muted-foreground">
                Skip for now
              </Button>
            </div>
          </AsideBlock>
          <AsideBlock title="What works">
            <ul className="list-disc space-y-1.5 pl-4 text-muted-foreground">
              <li>Real guests mid-activity beat staged shots.</li>
              <li>Landscape photos crop best on storefront cards.</li>
            </ul>
          </AsideBlock>
        </>
      }
    >
      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />

      <section className="py-8">
        {allPhotos.length === 0 ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex aspect-[16/7] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/20 text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
          >
            {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
            <span className="font-display text-xl text-foreground">{isUploading ? "Uploading..." : "Choose photos from your computer"}</span>
            <span className="text-sm">JPG or PNG, up to six</span>
          </button>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg text-foreground">Choose which to show</h2>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="gap-2">
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Add more
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {allPhotos.map((photo, index) => (
                <button
                  type="button"
                  key={index}
                  className={`relative aspect-[4/3] overflow-hidden rounded-xl border-2 transition-all ${
                    selectedPhotos.includes(photo) ? 'border-primary' : 'border-transparent hover:border-white/30'
                  }`}
                  onClick={() => togglePhotoSelection(photo)}
                >
                  <img
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                    }}
                  />
                  {selectedPhotos.includes(photo) && (
                    <span className="absolute right-2 top-2 rounded-full bg-primary p-1 text-primary-foreground">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      <FormSection
        title="Import from Instagram"
        description="Beta. Pulls recent posts from a public profile. It doesn't work for every account, so uploading directly is more reliable."
      >
        <div className="flex gap-2">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://instagram.com/yourusername" className="flex-1" />
          <Button onClick={handleScrape} disabled={isLoading} variant="secondary">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Import'}
          </Button>
        </div>
      </FormSection>
    </SubpageShell>
  );
};

export default TestInstagramScrape;
