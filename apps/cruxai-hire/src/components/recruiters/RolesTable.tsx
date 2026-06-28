'use client';

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { JobRole, RoleStatus } from "@/types/recruiter";
import { MoreHorizontal, Pencil, Trash2, Pause, Play, Archive } from "lucide-react";

const statusColors: Record<RoleStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  open: "bg-green-500/10 text-green-600 dark:text-green-400",
  paused: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  closed: "bg-red-500/10 text-red-600 dark:text-red-400",
};

interface RolesTableProps {
  roles: JobRole[];
  onEditRole?: (role: JobRole) => void;
  onDeleteRole?: (role: JobRole) => void;
  onStatusChange?: (roleId: string, status: RoleStatus) => void;
}

export function RolesTable({
  roles,
  onEditRole,
  onDeleteRole,
  onStatusChange,
}: RolesTableProps) {
  const router = useRouter();

  const handleRowClick = (role: JobRole, e: React.MouseEvent) => {
    // Don't navigate if clicking on the actions menu
    if ((e.target as HTMLElement).closest('[data-actions-menu]')) {
      return;
    }
    router.push(`/recruiters/roles/${role.id}`);
  };

  const getStatusActions = (role: JobRole) => {
    const actions: { label: string; icon: typeof Play; status: RoleStatus }[] = [];

    switch (role.status) {
      case 'draft':
        actions.push({ label: 'Open Role', icon: Play, status: 'open' });
        break;
      case 'open':
        actions.push({ label: 'Pause Role', icon: Pause, status: 'paused' });
        actions.push({ label: 'Close Role', icon: Archive, status: 'closed' });
        break;
      case 'paused':
        actions.push({ label: 'Resume Role', icon: Play, status: 'open' });
        actions.push({ label: 'Close Role', icon: Archive, status: 'closed' });
        break;
      case 'closed':
        actions.push({ label: 'Reopen Role', icon: Play, status: 'open' });
        break;
    }

    return actions;
  };

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => (
            <TableRow
              key={role.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={(e) => handleRowClick(role, e)}
            >
              <TableCell className="font-medium">{role.title}</TableCell>
              <TableCell>
                <Badge className={statusColors[role.status]} variant="secondary">
                  {role.status.charAt(0).toUpperCase() + role.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(role.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell data-actions-menu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEditRole && (
                      <DropdownMenuItem onClick={() => onEditRole(role)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {onStatusChange && getStatusActions(role).map((action) => (
                      <DropdownMenuItem
                        key={action.status}
                        onClick={() => onStatusChange(role.id, action.status)}
                      >
                        <action.icon className="mr-2 h-4 w-4" />
                        {action.label}
                      </DropdownMenuItem>
                    ))}
                    {onDeleteRole && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDeleteRole(role)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {roles.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                No roles found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
