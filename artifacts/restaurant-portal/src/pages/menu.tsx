import React, { useState } from "react";
import { Layout } from "@/components/layout";
import {
  useListMenuItems,
  useCreateMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
  getListMenuItemsQueryKey,
} from "@workspace/api-client-react";
import type { MenuItem, MenuItemInput, MenuItemUpdate } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const CATEGORIES = [
  "Appetizers",
  "Mains",
  "Sides",
  "Desserts",
  "Drinks",
  "Specials",
  "Other",
];

type MenuItemFormData = {
  name: string;
  description: string;
  price: string;
  category: string;
  dietaryTags: string;
  isAvailable: boolean;
};

function MenuItemForm({
  initial,
  onSubmit,
  onCancel,
  isPending,
}: {
  initial?: Partial<MenuItemFormData>;
  onSubmit: (data: MenuItemFormData) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<MenuItemFormData>({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    price: initial?.price ?? "",
    category: initial?.category ?? "Mains",
    dietaryTags: initial?.dietaryTags ?? "",
    isAvailable: initial?.isAvailable ?? true,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Grilled Salmon"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="price">Price ($)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder="18.99"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2 space-y-1">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Optional short description"
          />
        </div>
        <div className="col-span-2 space-y-1">
          <Label htmlFor="tags">Dietary Tags (comma-separated)</Label>
          <Input
            id="tags"
            value={form.dietaryTags}
            onChange={(e) => setForm({ ...form, dietaryTags: e.target.value })}
            placeholder="vegan, gluten-free"
          />
        </div>
        <div className="col-span-2 flex items-center gap-3">
          <Switch
            id="available"
            checked={form.isAvailable}
            onCheckedChange={(v) => setForm({ ...form, isAvailable: v })}
          />
          <Label htmlFor="available">Available now</Label>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button
          onClick={() => onSubmit(form)}
          disabled={isPending || !form.name || !form.price}
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
          Save
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function MenuPage() {
  const { data: items = [], isLoading } = useListMenuItems();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);

  const createMutation = useCreateMenuItem();
  const updateMutation = useUpdateMenuItem();
  const deleteMutation = useDeleteMenuItem();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListMenuItemsQueryKey() });

  const handleSubmit = (form: MenuItemFormData) => {
    const tags = form.dietaryTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const price = parseFloat(form.price);

    if (editing) {
      const update: MenuItemUpdate = {
        name: form.name,
        description: form.description || undefined,
        price,
        category: form.category,
        dietaryTags: tags,
        isAvailable: form.isAvailable,
      };
      updateMutation.mutate(
        { id: editing.id, data: update },
        {
          onSuccess: () => {
            toast({ title: "Menu item updated." });
            invalidate();
            setDialogOpen(false);
            setEditing(null);
          },
          onError: () =>
            toast({ title: "Failed to update item", variant: "destructive" }),
        }
      );
    } else {
      const input: MenuItemInput = {
        name: form.name,
        description: form.description || undefined,
        price,
        category: form.category,
        dietaryTags: tags,
        isAvailable: form.isAvailable,
      };
      createMutation.mutate(
        { data: input },
        {
          onSuccess: () => {
            toast({ title: "Menu item added." });
            invalidate();
            setDialogOpen(false);
          },
          onError: () =>
            toast({ title: "Failed to add item", variant: "destructive" }),
        }
      );
    }
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Item removed." });
          invalidate();
        },
        onError: () =>
          toast({ title: "Failed to delete item", variant: "destructive" }),
      }
    );
  };

  const handleToggleAvailable = (item: MenuItem) => {
    updateMutation.mutate(
      { id: item.id, data: { isAvailable: !item.isAvailable } },
      {
        onSuccess: () => invalidate(),
        onError: () =>
          toast({ title: "Failed to update availability", variant: "destructive" }),
      }
    );
  };

  const byCategory = items.reduce<Record<string, MenuItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category]!.push(item);
    return acc;
  }, {});

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Menu</h2>
            <p className="text-muted-foreground">
              Manage your menu items and availability.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Item
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              No menu items yet. Add your first item to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(byCategory).map(([category, catItems]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {catItems.map((item) => (
                    <Card
                      key={item.id}
                      className={
                        !item.isAvailable ? "opacity-60" : ""
                      }
                    >
                      <div className="flex items-center justify-between px-4 py-3 gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{item.name}</span>
                            {(item.dietaryTags ?? []).map((tag) => (
                              <span
                                key={tag}
                                className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-sm font-semibold tabular-nums">
                            ${item.price.toFixed(2)}
                          </span>
                          <Switch
                            checked={item.isAvailable}
                            onCheckedChange={() => handleToggleAvailable(item)}
                            title={item.isAvailable ? "Mark unavailable" : "Mark available"}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditing(item);
                              setDialogOpen(true);
                            }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(item.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
            </DialogHeader>
            <MenuItemForm
              initial={
                editing
                  ? {
                      name: editing.name,
                      description: editing.description ?? "",
                      price: String(editing.price),
                      category: editing.category,
                      dietaryTags: (editing.dietaryTags ?? []).join(", "),
                      isAvailable: editing.isAvailable,
                    }
                  : undefined
              }
              onSubmit={handleSubmit}
              onCancel={() => {
                setDialogOpen(false);
                setEditing(null);
              }}
              isPending={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
