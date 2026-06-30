import { notFound } from 'next/navigation';

import { Header } from '@/components/Header';
import { getEmployee } from '@/lib/employees';

export default async function EmployeeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const employee = getEmployee(id);
  if (!employee) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-grain">
      <Header employee={employee} />
      {children}
    </div>
  );
}
