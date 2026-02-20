import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Edit2, Trash2, X, BookOpen, Users, GraduationCap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import type { Group, Student } from "@/types/api";

const levels = ["1ère Année", "2ème Année", "3ème Année"];

const GroupsPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setPortalRoot(document.body);
  }, []);

  const [form, setForm] = useState({ name: "", level: levels[0] });

  const { data: groupsRes, isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: () => api.getGroups(),
  });

  const groups = groupsRes?.data ?? [];

  // Fetch students for expanded group
  const { data: groupStudentsRes } = useQuery({
    queryKey: ["group-students", expandedGroup],
    queryFn: () => api.getGroupStudents(expandedGroup!),
    enabled: !!expandedGroup,
  });

  const groupStudents: Student[] = groupStudentsRes?.data ?? [];

  const saveMutation = useMutation({
    mutationFn: (data: { id?: number; payload: any }) => {
      if (data.id) return api.updateGroup(data.id, data.payload);
      return api.createGroup(data.payload);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({ title: vars.id ? "Group Updated" : "Group Added", description: "Operation successful" });
      setDialogOpen(false);
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      setDeleteConfirm(null);
      toast({ title: "Group Deleted", description: "Group removed successfully" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const filtered = useMemo(() => {
    return groups.filter((g) => {
      const matchSearch = g.name.toLowerCase().includes(search.toLowerCase());
      const matchLevel = !levelFilter || g.level === levelFilter;
      return matchSearch && matchLevel;
    });
  }, [groups, search, levelFilter]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", level: levels[0] });
    setDialogOpen(true);
  };

  const openEdit = (g: Group) => {
    setEditing(g);
    setForm({ name: g.name, level: g.level });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast({ title: "Validation Error", description: "Group name is required", variant: "destructive" });
      return;
    }
    saveMutation.mutate({ id: editing?.id, payload: { name: form.name, level: form.level } });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Groups</h1>
          <p className="text-muted-foreground text-sm mt-1">{groups.length} groups registered</p>
        </div>
        <Button onClick={openAdd} className="btn-glow text-primary-foreground border-0 gap-2">
          <Plus className="w-4 h-4" /> Add Group
        </Button>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search groups..." className="pl-10 input-glass" />
        </div>
        <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="h-10 px-4 rounded-md bg-secondary/50 border border-white/[0.08] text-sm text-foreground appearance-none cursor-pointer min-w-[150px]">
          <option value="">All Levels</option>
          {levels.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {filtered.map((g, i) => {
            const isExpanded = expandedGroup === g.id;
            return (
              <motion.div key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.05 }} className="glass-panel p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold">{g.name}</h3>
                      <p className="text-xs text-muted-foreground">{g.level}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {deleteConfirm === g.id ? (
                      <>
                        <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(g.id)} className="h-7 text-xs">Confirm</Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(null)} className="h-7 text-xs">Cancel</Button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => openEdit(g)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleteConfirm(g.id)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className="w-4 h-4 text-muted-foreground" />
                    <span>{g.student_count} Students</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{g.teacher_count ?? 0} Teachers</span>
                  </div>
                </div>

                <button onClick={() => setExpandedGroup(isExpanded ? null : g.id)} className="text-xs text-primary hover:underline">
                  {isExpanded ? "Hide students" : "Show students"}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="space-y-2 pt-2 border-t border-border/50">
                        {groupStudents.length === 0 ? (
                          <p className="text-xs text-muted-foreground py-2">No students in this group</p>
                        ) : groupStudents.map((s) => (
                          <div key={s.id} className="flex items-center justify-between text-sm py-1.5">
                            <span>{s.first_name} {s.last_name}</span>
                            <span className="text-xs text-muted-foreground font-mono">{s.cne}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="glass-panel text-center py-12 text-muted-foreground">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No groups found</p>
        </div>
      )}

      {portalRoot && createPortal(
        <AnimatePresence>
          {dialogOpen && (
            <>
              <div onClick={() => setDialogOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.5)' }} />
              <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999, width: '90vw', maxWidth: '28rem' }} className="bg-card rounded-xl border border-border p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold text-lg">{editing ? "Edit Group" : "Add Group"}</h2>
                <button onClick={() => setDialogOpen(false)} className="p-1 hover:bg-secondary rounded-md text-muted-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm text-muted-foreground">Group Name</label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. DEV-301" className="input-glass" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted-foreground">Level</label>
                  <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="w-full h-10 rounded-md px-3 bg-secondary/50 border border-white/[0.08] text-sm text-foreground">
                    {levels.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={saveMutation.isPending} className="btn-glow text-primary-foreground border-0">
                  {saveMutation.isPending ? "Saving..." : editing ? "Update" : "Add"} Group
                </Button>
              </div>
              </div>
            </>
          )}
        </AnimatePresence>,
        portalRoot
      )}
    </div>
  );
};

export default GroupsPage;
