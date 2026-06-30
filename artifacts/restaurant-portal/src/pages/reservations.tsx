import React, { useState } from "react";
import { Layout } from "@/components/layout";
import {
  useListRestaurantReservations,
  useAcceptReservation,
  useDeclineReservation,
  getListRestaurantReservationsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, Users, Clock, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

type StatusFilter = "all" | "pending" | "accepted" | "declined";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  accepted: "bg-green-100 text-green-800 border-green-200",
  declined: "bg-red-100 text-red-800 border-red-200",
};

export default function Reservations() {
  const [status, setStatus] = useState<StatusFilter>("all");
  const { data: reservations = [], isLoading } = useListRestaurantReservations(
    { status },
    { query: { queryKey: getListRestaurantReservationsQueryKey({ status }) } }
  );
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const acceptMutation = useAcceptReservation();
  const declineMutation = useDeclineReservation();

  const handleAction = (id: number, action: "accept" | "decline") => {
    const mutation = action === "accept" ? acceptMutation : declineMutation;
    mutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: `Reservation ${action}ed.` });
          queryClient.invalidateQueries({
            queryKey: getListRestaurantReservationsQueryKey({ status }),
          });
          queryClient.invalidateQueries({
            queryKey: getListRestaurantReservationsQueryKey({ status: "all" }),
          });
        },
        onError: () => {
          toast({
            title: `Failed to ${action} reservation`,
            variant: "destructive",
          });
        },
      }
    );
  };

  const tabs: { label: string; value: StatusFilter }[] = [
    { label: "All", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Accepted", value: "accepted" },
    { label: "Declined", value: "declined" },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reservations</h2>
          <p className="text-muted-foreground">
            Manage incoming reservation requests from Spontaneous users.
          </p>
        </div>

        <div className="flex gap-2">
          {tabs.map((tab) => (
            <Button
              key={tab.value}
              variant={status === tab.value ? "default" : "outline"}
              size="sm"
              onClick={() => setStatus(tab.value)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : reservations.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              No {status === "all" ? "" : status} reservations yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {reservations.map((res) => (
              <Card key={res.id} className="overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 p-4 md:p-6">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-base font-semibold">{res.customerName}</h3>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                          statusColors[res.status] ?? "bg-muted text-muted-foreground"
                        }`}
                      >
                        {res.status}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        #{res.confirmationCode}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {res.date} at {res.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        Party of {res.partySize}
                      </span>
                    </div>
                    {res.customerEmail && (
                      <p className="text-sm text-muted-foreground">{res.customerEmail}</p>
                    )}
                    {res.specialRequests && (
                      <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                        <FileText className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <span className="italic">{res.specialRequests}</span>
                      </div>
                    )}
                    {res.orderItems.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Pre-order ({res.orderItems.length} item
                          {res.orderItems.length !== 1 ? "s" : ""}) — $
                          {res.totalOrderAmount.toFixed(2)}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {res.orderItems.map((item) => (
                            <span
                              key={item.id}
                              className="text-xs bg-muted px-2 py-0.5 rounded"
                            >
                              {item.quantity}x {item.menuItemName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {res.status === "pending" && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleAction(res.id, "decline")}
                        disabled={declineMutation.isPending}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAction(res.id, "accept")}
                        disabled={acceptMutation.isPending}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Accept
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
