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
import { ArrowLeft, Trash2, Plus, Loader2, Check, X } from "lucide-react";

type FreeUser = {
  id: string;
  email: string;
  features: string[];
  created_at: string;
};

type Testimonial = {
  id: string;
  user_name: string;
  user_title: string | null;
  comment: string;
  rating: number;
  is_approved: boolean;
  created_at: string;
};

type UserWithSubscription = {
  id: string;
  email: string;
  created_at: string;
  subscription_status: string;
  is_active: boolean;
  current_period_end: string | null;
  last_sign_in: string | null;
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
  const [pendingTestimonials, setPendingTestimonials] = useState<Testimonial[]>([]);
  const [approvedTestimonials, setApprovedTestimonials] = useState<Testimonial[]>([]);
  const [allUsers, setAllUsers] = useState<UserWithSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
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
      fetchTestimonials();
      fetchAllUsers();
    }
  }, [isAdmin]);

  const fetchAllUsers = async () => {
    setUsersLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke('list-users-with-subscriptions', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      setAllUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  };

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

  const fetchTestimonials = async () => {
    try {
      const { data: pending, error: pendingError } = await supabase
        .from("testimonials")
        .select("*")
        .eq("is_approved", false)
        .order("created_at", { ascending: false });

      const { data: approved, error: approvedError } = await supabase
        .from("testimonials")
        .select("*")
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (pendingError) throw pendingError;
      if (approvedError) throw approvedError;

      setPendingTestimonials(pending || []);
      setApprovedTestimonials(approved || []);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      toast.error("Failed to load testimonials");
    }
  };

  const handleApproveTestimonial = async (id: string) => {
    try {
      const { error } = await supabase
        .from("testimonials")
        .update({ is_approved: true })
        .eq("id", id);

      if (error) throw error;

      toast.success("Testimonial approved");
      fetchTestimonials();
    } catch (error) {
      console.error("Error approving testimonial:", error);
      toast.error("Failed to approve testimonial");
    }
  };

  const handleDeleteTestimonial = async (id: string, userName: string) => {
    if (!confirm(`Delete testimonial from ${userName}?`)) return;

    try {
      const { error } = await supabase
        .from("testimonials")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Testimonial deleted");
      fetchTestimonials();
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      toast.error("Failed to delete testimonial");
    }
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
            <p className="text-muted-foreground mt-2">Manage free user access and testimonials</p>
          </div>
        </div>

        <div className="grid gap-6">
          {/* All Users with Subscription Status */}
          <Card>
            <CardHeader>
              <CardTitle>All Users ({allUsers.length})</CardTitle>
              <CardDescription>View all users and their subscription status</CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : allUsers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No users found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Subscription End</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Last Sign In</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.is_active 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                          }`}>
                            {user.subscription_status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {user.is_active ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell>
                          {user.current_period_end 
                            ? new Date(user.current_period_end).toLocaleDateString('en-US')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString('en-US')}
                        </TableCell>
                        <TableCell>
                          {user.last_sign_in 
                            ? new Date(user.last_sign_in).toLocaleDateString('en-US')
                            : 'Never'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Pending Testimonials */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Testimonials ({pendingTestimonials.length})</CardTitle>
              <CardDescription>Review and approve user testimonials</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingTestimonials.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No pending testimonials</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Comment</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingTestimonials.map((testimonial) => (
                      <TableRow key={testimonial.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{testimonial.user_name}</p>
                            {testimonial.user_title && (
                              <p className="text-xs text-muted-foreground">{testimonial.user_title}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="line-clamp-2">{testimonial.comment}</p>
                        </TableCell>
                        <TableCell>{testimonial.rating}/5</TableCell>
                        <TableCell>
                          {new Date(testimonial.created_at).toLocaleDateString('en-US')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleApproveTestimonial(testimonial.id)}
                            >
                              <Check className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTestimonial(testimonial.id, testimonial.user_name)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Approved Testimonials */}
          <Card>
            <CardHeader>
              <CardTitle>Approved Testimonials ({approvedTestimonials.length})</CardTitle>
              <CardDescription>Published testimonials visible to users</CardDescription>
            </CardHeader>
            <CardContent>
              {approvedTestimonials.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No approved testimonials</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Comment</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Published</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedTestimonials.map((testimonial) => (
                      <TableRow key={testimonial.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{testimonial.user_name}</p>
                            {testimonial.user_title && (
                              <p className="text-xs text-muted-foreground">{testimonial.user_title}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="line-clamp-2">{testimonial.comment}</p>
                        </TableCell>
                        <TableCell>{testimonial.rating}/5</TableCell>
                        <TableCell>
                          {new Date(testimonial.created_at).toLocaleDateString('en-US')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTestimonial(testimonial.id, testimonial.user_name)}
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
