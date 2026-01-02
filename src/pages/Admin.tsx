import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, ArrowLeft, Trash2, Mail, Calendar, User, MessageSquare, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logError } from "@/lib/errorHandler";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  created_at: string;
}

const Admin = () => {
  const { user, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [adminVerified, setAdminVerified] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);

  // Server-side admin verification - queries DB directly instead of relying on client state
  const verifyAdminRole = useCallback(async () => {
    if (!user) {
      setVerificationComplete(true);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        logError('Admin:verifyAdminRole', error);
        setAdminVerified(false);
      } else {
        setAdminVerified(!!data);
      }
    } catch (error) {
      logError('Admin:verifyAdminRole', error);
      setAdminVerified(false);
    } finally {
      setVerificationComplete(true);
    }
  }, [user]);

  // Verify admin role on mount and when user changes
  useEffect(() => {
    if (!isLoading) {
      verifyAdminRole();
    }
  }, [isLoading, user, verifyAdminRole]);

  // Redirect logic after verification is complete
  useEffect(() => {
    if (!verificationComplete) return;

    if (!user) {
      navigate("/auth");
    } else if (!adminVerified) {
      toast.error("Access denied. Admin privileges required.");
      navigate("/");
    }
  }, [verificationComplete, user, adminVerified, navigate]);

  // Periodic re-verification of admin status (every 5 minutes)
  useEffect(() => {
    if (!adminVerified) return;

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user?.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!data) {
        setAdminVerified(false);
        toast.error("Admin session expired");
        navigate("/");
      }
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [adminVerified, user, navigate]);

  // Fetch submissions only after admin verification
  useEffect(() => {
    if (adminVerified) {
      fetchSubmissions();
    }
  }, [adminVerified]);

  const fetchSubmissions = async () => {
    setIsLoadingData(true);
    try {
      const { data, error } = await supabase
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        logError('Admin:fetchSubmissions', error);
        throw error;
      }
      setSubmissions(data || []);
    } catch (error) {
      toast.error("Failed to load submissions");
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("contact_submissions")
        .delete()
        .eq("id", id);

      if (error) {
        logError('Admin:handleDelete', error);
        throw error;
      }
      
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      toast.success("Submission deleted");
    } catch (error) {
      toast.error("Failed to delete submission");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Don't render anything until verification is complete - prevents UI exposure
  if (isLoading || !verificationComplete || !adminVerified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">Admin Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Contact Submissions</h1>
              <p className="text-muted-foreground">
                {submissions.length} submission{submissions.length !== 1 ? "s" : ""} total
              </p>
            </div>
            <Button variant="outline" onClick={fetchSubmissions} disabled={isLoadingData}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingData ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {isLoadingData ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg border border-border">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No submissions yet</h3>
              <p className="text-muted-foreground">Contact form submissions will appear here.</p>
            </div>
          ) : (
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          {submission.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <a href={`mailto:${submission.email}`} className="text-primary hover:underline">
                            {submission.email}
                          </a>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {submission.subject || "-"}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <button
                          onClick={() => setSelectedSubmission(submission)}
                          className="text-left truncate hover:text-primary transition-colors"
                        >
                          {submission.message.substring(0, 50)}...
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {new Date(submission.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete submission?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the contact submission from {submission.name}. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(submission.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Message Detail Dialog */}
          <AlertDialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
            <AlertDialogContent className="max-w-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Message from {selectedSubmission?.name}</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-4 mt-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4" />
                      <a href={`mailto:${selectedSubmission?.email}`} className="text-primary hover:underline">
                        {selectedSubmission?.email}
                      </a>
                    </div>
                    {selectedSubmission?.subject && (
                      <div className="text-sm">
                        <strong>Subject:</strong> {selectedSubmission.subject}
                      </div>
                    )}
                    <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap text-foreground">
                      {selectedSubmission?.message}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Submitted on {selectedSubmission && new Date(selectedSubmission.created_at).toLocaleString()}
                    </div>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Close</AlertDialogCancel>
                <AlertDialogAction asChild>
                  <a href={`mailto:${selectedSubmission?.email}`}>
                    <Mail className="w-4 h-4 mr-2" />
                    Reply
                  </a>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </motion.div>
      </main>
    </div>
  );
};

export default Admin;
