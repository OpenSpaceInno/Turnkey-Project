import { useListNotifications, useMarkNotificationRead, useClearNotifications } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCheck, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Notifications() {
  const { data: notifications, isLoading, refetch } = useListNotifications();
  const markRead = useMarkNotificationRead();
  const clearNotifications = useClearNotifications();

  const handleMarkAllRead = () => {
    // Assuming clearNotifications clears all or marks all as read
    clearNotifications.mutate(undefined, {
      onSuccess: () => refetch()
    });
  };

  const handleMarkRead = (id: number) => {
    markRead.mutate({ id }, {
      onSuccess: () => refetch()
    });
  };

  if (isLoading) {
    return <div className="p-6">Loading notifications...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Your recent alerts and updates.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={handleMarkAllRead}>
          <CheckCheck className="h-4 w-4" /> Mark all read
        </Button>
      </div>

      <div className="space-y-3">
        {notifications?.map(notif => (
          <Card key={notif.id} className={notif.isRead ? "opacity-60" : "border-primary/20 bg-primary/5"}>
            <CardContent className="p-4 flex gap-4 justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium">{notif.title}</p>
                <p className="text-sm text-muted-foreground">{notif.message}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                </p>
              </div>
              {!notif.isRead && (
                <Button variant="ghost" size="sm" onClick={() => handleMarkRead(notif.id)}>
                  Mark Read
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
        {!notifications?.length && (
          <div className="text-center p-8 border rounded-md border-dashed text-muted-foreground">
            You're all caught up! No notifications.
          </div>
        )}
      </div>
    </div>
  );
}
