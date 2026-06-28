import { relations } from 'drizzle-orm';
import { jobRoles } from './job-roles';
import { questions } from './questions';
import { candidates } from './candidates';
import { invites } from './invites';
import { submissions } from './submissions';
import { roleQuestionAssignments } from './role-question-assignments';

export const jobRolesRelations = relations(jobRoles, ({ many }) => ({
  roleQuestionAssignments: many(roleQuestionAssignments),
  invites: many(invites),
}));

export const questionsRelations = relations(questions, ({ many }) => ({
  roleQuestionAssignments: many(roleQuestionAssignments),
  invites: many(invites),
  submissions: many(submissions),
}));

export const roleQuestionAssignmentsRelations = relations(roleQuestionAssignments, ({ one }) => ({
  role: one(jobRoles, {
    fields: [roleQuestionAssignments.roleId],
    references: [jobRoles.id],
  }),
  question: one(questions, {
    fields: [roleQuestionAssignments.questionId],
    references: [questions.id],
  }),
}));

export const candidatesRelations = relations(candidates, ({ many }) => ({
  invites: many(invites),
}));

export const invitesRelations = relations(invites, ({ one, many }) => ({
  candidate: one(candidates, {
    fields: [invites.candidateId],
    references: [candidates.id],
  }),
  role: one(jobRoles, {
    fields: [invites.roleId],
    references: [jobRoles.id],
  }),
  question: one(questions, {
    fields: [invites.questionId],
    references: [questions.id],
  }),
  submissions: many(submissions),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  invite: one(invites, {
    fields: [submissions.inviteId],
    references: [invites.id],
  }),
  question: one(questions, {
    fields: [submissions.questionId],
    references: [questions.id],
  }),
}));
