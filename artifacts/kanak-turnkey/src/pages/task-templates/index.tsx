import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListTaskTemplates,
  useGetTaskTemplate,
  useCreateTaskTemplate,
  useDeleteTaskTemplate,
  useCreateTaskTemplateItem,
  useDeleteTaskTemplateItem,
  getListTaskTemplatesQueryKey,
  getGetTaskTemplateQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown, ChevronRight, Plus, Trash2, LayoutTemplate, Star, ListChecks,
} from "lucide-react";

const PROJECT_TYPES = ["Residential", "Commercial", "Industrial", "MEP", "Infrastructure", "Renovation", "Other"];
const PRIORITY_BADGE: Record<string, "destructive" | "secondary" | "outline"> = {
  high: "destructive", medium: "secondary", low: "outline",
};

function TemplateDetail({ templateId }: { templateId: number }) {
  const qc = useQueryClient();
  const { data, isLoading } = useGetTaskTemplate(templateId, {
    query: { queryKey: getGetTaskTemplateQueryKey(templateId) },
  });
  const addItem = useCreateTaskTemplateItem();
  const removeItem = useDeleteTaskTemplateItem();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: "", phase: "", priority: "medium", estimatedDays: "" });

  const phases = data?.items
    ? Array.from(new Set(data.items.map(i => i.phase ?? "General"))).sort()
    : [];

  const handleAdd = async () => {
    if (!form.title.trim()) return;
    await addItem.mutateAsync({
      id: templateId,
      data: {
        title: form.title,
        phase: form.phase || null,
        priority: form.priority as "high" | "medium" | "low",
        estimatedDays: form.estimatedDays ? parseInt(form.estimatedDays) : null,
      },
    });
    await qc.invalidateQueries({ queryKey: getGetTaskTemplateQueryKey(templateId) });
    await qc.invalidateQueries({ queryKey: getListTaskTemplatesQueryKey() });
    setAddOpen(false);
    setForm({ title: "", phase: "", priority: "medium", estimatedDays: "" });
  };

  const handleDelete = async (itemId: number) => {
    await removeItem.mutateAsync({ id: templateId, itemId });
    await qc.invalidateQueries({ queryKey: getGetTaskTemplateQueryKey(templateId) });
    await qc.invalidateQueries({ queryKey: getListTaskTemplatesQueryKey() });
  };

  if (isLoading) return <div className="py-4 text-sm text-muted-foreground">Loading items…</div>;

  type ItemArr = NonNullable<typeof data>["items"];
  const groupedByPhase = (data?.items ?? []).reduce<Record<string, ItemArr>>((acc, item) => {
    const ph = item.phase ?? "General";
    (acc[ph] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-4 pt-2">
      {Object.entries(groupedByPhase).map(([phase, items]) => (
        <div key={phase}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{phase}</span>
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] text-muted-foreground">{items!.length} tasks</span>
          </div>
          <div className="space-y-1.5">
            {items!.map(item => (
              <div key={item.id} className="flex items-center gap-3 px-3 py-2 rounded-md bg-muted/40 hover:bg-muted/70 group">
                <ListChecks className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm">{item.title}</span>
                  {item.estimatedDays && (
                    <span className="ml-2 text-[11px] text-muted-foreground">~{item.estimatedDays}d</span>
                  )}
                </div>
                <Badge variant={PRIORITY_BADGE[item.priority] ?? "outline"} className="text-[10px] capitalize">{item.priority}</Badge>
                <Button
                  variant="ghost" size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {(!data?.items?.length) && (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          No tasks in this template yet. Add your first task below.
        </div>
      )}

      {/* Add item inline */}
      {addOpen ? (
        <div className="rounded-md border bg-muted/30 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <Label className="text-xs text-muted-foreground">Task title *</Label>
              <Input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Foundation concrete pouring"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Phase</Label>
              <Input
                value={form.phase}
                onChange={e => setForm({ ...form, phase: e.target.value })}
                placeholder="Civil Works / MEP / Finishing…"
                list="phase-hints"
              />
              <datalist id="phase-hints">
                {phases.map(p => <option key={p} value={p} />)}
              </datalist>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Estimated days</Label>
              <Input
                type="number" min="1"
                value={form.estimatedDays}
                onChange={e => setForm({ ...form, estimatedDays: e.target.value })}
                placeholder="7"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Priority</Label>
              <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAdd} disabled={!form.title.trim() || addItem.isPending}>
              {addItem.isPending ? "Adding…" : "Add task"}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => setAddOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Add task to template
        </Button>
      )}
    </div>
  );
}

export default function TaskTemplates() {
  const qc = useQueryClient();
  const { data: templates, isLoading } = useListTaskTemplates();
  const createTemplate = useCreateTaskTemplate();
  const deleteTemplate = useDeleteTaskTemplate();
  const [openId, setOpenId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", projectType: "", isDefault: false });

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    const created = await createTemplate.mutateAsync({
      data: {
        name: form.name,
        description: form.description || null,
        projectType: form.projectType || null,
        isDefault: form.isDefault,
      },
    });
    await qc.invalidateQueries({ queryKey: getListTaskTemplatesQueryKey() });
    setCreateOpen(false);
    setForm({ name: "", description: "", projectType: "", isDefault: false });
    setOpenId(created.id);
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this template and all its tasks?")) return;
    await deleteTemplate.mutateAsync({ id });
    await qc.invalidateQueries({ queryKey: getListTaskTemplatesQueryKey() });
    if (openId === id) setOpenId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <LayoutTemplate className="h-7 w-7 text-primary" />
            Task Templates
          </h1>
          <p className="text-muted-foreground mt-1">
            Master checklists by project type — apply to any project to instantly generate a full task plan.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shrink-0"><Plus className="h-4 w-4" /> New Template</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Template</DialogTitle>
              <DialogDescription>Define a reusable task checklist for a project type.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Template name *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Residential Construction — Standard" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Project type</Label>
                <Select value={form.projectType} onValueChange={v => setForm({ ...form, projectType: v })}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {PROJECT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Description</Label>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Short description of when to use this template" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!form.name.trim() || createTemplate.isPending}>
                {createTemplate.isPending ? "Creating…" : "Create template"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary strip */}
      {templates && templates.length > 0 && (
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span><strong className="text-foreground">{templates.length}</strong> templates</span>
          <span><strong className="text-foreground">{templates.reduce((s, t) => s + t.itemCount, 0)}</strong> total tasks</span>
          <span><strong className="text-foreground">{templates.filter(t => t.isDefault).length}</strong> default</span>
        </div>
      )}

      {/* Template cards */}
      <div className="space-y-3">
        {templates?.map(tpl => (
          <Card key={tpl.id} className="overflow-hidden">
            <Collapsible open={openId === tpl.id} onOpenChange={o => setOpenId(o ? tpl.id : null)}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-accent/40 transition-colors pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                      <LayoutTemplate className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">{tpl.name}</CardTitle>
                        {tpl.isDefault && (
                          <Badge variant="default" className="gap-1 text-[10px]">
                            <Star className="h-2.5 w-2.5" /> Default
                          </Badge>
                        )}
                        {tpl.projectType && (
                          <Badge variant="outline" className="text-[10px]">{tpl.projectType}</Badge>
                        )}
                      </div>
                      {tpl.description && (
                        <CardDescription className="mt-0.5 text-xs">{tpl.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm text-muted-foreground">{tpl.itemCount} tasks</span>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={e => handleDelete(tpl.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {openId === tpl.id
                        ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      }
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 pb-5 border-t">
                  <TemplateDetail templateId={tpl.id} />
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}

        {!templates?.length && !isLoading && (
          <div className="rounded-md border border-dashed p-12 text-center space-y-2 text-muted-foreground">
            <LayoutTemplate className="h-10 w-10 mx-auto opacity-30" />
            <p className="font-medium">No templates yet</p>
            <p className="text-sm">Create your first template to start building reusable project checklists.</p>
          </div>
        )}
      </div>
    </div>
  );
}
