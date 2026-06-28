'use client';

import { Suspense, use, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useInviteResolution } from '@/hooks/invite-page/useInviteResolution';
import { useInviteStart } from '@/hooks/invite-landing/useInviteStart';
import { Briefcase, Clock, PlayCircle, User, Wifi, Timer, Bot, BarChart3 } from 'lucide-react';

export default function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  return (
    <Suspense>
      <InvitePageContent params={params} />
    </Suspense>
  );
}

function InvitePageContent({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const { data, isLoading, isError } = useInviteResolution(code);
  const { triggerInviteStart } = useInviteStart();
  const [accepted, setAccepted] = useState(false);

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center space-y-2">
            <h2 className="text-lg font-semibold">Invalid Invite Link</h2>
            <p className="text-sm text-muted-foreground">
              This invite link is invalid or has expired. Please contact your recruiter for a new link.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  const { questionId, invite, question } = data;
  const { candidate, roleName, timeConstraints } = invite;
  const timeLabel = timeConstraints ? `${timeConstraints.limit} ${timeConstraints.unit}` : null;

  const handleStartAssignment = () => {
    triggerInviteStart(invite, questionId, code);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-2xl w-full mx-auto p-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Image src="/logo.svg" alt="Crux" width={80} height={80} onError={() => {}} />
          </div>
          <h1 className="text-2xl font-semibold">Welcome, {candidate.name}</h1>
          <p className="text-muted-foreground text-sm">You have been invited to complete a technical assessment.</p>
        </div>

        {/* About This Assessment */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="font-semibold text-base">About This Assessment</h2>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {candidate.name}
              </Badge>
              {roleName && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {roleName}
                </Badge>
              )}
              {timeLabel && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeLabel}
                </Badge>
              )}
            </div>
            <div className="space-y-1">
              <p className="font-medium text-sm">{question.title}</p>
              {question.description && (
                <p className="text-sm text-muted-foreground">{question.description}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Before You Begin */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="font-semibold text-base">Before You Begin</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm">
                <Bot className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <span>
                  <strong>Crux</strong> is an AI-assisted coding assessment platform. You will complete a real-world engineering task in a live sandbox environment.
                </span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <BarChart3 className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <span>
                  Your submission is evaluated on <strong>architectural decisions</strong>, <strong>problem decomposition</strong>, and <strong>code reasoning</strong>. AI token usage and code quality are also tracked.
                </span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Timer className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <span>
                  {timeLabel ? <>You have <strong>{timeLabel}</strong> to complete the assessment.</> : <>Complete the assessment</>} The timer starts as soon as you click &quot;Start Assignment&quot;.
                </span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Wifi className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <span>Make sure you have a <strong>stable internet connection</strong> before starting. Disconnections may interrupt your session.</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Consent Gate */}
        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={accepted}
              onCheckedChange={(val) => setAccepted(!!val)}
              className="mt-0.5"
            />
            <span className="text-sm text-muted-foreground">
              I accept the{' '}
              <a href="#" className="underline text-foreground">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="underline text-foreground">Privacy Policy</a>
            </span>
          </label>
          <Button
            onClick={handleStartAssignment}
            disabled={!accepted}
            className="w-full"
            size="lg"
          >
            <PlayCircle className="mr-2 h-5 w-5" />
            Start Assignment
          </Button>
        </div>
      </div>
    </main>
  );
}
