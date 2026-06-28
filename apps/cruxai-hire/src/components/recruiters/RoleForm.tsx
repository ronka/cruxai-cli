'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuestionSelector } from "@/components/recruiters/QuestionSelector";
import type { JobRole, RoleFormData, RoleStatus } from "@/types/recruiter";
import { ROLE_STATUSES } from "@/types/recruiter";
import { asEnum } from "@/lib/typeGuards";
import type { Question } from "@/types/question-shared";
import { useRoleForm } from "@/hooks/role-form/useRoleForm";
import { Save } from "lucide-react";

interface RoleFormProps {
  initialData?: Partial<JobRole>;
  onSubmit: (data: RoleFormData, questionIds: string[]) => void;
  isSubmitting?: boolean;
  allQuestions?: Question[];
}

export function RoleForm({ initialData, onSubmit, isSubmitting, allQuestions = [] }: RoleFormProps) {
  const {
    title,
    setTitle,
    description,
    setDescription,
    status,
    setStatus,
    questionIds,
    setQuestionIds,
    isValid,
    getFormData,
  } = useRoleForm(initialData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(getFormData(), questionIds);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Define the job role details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Role Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Senior Frontend Engineer"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the role responsibilities and requirements..."
              rows={4}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="status">Initial Status</Label>
              <Select value={status} onValueChange={(v) => { const s = asEnum(v, ROLE_STATUSES); if (s) setStatus(s); }}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Draft roles are not visible to candidates
              </p>
            </div>
          </div>

        </CardContent>
      </Card>

      {allQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Questions</CardTitle>
            <CardDescription>
              Attach questions from the library to this role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QuestionSelector
              allQuestions={allQuestions}
              selectedIds={questionIds}
              onSelectionChange={setQuestionIds}
              disabled={isSubmitting}
            />
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={!isValid || isSubmitting}>
          <Save className="mr-2 h-4 w-4" />
          {isSubmitting ? "Saving..." : "Save Role"}
        </Button>
      </div>
    </form>
  );
}
