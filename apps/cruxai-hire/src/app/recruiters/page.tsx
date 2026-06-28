'use client';

import { Suspense, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardStats } from "@/components/recruiters/DashboardStats";
import { RolesTable } from "@/components/recruiters/RolesTable";
import { DeleteRoleDialog } from "@/components/recruiters/DeleteRoleDialog";
import { InviteCandidateDialog } from "@/components/recruiters/InviteCandidateDialog";
import { RecentActivity } from "@/components/recruiters/RecentActivity";
import { SendQuestionToCandidateDialog } from "@/components/recruiters/SendQuestionToCandidateDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Candidate, JobRole, RoleStatus } from "@/types/recruiter";
import { Library, MoreHorizontal, Plus, Search, Send, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTabSearchParam } from "@/hooks/tabs/useTabSearchParam";
import { useRolesQuery, useDeleteRoleMutation, useUpdateRoleStatusMutation } from "@/hooks/api/roles";
import { useCandidatesQuery } from "@/hooks/api/candidates";
import { useInvitesQuery } from "@/hooks/api/invites";
import { useSubmissionsQuery } from "@/hooks/api/submissions";

export default function RecruitersPage() {
  return (
    <Suspense>
      <RecruitersContent />
    </Suspense>
  );
}

function RecruitersContent() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useTabSearchParam("roles");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleToDelete, setRoleToDelete] = useState<JobRole | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [sendQuestionCandidate, setSendQuestionCandidate] = useState<Candidate | null>(null);

  const { data: roles = [], isLoading: rolesLoading } = useRolesQuery();
  const deleteRoleMutation = useDeleteRoleMutation();
  const updateRoleStatusMutation = useUpdateRoleStatusMutation();

  const { data: candidates = [] } = useCandidatesQuery();
  const { data: invites = [] } = useInvitesQuery();
  const { data: submissions = [] } = useSubmissionsQuery();

  const filteredRoles = roles.filter((role) => {
    const matchesSearch =
      role.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || role.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openRolesCount = roles.filter((r) => r.status === 'open').length;
  const totalCandidates = candidates.length;
  const pendingReviews = submissions.filter((s) => s.status === 'submitted').length;

  const handleDeleteRole = (role: JobRole) => {
    setRoleToDelete(role);
  };

  const confirmDeleteRole = async () => {
    if (roleToDelete) {
      await deleteRoleMutation.mutateAsync({ id: roleToDelete.id });
      toast.success(`Role "${roleToDelete.title}" deleted successfully`);
      setRoleToDelete(null);
    }
  };

  const handleStatusChange = async (roleId: string, status: RoleStatus) => {
    await updateRoleStatusMutation.mutateAsync({ id: roleId, status });
    const statusLabels: Record<RoleStatus, string> = {
      draft: 'Draft',
      open: 'Open',
      paused: 'Paused',
      closed: 'Closed',
    };
    toast.success(`Role status updated to ${statusLabels[status]}`);
  };

  if (rolesLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1">
          <div className="container py-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <div className="h-9 w-48 animate-pulse rounded bg-muted" />
                <div className="mt-2 h-5 w-64 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-10 w-28 animate-pulse rounded bg-muted" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Job Roles</h1>
              <p className="mt-1 text-muted-foreground">Manage hiring processes and candidate evaluations</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/recruiters/questions">
                  <Library className="mr-2 h-4 w-4" />
                  Questions Library
                </Link>
              </Button>
              <Button asChild>
                <Link href="/recruiters/roles/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Role
                </Link>
              </Button>
            </div>
          </div>

          <div className="mb-8">
            <DashboardStats
              totalRoles={roles.length}
              openRoles={openRolesCount}
              totalCandidates={totalCandidates}
              pendingReviews={pendingReviews}
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="roles">Roles</TabsTrigger>
              <TabsTrigger value="candidates">Candidates</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-lg font-semibold">Recent Activity</h3>
                  <RecentActivity
                    invites={invites}
                    submissions={submissions}
                    candidates={candidates}
                    roles={roles}
                    limit={8}
                  />
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Quick Actions</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/recruiters/roles/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Create New Role
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setInviteDialogOpen(true)}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add Candidate
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="roles" className="space-y-6">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search roles or recruiters..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <RolesTable
                roles={filteredRoles}
                onDeleteRole={handleDeleteRole}
                onStatusChange={handleStatusChange}
              />
            </TabsContent>

            <TabsContent value="candidates" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Candidates</h3>
                  <p className="text-sm text-muted-foreground">
                    {totalCandidates} total candidates in your hiring pipeline
                  </p>
                </div>
                <Button onClick={() => setInviteDialogOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Candidate
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  {candidates.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Added</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead className="w-12" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {candidates.map((candidate) => (
                          <TableRow
                            key={candidate.id}
                            className="cursor-pointer"
                            onClick={() => router.push(`/recruiters/candidates/${candidate.id}`)}
                          >
                            <TableCell className="font-medium">{candidate.name}</TableCell>
                            <TableCell className="text-muted-foreground">{candidate.email}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(candidate.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="max-w-sm truncate text-muted-foreground">
                              {candidate.notes ?? "-"}
                            </TableCell>
                            <TableCell
                              className="w-12 text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Actions for ${candidate.name}`}
                                    className="h-8 w-8"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onSelect={() => setSendQuestionCandidate(candidate)}
                                  >
                                    <Send className="mr-2 h-4 w-4" />
                                    Send question
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <h3 className="text-lg font-semibold">No candidates yet</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Add candidates here, then assign them to roles in the questions flow.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />

      <DeleteRoleDialog
        role={roleToDelete}
        open={!!roleToDelete}
        onOpenChange={(open) => !open && setRoleToDelete(null)}
        onConfirm={confirmDeleteRole}
      />

      <InviteCandidateDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
      />

      {sendQuestionCandidate && (
        <SendQuestionToCandidateDialog
          open
          onOpenChange={(open) => !open && setSendQuestionCandidate(null)}
          candidateId={sendQuestionCandidate.id}
          candidateName={sendQuestionCandidate.name}
        />
      )}
    </div>
  );
}
