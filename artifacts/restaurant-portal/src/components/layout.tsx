import React from "react";
import { Link, useLocation } from "wouter";
import { useGetMyRestaurant } from "@workspace/api-client-react";
import { Store, Calendar, ClipboardList, Clock, Settings, UtensilsCrossed, Menu as MenuIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: restaurant, isLoading, error } = useGetMyRestaurant();

  React.useEffect(() => {
    if (error && (error as any)?.status === 404 && location !== "/register") {
      setLocation("/register");
    }
  }, [error, location, setLocation]);

  if (location === "/register") {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!restaurant) return null;

  const navItems = [
    { href: "/", label: "Dashboard", icon: Store },
    { href: "/reservations", label: "Reservations", icon: ClipboardList },
    { href: "/menu", label: "Menu", icon: UtensilsCrossed },
    { href: "/availability", label: "Availability", icon: Clock },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-sidebar text-sidebar-foreground flex-shrink-0 flex flex-col border-b md:border-b-0 md:border-r border-sidebar-border relative z-20">
        <div className="p-4 md:p-6 flex items-center gap-3">
          <div className="bg-primary text-primary-foreground p-2 rounded-md">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight truncate">{restaurant.name}</h1>
            <p className="text-xs text-sidebar-foreground/60 truncate">Spontaneous Partner</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-x-auto flex md:flex-col md:overflow-visible">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  }`}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto bg-background/50">
        <div className="p-4 md:p-8 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
