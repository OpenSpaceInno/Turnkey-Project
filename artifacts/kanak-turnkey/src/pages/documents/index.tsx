import { useState, useMemo } from "react";
import { useListDocuments } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Search, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { NewDocumentDialog } from "@/components/dialogs/communication-dialogs";
import {
  DocumentPreviewModal,
  DocumentPreviewData,
} from "@/components/dialogs/document-preview-modal";

export default function Documents() {
  const { data: documents, isLoading } = useListDocuments();
  const [previewDoc, setPreviewDoc] = useState<DocumentPreviewData | null>(null);

  // Load last search from localStorage
  const lastSearch =
    typeof window !== "undefined"
      ? localStorage.getItem("turnkey_documents_search") || ""
      : "";

  const [search, setSearch] = useState(lastSearch);

  // Save search to localStorage when it changes
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("turnkey_documents_search", value);
    }
  };

  const filtered = useMemo(() => {
    const docsArray = Array.isArray(documents) ? documents : [];
    if (!search.trim()) return docsArray;
    const q = search.toLowerCase();
    return docsArray.filter(
      (d) =>
        d.fileName?.toLowerCase().includes(q) ||
        (d.projectName ?? "").toLowerCase().includes(q) ||
        d.category?.toLowerCase().includes(q),
    );
  }, [documents, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">
            Central repository for all project documents.
          </p>
        </div>
        <NewDocumentDialog
          trigger={
            <Button className="shrink-0 gap-2">
              <Plus className="h-4 w-4" /> Upload Document
            </Button>
          }
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            className="pl-8"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground border-b">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Project</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Uploaded</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((doc) => {
              const NameCell = doc.fileUrl ? (
                <button
                  type="button"
                  onClick={() =>
                    setPreviewDoc({
                      url: doc.fileUrl!,
                      title: doc.fileName,
                      type: "document",
                      description: doc.fileName,
                      projectName: doc.projectName || undefined,
                      category: doc.category,
                      date: doc.uploadedAt,
                      status: doc.status,
                    })
                  }
                  className="font-medium text-primary hover:underline text-left cursor-pointer"
                >
                  {doc.fileName}
                </button>
              ) : (
                <span className="font-medium">{doc.fileName}</span>
              );
              return (
                <tr
                  key={doc.id}
                  className="hover:bg-accent/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      {NameCell}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {doc.projectName}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="capitalize">
                      {doc.category}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={doc.status === "active" ? "default" : "secondary"}
                      className="capitalize"
                    >
                      {doc.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {format(new Date(doc.uploadedAt), "MMM d, yyyy")}
                  </td>
                </tr>
              );
            })}
            {!filtered.length && !isLoading && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground border-dashed border-t"
                >
                  {search
                    ? "No documents match your search."
                    : "No documents uploaded yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* In-page Document Preview Modal */}
      <DocumentPreviewModal
        preview={previewDoc}
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  );
}
