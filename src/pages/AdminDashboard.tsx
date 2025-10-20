import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft, Trash2, Plus, Loader2 } from "lucide-react";

type FreeUser = {
  id: string;
  email: string;
  features: string[];
  created_at: string;
};

const AVAILABLE_FEATURES = [
  "encryption",
  "decryption",
  "ephemeral_space",
  "image_encryption",
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [freeUsers, setFreeUsers] = useState<FreeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast.error("Access denied");
      navigate("/");
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchFreeUsers();
    }
  }, [isAdmin]);

  const fetchFreeUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("free_users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFreeUsers(data || []);
    } catch (error) {
      console.error("Error fetching free users:", error);
      toast.error("Failed to load free users");
    } finally {
      setLoading(false);
    }
  };

  const handleAddFreeUser = async () => {
    if (!newEmail.trim()) {
      toast.error("Please enter an email");
      return;
    }

    if (selectedFeatures.length === 0) {
      toast.error("Please select at least one feature");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("free_users").insert({
        email: newEmail.trim().toLowerCase(),
        features: selectedFeatures,
      });

      if (error) throw error;

      toast.success("Free user added successfully");
      setNewEmail("");
      setSelectedFeatures([]);
      fetchFreeUsers();
    } catch (error: any) {
      console.error("Error adding free user:", error);
      if (error.code === "23505") {
        toast.error("This email is already a free user");
      } else {
        toast.error("Failed to add free user");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFreeUser = async (id: string, email: string) => {
    if (!confirm(`Remove free access for ${email}?`)) return;

    try {
      const { error } = await supabase.from("free_users").delete().eq("id", id);

      if (error) throw error;

      toast.success("Free user removed");
      fetchFreeUsers();
    } catch (error) {
      console.error("Error deleting free user:", error);
      toast.error("Failed to remove free user");
    }
  };

  const handleUpdateFeatures = async (id: string, currentFeatures: string[], feature: string) => {
    const newFeatures = currentFeatures.includes(feature)
      ? currentFeatures.filter((f) => f !== feature)
      : [...currentFeatures, feature];

    if (newFeatures.length === 0) {
      toast.error("User must have at least one feature");
      return;
    }

    try {
      const { error } = await supabase
        .from("free_users")
        .update({ features: newFeatures })
        .eq("id", id);

      if (error) throw error;

      toast.success("Features updated");
      fetchFreeUsers();
    } catch (error) {
      console.error("Error updating features:", error);
      toast.error("Failed to update features");
    }
  };

  const toggleFeature = (feature: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature]
    );
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold gradient-text">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">Manage free user access</p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Add Free User */}
          <Card>
            <CardHeader>
              <CardTitle>Add Free User</CardTitle>
              <CardDescription>
                Grant free access to specific features for any email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
                <div>
                  <p className="text-sm font-medium mb-3">Select Features:</p>
                  <div className="grid grid-cols-2 gap-3">
                    {AVAILABLE_FEATURES.map((feature) => (
                      <div key={feature} className="flex items-center space-x-2">
                        <Checkbox
                          id={`new-${feature}`}
                          checked={selectedFeatures.includes(feature)}
                          onCheckedChange={() => toggleFeature(feature)}
                        />
                        <label
                          htmlFor={`new-${feature}`}
                          className="text-sm cursor-pointer capitalize"
                        >
                          {feature.replace("_", " ")}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={handleAddFreeUser}
                  disabled={submitting}
                  className="w-full"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Add Free User
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Free Users List */}
          <Card>
            <CardHeader>
              <CardTitle>Free Users ({freeUsers.length})</CardTitle>
              <CardDescription>Manage existing free users and their feature access</CardDescription>
            </CardHeader>
            <CardContent>
              {freeUsers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No free users yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Features</TableHead>
                      <TableHead>Added On</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {freeUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {AVAILABLE_FEATURES.map((feature) => (
                              <div key={feature} className="flex items-center space-x-1">
                                <Checkbox
                                  id={`${user.id}-${feature}`}
                                  checked={user.features.includes(feature)}
                                  onCheckedChange={() =>
                                    handleUpdateFeatures(user.id, user.features, feature)
                                  }
                                />
                                <label
                                  htmlFor={`${user.id}-${feature}`}
                                  className="text-xs cursor-pointer capitalize"
                                >
                                  {feature.replace("_", " ")}
                                </label>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString('en-US')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteFreeUser(user.id, user.email)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
