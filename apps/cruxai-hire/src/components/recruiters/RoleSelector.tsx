'use client';

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { JobRole, RoleStatus } from "@/types/recruiter";
import { Briefcase, Plus, Search, X } from "lucide-react";

const statusColors: Record<RoleStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  open: "bg-green-500/10 text-green-600 dark:text-green-400",
  paused: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  closed: "bg-red-500/10 text-red-600 dark:text-red-400",
};

interface RoleSelectorProps {
  allRoles: JobRole[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function RoleSelector({
  allRoles,
  selectedIds,
  onSelectionChange,
  disabled = false,
}: RoleSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedIds);

  const selectedRoles = allRoles.filter((r) => selectedIds.includes(r.id));
  // Show all roles except closed ones for attachment
  const availableRoles = allRoles.filter((r) => r.status !== "closed");

  const filteredRoles = availableRoles.filter(
    (r) =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setTempSelectedIds(selectedIds);
      setSearchQuery("");
    }
    setOpen(newOpen);
  };

  const toggleRole = (roleId: string) => {
    setTempSelectedIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleConfirm = () => {
    onSelectionChange(tempSelectedIds);
    setOpen(false);
  };

  const handleRemove = (roleId: string) => {
    onSelectionChange(selectedIds.filter((id) => id !== roleId));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Attached to Roles ({selectedIds.length})</div>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={disabled}>
              <Plus className="mr-2 h-4 w-4" />
              Attach to Roles
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Attach Question to Roles</DialogTitle>
              <DialogDescription>
                Select roles to attach this question to. Only non-closed roles are shown.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search roles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <ScrollArea className="h-[400px] rounded-md border p-4">
                <div className="space-y-3">
                  {filteredRoles.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-8">
                      {searchQuery
                        ? "No roles match your search"
                        : "No available roles"}
                    </p>
                  ) : (
                    filteredRoles.map((role) => (
                      <label
                        key={role.id}
                        className="flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          checked={tempSelectedIds.includes(role.id)}
                          onCheckedChange={() => toggleRole(role.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{role.title}</span>
                            <Badge className={statusColors[role.status]} variant="secondary">
                              {role.status.charAt(0).toUpperCase() + role.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {role.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Briefcase className="h-3 w-3" />
                            {role.status}
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </ScrollArea>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{tempSelectedIds.length} role(s) selected</span>
                <span>{availableRoles.length} available roles</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirm}>
                Attach to {tempSelectedIds.length} Role{tempSelectedIds.length !== 1 ? "s" : ""}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {selectedRoles.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Not attached to any roles. Click &quot;Attach to Roles&quot; to add this question to roles.
        </p>
      ) : (
        <div className="space-y-2">
          {selectedRoles.map((role) => (
            <div
              key={role.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{role.title}</span>
                <Badge className={statusColors[role.status]} variant="secondary">
                  {role.status.charAt(0).toUpperCase() + role.status.slice(1)}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(role.id)}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
