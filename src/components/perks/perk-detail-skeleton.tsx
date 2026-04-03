import MainLayout from '@/components/layout/main-layout';
import { BrandSkeleton } from '@/components/ui/brand-skeleton';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

export default function perkDetailSkeleton() {
  return (
    <MainLayout>
       <div className="container max-w-2xl mx-auto p-4 py-8 md:py-12 min-h-screen">
        <BrandSkeleton className="h-4 w-32 mb-6 rounded-full opacity-40" />
        <Card className="overflow-hidden rounded-[2rem] border-primary/5 glass glass-dark shadow-premium relative">
          <BrandSkeleton className="aspect-[4/3] md:aspect-video w-full" />
          <div className='flex flex-col p-8 md:p-10'>
            <CardContent className="p-0 space-y-8">
               <div className="space-y-4">
                  <BrandSkeleton className="h-3 w-40 rounded-full" />
                  <div className="space-y-2">
                    <BrandSkeleton className="h-6 w-full rounded-lg" />
                    <BrandSkeleton className="h-6 w-3/4 rounded-lg" />
                  </div>
               </div>
               <BrandSkeleton className="h-16 w-full rounded-3xl" />
            </CardContent>
            <CardFooter className="p-0 mt-10">
              <BrandSkeleton className="h-16 w-full rounded-[1.5rem]" />
            </CardFooter>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}

