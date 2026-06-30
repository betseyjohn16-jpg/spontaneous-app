import React, { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import {
  useGetMyRestaurant,
  useUpdateMyRestaurant,
  getGetMyRestaurantQueryKey,
} from "@workspace/api-client-react";
import type { RestaurantUpdate } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const PRICE_RANGES = ["$", "$$", "$$$", "$$$$"];

export default function Settings() {
  const { data: restaurant, isLoading } = useGetMyRestaurant();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const updateMutation = useUpdateMyRestaurant();

  const [form, setForm] = useState({
    name: "",
    cuisine: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    openingHours: "",
    priceRange: "$$",
    isActive: true,
  });

  useEffect(() => {
    if (restaurant) {
      setForm({
        name: restaurant.name ?? "",
        cuisine: restaurant.cuisine ?? "",
        description: restaurant.description ?? "",
        address: restaurant.address ?? "",
        phone: restaurant.phone ?? "",
        email: restaurant.email ?? "",
        openingHours: restaurant.openingHours ?? "",
        priceRange: restaurant.priceRange ?? "$$",
        isActive: restaurant.isActive ?? true,
      });
    }
  }, [restaurant]);

  const handleSave = () => {
    const update: RestaurantUpdate = {
      name: form.name || undefined,
      cuisine: form.cuisine || undefined,
      description: form.description || undefined,
      address: form.address || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
      openingHours: form.openingHours || undefined,
      priceRange: form.priceRange || undefined,
      isActive: form.isActive,
    };
    updateMutation.mutate(
      { data: update },
      {
        onSuccess: () => {
          toast({ title: "Settings saved." });
          queryClient.invalidateQueries({
            queryKey: getGetMyRestaurantQueryKey(),
          });
        },
        onError: () =>
          toast({ title: "Failed to save settings", variant: "destructive" }),
      }
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Update your restaurant profile shown to users on Spontaneous.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Restaurant Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="name">Restaurant Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cuisine">Cuisine Type</Label>
                <Input
                  id="cuisine"
                  value={form.cuisine}
                  onChange={(e) => setForm({ ...form, cuisine: e.target.value })}
                  placeholder="Italian, Japanese, American..."
                />
              </div>
              <div className="col-span-full space-y-1">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div className="col-span-full space-y-1">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="A short description for users"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="hours">Opening Hours</Label>
                <Input
                  id="hours"
                  value={form.openingHours}
                  onChange={(e) => setForm({ ...form, openingHours: e.target.value })}
                  placeholder="Mon–Fri 11am–10pm, Sat–Sun 10am–11pm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="price">Price Range</Label>
                <div className="flex gap-2">
                  {PRICE_RANGES.map((p) => (
                    <Button
                      key={p}
                      type="button"
                      variant={form.priceRange === p ? "default" : "outline"}
                      size="sm"
                      onClick={() => setForm({ ...form, priceRange: p })}
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Visibility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Switch
                id="active"
                checked={form.isActive}
                onCheckedChange={(v) => setForm({ ...form, isActive: v })}
              />
              <div>
                <Label htmlFor="active" className="font-medium">
                  Active on Spontaneous
                </Label>
                <p className="text-xs text-muted-foreground">
                  When off, your restaurant won't be suggested to users.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-1" />
          ) : (
            <Save className="w-4 h-4 mr-1" />
          )}
          Save Changes
        </Button>
      </div>
    </Layout>
  );
}
