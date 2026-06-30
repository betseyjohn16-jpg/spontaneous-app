import React, { useState } from "react";
import { Layout } from "@/components/layout";
import {
  useListAvailabilitySlots,
  useCreateAvailabilitySlot,
  useDeleteAvailabilitySlot,
  useListBlackouts,
  useCreateBlackout,
  useDeleteBlackout,
  getListAvailabilitySlotsQueryKey,
  getListBlackoutsQueryKey,
} from "@workspace/api-client-react";
import type { AvailabilitySlotInput, BlackoutInput } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

function SlotForm({
  onSubmit,
  isPending,
}: {
  onSubmit: (data: AvailabilitySlotInput) => void;
  isPending: boolean;
}) {
  const today = new Date().toISOString().split("T")[0]!;
  const [form, setForm] = useState({
    date: today,
    time: "18:00",
    partyMin: "1",
    partyMax: "6",
    capacity: "4",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add Availability Slot</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <div className="space-y-1">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={form.date}
              min={today}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="min">Min party</Label>
            <Input
              id="min"
              type="number"
              min="1"
              value={form.partyMin}
              onChange={(e) => setForm({ ...form, partyMin: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="max">Max party</Label>
            <Input
              id="max"
              type="number"
              min="1"
              value={form.partyMax}
              onChange={(e) => setForm({ ...form, partyMax: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cap">Capacity</Label>
            <Input
              id="cap"
              type="number"
              min="1"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            />
          </div>
        </div>
        <Button
          className="mt-4"
          onClick={() =>
            onSubmit({
              date: form.date,
              time: form.time,
              partyMin: parseInt(form.partyMin),
              partyMax: parseInt(form.partyMax),
              capacity: parseInt(form.capacity),
            })
          }
          disabled={isPending || !form.date || !form.time}
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-1" />
          ) : (
            <Plus className="w-4 h-4 mr-1" />
          )}
          Add Slot
        </Button>
      </CardContent>
    </Card>
  );
}

function BlackoutForm({
  onSubmit,
  isPending,
}: {
  onSubmit: (data: BlackoutInput) => void;
  isPending: boolean;
}) {
  const today = new Date().toISOString().split("T")[0]!;
  const [form, setForm] = useState({
    startDate: today,
    endDate: today,
    reason: "",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add Blackout Period</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="space-y-1">
            <Label htmlFor="start">Start Date</Label>
            <Input
              id="start"
              type="date"
              value={form.startDate}
              min={today}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="end">End Date</Label>
            <Input
              id="end"
              type="date"
              value={form.endDate}
              min={form.startDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Input
              id="reason"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Private event, renovation..."
            />
          </div>
        </div>
        <Button
          className="mt-4"
          onClick={() =>
            onSubmit({
              startDate: form.startDate,
              endDate: form.endDate,
              reason: form.reason || undefined,
            })
          }
          disabled={isPending || !form.startDate || !form.endDate}
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mr-1" />
          ) : (
            <Plus className="w-4 h-4 mr-1" />
          )}
          Add Blackout
        </Button>
      </CardContent>
    </Card>
  );
}

export default function Availability() {
  const { data: slots = [], isLoading: slotsLoading } = useListAvailabilitySlots();
  const { data: blackouts = [], isLoading: blackoutsLoading } = useListBlackouts();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createSlotMutation = useCreateAvailabilitySlot();
  const deleteSlotMutation = useDeleteAvailabilitySlot();
  const createBlackoutMutation = useCreateBlackout();
  const deleteBlackoutMutation = useDeleteBlackout();

  const handleCreateSlot = (data: AvailabilitySlotInput) => {
    createSlotMutation.mutate(
      { data },
      {
        onSuccess: () => {
          toast({ title: "Availability slot added." });
          queryClient.invalidateQueries({
            queryKey: getListAvailabilitySlotsQueryKey(),
          });
        },
        onError: () =>
          toast({ title: "Failed to add slot", variant: "destructive" }),
      }
    );
  };

  const handleDeleteSlot = (id: number) => {
    deleteSlotMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Slot removed." });
          queryClient.invalidateQueries({
            queryKey: getListAvailabilitySlotsQueryKey(),
          });
        },
        onError: () =>
          toast({ title: "Failed to remove slot", variant: "destructive" }),
      }
    );
  };

  const handleCreateBlackout = (data: BlackoutInput) => {
    createBlackoutMutation.mutate(
      { data },
      {
        onSuccess: () => {
          toast({ title: "Blackout period added." });
          queryClient.invalidateQueries({ queryKey: getListBlackoutsQueryKey() });
        },
        onError: () =>
          toast({ title: "Failed to add blackout", variant: "destructive" }),
      }
    );
  };

  const handleDeleteBlackout = (id: number) => {
    deleteBlackoutMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Blackout removed." });
          queryClient.invalidateQueries({ queryKey: getListBlackoutsQueryKey() });
        },
        onError: () =>
          toast({ title: "Failed to remove blackout", variant: "destructive" }),
      }
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Availability</h2>
          <p className="text-muted-foreground">
            Set the times you accept reservations and block off closed periods.
          </p>
        </div>

        <Tabs defaultValue="slots">
          <TabsList>
            <TabsTrigger value="slots">Time Slots ({slots.length})</TabsTrigger>
            <TabsTrigger value="blackouts">Blackouts ({blackouts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="slots" className="space-y-4 mt-4">
            <SlotForm
              onSubmit={handleCreateSlot}
              isPending={createSlotMutation.isPending}
            />
            {slotsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : slots.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No availability slots yet. Add your first slot above.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {slots.map((slot) => (
                  <Card key={slot.id}>
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-6 text-sm">
                        <span className="font-medium w-28">{slot.date}</span>
                        <span className="font-mono text-primary">{slot.time}</span>
                        <span className="text-muted-foreground">
                          Party {slot.partyMin}–{slot.partyMax}
                        </span>
                        <span className="text-muted-foreground">
                          {slot.booked}/{slot.capacity} booked
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteSlot(slot.id)}
                        disabled={deleteSlotMutation.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="blackouts" className="space-y-4 mt-4">
            <BlackoutForm
              onSubmit={handleCreateBlackout}
              isPending={createBlackoutMutation.isPending}
            />
            {blackoutsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : blackouts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No blackout periods. Add one above to block off closed dates.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {blackouts.map((b) => (
                  <Card key={b.id}>
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-6 text-sm">
                        <span className="font-medium">
                          {b.startDate === b.endDate
                            ? b.startDate
                            : `${b.startDate} → ${b.endDate}`}
                        </span>
                        {b.reason && (
                          <span className="text-muted-foreground italic">
                            {b.reason}
                          </span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteBlackout(b.id)}
                        disabled={deleteBlackoutMutation.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
