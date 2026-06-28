import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

export default function ThankYouPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto p-8 space-y-8">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Image src="/logo.svg" alt="Crux" width={80} height={80} />
          </div>
        </div>

        <Card>
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <h1 className="text-xl font-semibold">Assessment Submitted</h1>
            <p className="text-sm text-muted-foreground">
              Thank you for completing the assessment. Your submission has been recorded and the recruiter will be in touch with next steps.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
