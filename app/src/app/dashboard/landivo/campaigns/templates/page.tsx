// app/src/app/dashboard/landivo/campaigns/templates/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmailTemplate } from "@/types/template";
import { Plus, Search, Filter, MoreVertical, Edit2, Copy, Trash2, FileText, Calendar, Layers, Mail} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { templateService } from "@/services/template.service";

const CATEGORY_COLORS = {
  property: "bg-green-100 text-green-800",
  newsletter: "bg-blue-100 text-blue-800",
  announcement: "bg-purple-100 text-purple-800",
  custom: "bg-gray-100 text-gray-800",
};

export default function TemplatesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<EmailTemplate | null>(null);
  const [templateTypeDialog, setTemplateTypeDialog] = useState(false);

  // Data fetching
  const {
    data: templatesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["templates"],
    queryFn: () => templateService.list(),
  });

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (id: string) => templateService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template deleted successfully");
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    },
    onError: (error: any) => {
      toast.error("Failed to delete template");
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (template: EmailTemplate) => {
      // Get the full template data and create a duplicate
      const templateData = {
        ...template,
        id: undefined, // Remove ID so it creates new
        name: `${template.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return templateService.create(templateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template duplicated successfully");
    },
    onError: () => {
      toast.error("Failed to duplicate template");
    },
  });

  // Handlers
  const handleCreateNew = () => {
    setTemplateTypeDialog(true);
  };

  const handleTemplateTypeSelect = (type: "single" | "multi") => {
    setTemplateTypeDialog(false);
    router.push(`/dashboard/landivo/campaigns/templates/create?type=${type}`);
  };
  const handleEditTemplate = (template: EmailTemplate) => {
    router.push(`/dashboard/landivo/campaigns/templates/${template.id}/edit`);
  };

  const handleDuplicateTemplate = (template: EmailTemplate) => {
    duplicateMutation.mutate(template);
  };

  const handleDeleteTemplate = (template: EmailTemplate) => {
    setTemplateToDelete(template);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (templateToDelete) {
      deleteMutation.mutate(templateToDelete.id);
    }
  };

  const handlePreviewTemplate = (template: EmailTemplate) => {
    router.push(`/dashboard/landivo/campaigns/templates/${template.id}/preview`);
  };

  // Filtering
  const templates = templatesData?.templates || [];
  const filteredTemplates = templates.filter((template: EmailTemplate) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) || template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load templates</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-600 mt-1">Create and manage reusable email templates for your campaigns</p>
        </div>
        <Button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input placeholder="Search templates..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="property">Property</SelectItem>
            <SelectItem value="newsletter">Newsletter</SelectItem>
            <SelectItem value="announcement">Announcement</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{searchQuery || categoryFilter !== "all" ? "No templates found" : "No templates yet"}</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || categoryFilter !== "all" ? "Try adjusting your search criteria or filters" : "Get started by creating your first email template"}
          </p>
          {!searchQuery && categoryFilter === "all" && (
            <Button onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template: EmailTemplate) => (
            <Card key={template.id} className="hover:shadow-lg transition-all duration-200 group">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold text-gray-900 truncate">{template.name}</CardTitle>
                    {template.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{template.description}</p>}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePreviewTemplate(template)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteTemplate(template)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="secondary" className={`${CATEGORY_COLORS[template.category]} border-0`}>
                    {template.category}
                  </Badge>
                  <div className="flex items-center text-xs text-gray-500">
                    <Layers className="mr-1 h-3 w-3" />
                    {template.components.length} components
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-3 w-3" />
                    Updated {formatDate(template.updatedAt)}
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" onClick={() => handleEditTemplate(template)} className="flex-1">
                    <Edit2 className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handlePreviewTemplate(template)}>
                    <FileText className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete "{templateToDelete?.name}"? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700" disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deletin  g..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Template Type Selection Dialog */}
      <Dialog open={templateTypeDialog} onOpenChange={setTemplateTypeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>Choose the type of template you want to create</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button onClick={() => handleTemplateTypeSelect("single")} className="h-24 flex flex-col items-center justify-center gap-2" variant="outline">
              <FileText className="h-8 w-8" />
              <div className="text-center">
                <div className="font-semibold">Single Property Template</div>
                <div className="text-xs text-muted-foreground">For campaigns featuring one property</div>
              </div>
            </Button>
            <Button onClick={() => handleTemplateTypeSelect("multi")} className="h-24 flex flex-col items-center justify-center gap-2" variant="outline">
              <Mail className="h-8 w-8" />
              <div className="text-center">
                <div className="font-semibold">Multi Property Template</div>
                <div className="text-xs text-muted-foreground">For campaigns featuring multiple properties</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
