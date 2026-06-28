'use client';

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Question, QuestionStatus, QuestionDifficulty } from "@/types/question-shared";
import type { JobRole } from "@/types/recruiter";
import { Clock, Edit, Eye, Link as LinkIcon } from "lucide-react";

const statusColors: Record<QuestionStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-green-500/10 text-green-600 dark:text-green-400",
  archived: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const difficultyColors: Record<QuestionDifficulty, string> = {
  easy: "bg-green-500/10 text-green-600 dark:text-green-400",
  medium: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  hard: "bg-red-500/10 text-red-600 dark:text-red-400",
};

interface QuestionsTableProps {
  questions: Question[];
  getRolesByQuestionId: (questionId: string) => JobRole[];
}

export function QuestionsTable({ questions, getRolesByQuestionId }: QuestionsTableProps) {
  if (questions.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">No questions found</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Difficulty</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Attached To</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {questions.map((question) => {
          const attachedRoles = getRolesByQuestionId(question.id);
          return (
            <TableRow key={question.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{question.title}</div>
                  <div className="text-sm text-muted-foreground line-clamp-1">
                    {question.description}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={statusColors[question.status]} variant="secondary">
                  {question.status.charAt(0).toUpperCase() + question.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={difficultyColors[question.difficulty]} variant="secondary">
                  {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {question.role.charAt(0).toUpperCase() + question.role.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {question.timeConstraints?.limit} {question.timeConstraints?.unit}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <LinkIcon className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm">{attachedRoles.length} role{attachedRoles.length !== 1 ? "s" : ""}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/recruiters/questions/${question.id}`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href={`/recruiters/questions/${question.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
