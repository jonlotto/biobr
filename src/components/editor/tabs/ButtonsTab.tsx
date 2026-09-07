import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { EditorLink } from "@/hooks/useEditorState";
import { DraggableList } from "../DraggableList";
import { ButtonEditDrawer } from "../ButtonEditDrawer";

interface ButtonsTabProps {
  links: EditorLink[];
  onAdd: (link: Omit<EditorLink, "id" | "order" | "linkType">) => string;
  onUpdate: (id: string, updates: Partial<EditorLink>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onReorder: (ids: string[]) => void;
  selectedLinkId: string | null;
  onSelectLink: (id: string | null) => void;
}

export function ButtonsTab({
  links,
  onAdd,
  onUpdate,
  onDelete,
  onDuplicate,
  onReorder,
  selectedLinkId,
  onSelectLink,
}: ButtonsTabProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<EditorLink | null>(null);

  const handleAddNew = () => {
    setEditingLink(null);
    setIsDrawerOpen(true);
  };

  const handleEdit = (link: EditorLink) => {
    setEditingLink(link);
    setIsDrawerOpen(true);
    onSelectLink(link.id);
  };

  const handleSave = (data: Pick<EditorLink, "title" | "url" | "icon" | "iconVariant" | "isActive"> & { thumbnailUrl?: string | null }) => {
    if (editingLink) {
      onUpdate(editingLink.id, { ...data, thumbnailUrl: data.thumbnailUrl ?? null });
    } else {
      // Add with default values for global style properties
      onAdd({
        ...data,
        thumbnailUrl: data.thumbnailUrl ?? null,
        style: "filled",
        buttonBgColor: null,
        buttonTextColor: null,
        buttonBorderRadius: "rounded-xl",
      });
    }
    setIsDrawerOpen(false);
    setEditingLink(null);
    onSelectLink(null);
  };

  const handleClose = () => {
    setIsDrawerOpen(false);
    setEditingLink(null);
    onSelectLink(null);
  };

  // Open drawer when link is selected from preview
  const selectedLink = links.find((l) => l.id === selectedLinkId);
  if (selectedLink && !isDrawerOpen) {
    setEditingLink(selectedLink);
    setIsDrawerOpen(true);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Botões</CardTitle>
          <CardDescription>
            Adicione e organize os botões que aparecerão na sua página.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {links.length > 0 ? (
            <DraggableList
              items={links}
              onReorder={onReorder}
              onEdit={handleEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onToggle={(id, isActive) => onUpdate(id, { isActive })}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum botão adicionado ainda.</p>
              <p className="text-sm">Clique no botão abaixo para adicionar seu primeiro botão.</p>
            </div>
          )}

          <Button onClick={handleAddNew} className="w-full" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar novo botão
          </Button>
        </CardContent>
      </Card>

      <ButtonEditDrawer
        open={isDrawerOpen}
        onClose={handleClose}
        onSave={handleSave}
        initialData={editingLink}
        isNew={!editingLink}
      />
    </>
  );
}
