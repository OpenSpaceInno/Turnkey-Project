import { useListDocuments } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function Documents() {
  const { data: documents, isLoading } = useListDocuments();

  if (isLoading) {
    return <div className="p-6">Loading documents...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">Central repository for all project documents.</p>
        </div>
        <Button className="shrink-0 gap-2">
          <Plus className="h-4 w-4" /> Upload Document
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search documents..." className="pl-8" />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground border-b">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Project</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium text-right">Uploaded</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {documents?.map(doc => (
              <tr key={doc.id} className="hover:bg-accent/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-medium text-primary hover:underline cursor-pointer">{doc.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{doc.projectName}</td>
                <td className="px-4 py-3"><Badge variant="outline">{doc.category}</Badge></td>
                <td className="px-4 py-3 text-right text-muted-foreground">{format(new Date(doc.createdAt), "MMM d, yyyy")}</td>
              </tr>
            ))}
            {!documents?.length && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground border-dashed border-t">No documents found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
