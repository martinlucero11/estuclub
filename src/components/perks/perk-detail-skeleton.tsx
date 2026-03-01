import MainLayout from '@/components/layout/main-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

export default function PerkDetailSkeleton() {
  return (
    <MainLayout>
      <div className="p-4 md:p-8">
        <Card className="overflow-hidden">
          <Skeleton className="h-64 w-full md:h-80" />
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-1/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-6 w-1/3" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-12 w-48" />
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
}
