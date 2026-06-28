'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RoleForm } from "@/components/recruiters/RoleForm";
import type { RoleFormData } from "@/types/recruiter";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useCreateRoleMutation } from "@/hooks/api/roles";
import { useQuestionsQuery } from "@/hooks/api/questions";

export default function NewRolePage() {
  const router = useRouter();
  const createRoleMutation = useCreateRoleMutation();
  const { data: allQuestions = [] } = useQuestionsQuery();

  const handleSubmit = async (data: RoleFormData, questionIds: string[]) => {
    await createRoleMutation.mutateAsync({ ...data, questionIds });
    toast.success("Role created successfully");
    router.push("/recruiters");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container max-w-2xl py-8">
          <div className="mb-6">
            <Link
              href="/recruiters"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Roles
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Create New Role</h1>
            <p className="text-muted-foreground">Add a new job role to start evaluating candidates</p>
          </div>

          <RoleForm
            onSubmit={handleSubmit}
            isSubmitting={createRoleMutation.isPending}
            allQuestions={allQuestions}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
