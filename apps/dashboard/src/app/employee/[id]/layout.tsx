import { notFound } from 'next/navigation';

import { getEmployee } from '@/lib/store';

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

  return children;
}
