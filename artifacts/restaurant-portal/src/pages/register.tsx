import React from "react";
import { useLocation } from "wouter";
import { useRegisterRestaurant } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Store, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerMutation = useRegisterRestaurant();
  const [formData, setFormData] = React.useState({
    name: "",
    cuisine: "",
    description: "",
    address: "",
    phone: "",
    email: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(
      { data: formData },
      {
        onSuccess: () => {
          toast({ title: "Registration successful! Welcome to Spontaneous." });
          setLocation("/");
        },
        onError: () => {
          toast({ title: "Registration failed. Please try again.", variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-card border border-card-border p-8 rounded-xl shadow-lg">
        <div className="flex justify-center mb-6">
          <div className="bg-primary text-primary-foreground p-3 rounded-xl">
            <Store className="w-8 h-8" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center mb-2">Partner Registration</h1>
        <p className="text-center text-muted-foreground mb-8">Join Spontaneous and reach new customers.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Restaurant Name</Label>
            <Input id="name" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cuisine">Cuisine Type</Label>
            <Input id="cuisine" required placeholder="e.g. Italian, Japanese" value={formData.cuisine} onChange={e => setFormData({ ...formData, cuisine: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" required value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea id="description" className="resize-none" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
          </div>
          
          <Button type="submit" className="w-full mt-6" disabled={registerMutation.isPending}>
            {registerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Complete Registration
          </Button>
        </form>
      </div>
    </div>
  );
}
