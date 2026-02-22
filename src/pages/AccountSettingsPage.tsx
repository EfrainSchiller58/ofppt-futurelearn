import { useState } from "react";
import { motion } from "framer-motion";
import { UserCircle, Upload, KeyRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSuccessNotification } from "@/components/SuccessNotification";
import { api } from "@/services/api";
import { useAuthStore } from "@/stores/authStore";

const AccountSettingsPage = () => {
  const { user, setUser } = useAuthStore();
  const { toast } = useToast();
  const { showSuccess, NotificationComponent } = useSuccessNotification();

  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [image, setImage] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const mustChangePassword = Boolean(user?.must_change_password);

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const updatedUser = await api.updateProfile({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        profile_image: image,
      });
      setUser(updatedUser);
      showSuccess({
        title: "Profile Updated",
        description: "Your account information has been saved successfully. Changes are now active.",
        icon: "sparkles",
        accentColor: "#3b82f6",
      });
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message || "Could not save profile", variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (newPassword.length < 8) {
      toast({ title: "Validation error", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: "Validation error", description: "Password confirmation does not match.", variant: "destructive" });
      return;
    }

    setSavingPassword(true);
    try {
      const response = await api.changePassword({
        current_password: mustChangePassword ? undefined : currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });
      console.log('Password change response:', JSON.stringify(response));
      setUser(response.user);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      const emailInfo = response.email_status === 'sent' 
        ? `Email sent to ${response.email_to}`
        : response.email_status === 'failed'
        ? `Email failed: ${response.email_error}`
        : 'Email not attempted';
      
      showSuccess({
        title: "Password Updated",
        description: `Your password has been changed successfully. ${emailInfo}`,
        icon: "shield",
        accentColor: response.email_status === 'sent' ? "#10b981" : "#f59e0b",
      });
    } catch (err: any) {
      toast({ title: "Password update failed", description: err.message || "Could not update password", variant: "destructive" });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <>
      {NotificationComponent}
      <div className="space-y-6 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold">Account Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your personal information and credentials</p>
      </motion.div>

      {mustChangePassword && (
        <div className="glass-panel p-4 border border-warning/30">
          <p className="text-sm font-medium text-warning">You must change your default password before continuing.</p>
        </div>
      )}

      <div className="glass-panel p-6 space-y-5">
        <div className="flex items-center gap-2">
          <UserCircle className="w-5 h-5 text-primary" />
          <h2 className="font-display font-semibold">Profile</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">First name</label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="input-glass" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Last name</label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="input-glass" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-glass" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Phone</label>
            <Input value={phone ?? ""} onChange={(e) => setPhone(e.target.value)} className="input-glass" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-sm text-muted-foreground">Profile image</label>
            <div className="flex items-center gap-3">
              <Input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)} className="input-glass" />
              <Upload className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={saveProfile} disabled={savingProfile} className="btn-glow text-primary-foreground border-0">
            {savingProfile ? "Saving..." : "Save profile"}
          </Button>
        </div>
      </div>

      <div className="glass-panel p-6 space-y-5">
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-primary" />
          <h2 className="font-display font-semibold">Password</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {!mustChangePassword && (
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm text-muted-foreground">Current password</label>
              <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="input-glass" />
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">New password</label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-glass" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground">Confirm new password</label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-glass" />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={savePassword} disabled={savingPassword} className="btn-glow text-primary-foreground border-0">
            {savingPassword ? "Updating..." : "Update password"}
          </Button>
        </div>
      </div>
    </div>
    </>
  );
};

export default AccountSettingsPage;
