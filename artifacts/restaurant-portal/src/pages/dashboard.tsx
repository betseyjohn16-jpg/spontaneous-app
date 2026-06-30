import React from "react";
import { Layout } from "@/components/layout";
import { useGetRestaurantDashboard, useAcceptReservation, useDeclineReservation } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Dashboard() {
  const { data: stats, isLoading } = useGetRestaurantDashboard();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const acceptMutation = useAcceptReservation();
  const declineMutation = useDeclineReservation();

  const handleAction = (id: number, action: 'accept' | 'decline') => {
    const mutation = action === 'accept' ? acceptMutation : declineMutation;
    mutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: `Reservation ${action}ed successfully.` });
        queryClient.invalidateQueries({ queryKey: ['/api/restaurant/dashboard'] });
      },
      onError: (err: any) => {
        toast({ title: `Failed to ${action} reservation`, variant: "destructive" });
      }
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!stats) return <Layout><div className="text-center text-muted-foreground mt-8">Failed to load dashboard</div></Layout>;

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Overview of your daily operations.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.pendingReservations}</div>
              <p className="text-xs text-muted-foreground">Awaiting action</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Guests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayReservations}</div>
              <p className="text-xs text-muted-foreground">Reservations for today</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reservations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReservations}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Menu Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMenuItems}</div>
              <p className="text-xs text-muted-foreground">Available to users</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold tracking-tight">Upcoming Reservations</h3>
          {stats.upcomingReservations.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No upcoming reservations.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {stats.upcomingReservations.map((res) => (
                <Card key={res.id} className={res.status === 'pending' ? 'border-primary' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base font-semibold">{res.customerName}</CardTitle>
                      <div className="flex items-center gap-1 text-sm font-medium bg-muted px-2 py-1 rounded">
                        <Users className="w-4 h-4" /> {res.partySize}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{res.date} at {res.time}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-sm"><span className="font-medium text-foreground">Code:</span> {res.confirmationCode}</div>
                        <div className="text-sm mt-1 capitalize"><span className="font-medium text-foreground">Status:</span> <span className={res.status === 'pending' ? 'text-primary font-bold' : ''}>{res.status}</span></div>
                      </div>
                      {res.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => handleAction(res.id, 'decline')} disabled={declineMutation.isPending}>
                            <X className="w-4 h-4 mr-1" /> Decline
                          </Button>
                          <Button size="sm" onClick={() => handleAction(res.id, 'accept')} disabled={acceptMutation.isPending}>
                            <Check className="w-4 h-4 mr-1" /> Accept
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
