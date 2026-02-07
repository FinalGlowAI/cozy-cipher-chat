import { useBlockedUsers } from "@/hooks/useBlockedUsers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserX, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const BlockedUsersManager = () => {
  const { blockedUsers, unblockUser, clearAllBlocked } = useBlockedUsers();

  const handleUnblock = (userId: string) => {
    unblockUser(userId);
    toast.success("User unblocked");
  };

  const handleClearAll = () => {
    clearAllBlocked();
    toast.success("All blocked users cleared");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5" />
              Blocked Users
            </CardTitle>
            <CardDescription>
              Manage users you've blocked in ephemeral rooms
            </CardDescription>
          </div>
          {blockedUsers.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all blocked users?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will unblock all {blockedUsers.length} blocked users. Their messages will be visible again in ephemeral rooms.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAll}>
                    Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {blockedUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            You haven't blocked any users. Blocked users' messages will be hidden in ephemeral rooms.
          </p>
        ) : (
          <div className="space-y-3">
            {blockedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border"
              >
                <div className="flex items-center gap-3">
                  {user.color && (
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: user.color }}
                    />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      Anonymous User
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Blocked {formatDate(user.blockedAt)}
                      {user.context && ` • Room: ${user.context}`}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUnblock(user.id)}
                >
                  Unblock
                </Button>
              </div>
            ))}
            <p className="text-xs text-muted-foreground mt-4">
              Blocked users are stored locally on your device. Clearing browser data will reset this list.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
