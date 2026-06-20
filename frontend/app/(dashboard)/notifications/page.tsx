"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Inbox } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  listNotifications,
  markNotificationsRead,
} from "@/lib/api/endpoints/notifications";
import { qk } from "@/lib/api/query-keys";
import { formatRelative } from "@/lib/utils/format";

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: qk.notifications,
    queryFn: listNotifications,
  });

  const markRead = useMutation({
    mutationFn: (ids: string[]) => markNotificationsRead(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notifications }),
  });

  useEffect(() => {
    if (!data) return;
    const unread = data.filter((n) => !n.read).map((n) => n.id);
    if (unread.length > 0) markRead.mutate(unread);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground">
          Recent activity from your practice.
        </p>
      </header>

      {isLoading ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <div className="grid gap-3">
          {data.map((n) => (
            <Card key={n.id} className={n.read ? "" : "border-primary/40"}>
              <CardContent className="flex items-start gap-3 p-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                  <Bell className="h-4 w-4" />
                </span>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{n.title}</span>
                    {!n.read && <Badge>New</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{n.body}</p>
                  <span className="mt-1 text-xs text-muted-foreground">
                    {formatRelative(n.created_at)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-muted-foreground">
              <Inbox className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium">You&apos;re all caught up</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
