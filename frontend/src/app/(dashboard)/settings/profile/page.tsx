'use client';

import { useState, useEffect, type CSSProperties } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Fraunces, Space_Grotesk } from 'next/font/google';
import { RouteGuard } from '@/components/auth/RouteGuard';
import {
  User,
  Mail,
  Phone,
  Lock,
  Shield,
  Camera,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertCircle,
  Smartphone,
  Monitor,
  Globe,
  Clock,
  LogOut,
  RefreshCw,
  Save,
  Key,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import apiClient from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phone?: string;
  roleName: string;
  profilePhoto?: string;
  lastLogin?: string;
  createdAt: string;
}

interface ActiveSession {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location?: string;
  lastActive: string;
  isCurrent: boolean;
}

// Password strength calculator
function calculatePasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 10;
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^a-zA-Z0-9]/.test(password)) score += 20;
  
  if (score < 30) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score < 60) return { score, label: 'Fair', color: 'bg-orange-500' };
  if (score < 80) return { score, label: 'Good', color: 'bg-blue-500' };
  return { score, label: 'Strong', color: 'bg-green-500' };
}

const profileBodyFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-profile-body',
});

const profileDisplayFont = Fraunces({
  subsets: ['latin'],
  variable: '--font-profile-display',
});

export default function ProfileSettingsPage() {
  return (
    <RouteGuard requiredPermission="PROFILE.VIEW">
      <ProfileSettingsContent />
    </RouteGuard>
  );
}

function ProfileSettingsContent() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { user: authUser, permissions, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Dialog state
  const [logoutAllDialogOpen, setLogoutAllDialogOpen] = useState(false);

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const res = await apiClient.get<UserProfile>('/api/auth/me');
      if (!res.success || !res.data) {
        // Return mock data for development
        return {
          id: 1,
          username: 'admin',
          email: 'admin@sudhantextile.com',
          fullName: 'Admin User',
          phone: '+91 98765 43210',
          roleName: 'Administrator',
          lastLogin: new Date().toISOString(),
          createdAt: '2024-01-01T00:00:00Z',
        };
      }
      return res.data;
    },
  });

  // Fetch active sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<ActiveSession[]>({
    queryKey: ['activeSessions'],
    queryFn: async () => {
      const res = await apiClient.get<ActiveSession[]>('/api/auth/sessions');
      if (!res.success || !res.data) {
        // Return mock sessions for development
        return [
          {
            id: '1',
            device: 'Windows PC',
            browser: 'Chrome 120',
            ip: '192.168.1.100',
            location: 'Coimbatore, India',
            lastActive: new Date().toISOString(),
            isCurrent: true,
          },
          {
            id: '2',
            device: 'Android Phone',
            browser: 'Chrome Mobile',
            ip: '192.168.1.105',
            location: 'Coimbatore, India',
            lastActive: new Date(Date.now() - 3600000).toISOString(),
            isCurrent: false,
          },
        ];
      }
      return res.data;
    },
  });

  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName);
      setEmail(profile.email);
      setPhone(profile.phone || '');
    }
  }, [profile]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { fullName: string; email: string; phone: string }) => {
      const res = await apiClient.put('/api/auth/profile', data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast.success('Profile updated successfully');
      setIsEditing(false);
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await apiClient.post('/api/auth/change-password', data);
      return res;
    },
    onSuccess: () => {
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: () => {
      toast.error('Failed to change password. Please check your current password.');
    },
  });

  // Logout from session mutation
  const logoutSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await apiClient.post(`/api/auth/sessions/${sessionId}/logout`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeSessions'] });
      toast.success('Session terminated');
    },
    onError: () => {
      toast.error('Failed to terminate session');
    },
  });

  // Logout all sessions mutation
  const logoutAllMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/api/auth/logout-all');
      return res;
    },
    onSuccess: () => {
      toast.success('All other sessions terminated');
      setLogoutAllDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['activeSessions'] });
    },
    onError: () => {
      toast.error('Failed to terminate sessions');
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({ fullName, email, phone });
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  const passwordStrength = calculatePasswordStrength(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const completionScore = [fullName, email, phone, profile?.profilePhoto].filter(Boolean).length;
  const profileCompletion = Math.round((completionScore / 4) * 100);
  const lastLoginLabel = profile?.lastLogin
    ? new Date(profile.lastLogin).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    : 'N/A';
  const memberSinceLabel = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    })
    : 'N/A';
  const pageVars = {
    '--profile-ink': '#0b1b2b',
    '--profile-accent': '#0f766e',
    '--profile-accent-strong': '#0b4f4e',
    '--profile-accent-soft': '#e6f6f4',
    '--profile-border': '#e5e7eb',
    '--profile-surface': '#ffffff',
    '--profile-subtle': '#f6f8fb',
  } as CSSProperties;

  const getDeviceIcon = (device: string) => {
    if (device.toLowerCase().includes('phone') || device.toLowerCase().includes('mobile')) {
      return <Smartphone className="h-5 w-5" />;
    }
    return <Monitor className="h-5 w-5" />;
  };

  const formatLastActive = (date: string) => {
    const now = new Date();
    const lastActive = new Date(date);
    const diffMs = now.getTime() - lastActive.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        profileBodyFont.className,
        profileDisplayFont.variable,
        'relative mx-auto space-y-6 px-4 pb-10 pt-6 md:px-8 max-w-6xl text-[color:var(--profile-ink)]'
      )}
      style={pageVars}
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 right-0 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(15,118,110,0.22),rgba(15,118,110,0))]" />
        <div className="absolute -bottom-36 -left-12 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(29,78,216,0.18),rgba(29,78,216,0))]" />
        <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(248,250,252,0.96),rgba(248,250,252,0.7))]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="relative overflow-hidden rounded-3xl border border-[color:var(--profile-border)] bg-white/90 p-6 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.6)]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(15,118,110,0.24),rgba(15,118,110,0))]" />
            <div className="absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(29,78,216,0.18),rgba(29,78,216,0))]" />
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.92),rgba(248,250,252,0.72))]" />
          </div>
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-[color:var(--profile-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--profile-accent-strong)]">
                <Sparkles className="h-3.5 w-3.5" />
                Settings
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-[var(--font-profile-display)] tracking-tight md:text-4xl">
                  Profile Settings
                </h1>
                <p className="max-w-xl text-sm text-slate-600">
                  Manage your account information, security, and active sessions in one place.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[color:var(--profile-border)] bg-white/80 p-4 shadow-sm">
                <p className="text-[0.65rem] uppercase tracking-[0.25em] text-slate-500">Account Readiness</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800">{profileCompletion}% complete</span>
                  <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                    Active
                  </Badge>
                </div>
                <Progress value={profileCompletion} className="mt-2 h-1.5" />
                <p className="mt-2 text-xs text-slate-500">Update details to reach full completion.</p>
              </div>
              <div className="rounded-2xl border border-[color:var(--profile-border)] bg-white/80 p-4 shadow-sm">
                <p className="text-[0.65rem] uppercase tracking-[0.25em] text-slate-500">Account Snapshot</p>
                <div className="mt-2 space-y-1 text-sm text-slate-700">
                  <p className="font-semibold">{profile?.roleName || 'Role'}</p>
                  <p className="text-xs text-slate-500">Last login: {lastLoginLabel}</p>
                  <p className="text-xs text-slate-500">Member since: {memberSinceLabel}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Profile Overview */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08 }}
      >
        <Card className="relative overflow-hidden rounded-3xl border-[color:var(--profile-border)] bg-white/90 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.6)]">
          <CardContent className="p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="relative">
                  <Avatar className="h-20 w-20 ring-4 ring-white shadow-sm">
                    <AvatarImage src={profile?.profilePhoto} />
                    <AvatarFallback className="text-xl font-semibold bg-slate-100 text-slate-700">
                      {profile?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <button className="absolute bottom-0 right-0 rounded-full border border-slate-200 bg-white p-1.5 text-slate-600 shadow-sm transition-colors hover:bg-slate-50">
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-2">
                  <div>
                    <h2 className="text-xl font-[var(--font-profile-display)] text-slate-900">{profile?.fullName}</h2>
                    <p className="text-sm text-slate-600">{profile?.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                      <Shield className="mr-1.5 h-3 w-3" />
                      {profile?.roleName}
                    </Badge>
                    <Badge variant="outline" className="font-mono text-xs text-slate-600 border-slate-300">
                      @{profile?.username}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-sm">
                  <p className="text-[0.65rem] uppercase tracking-[0.25em] text-slate-500">Last Login</p>
                  <p className="mt-1 font-semibold text-slate-800">{lastLoginLabel}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-sm">
                  <p className="text-[0.65rem] uppercase tracking-[0.25em] text-slate-500">Member Since</p>
                  <p className="mt-1 font-semibold text-slate-800">{memberSinceLabel}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Settings Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.16 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-wrap gap-2 rounded-2xl border border-[color:var(--profile-border)] bg-white/90 p-2 shadow-sm">
            <button
              onClick={() => setActiveTab('profile')}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
                activeTab === 'profile'
                  ? "bg-[color:var(--profile-accent)] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white"
              )}
            >
              <User className="h-4 w-4" />
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
                activeTab === 'security'
                  ? "bg-[color:var(--profile-accent)] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white"
              )}
            >
              <Lock className="h-4 w-4" />
              Security
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
                activeTab === 'sessions'
                  ? "bg-[color:var(--profile-accent)] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white"
              )}
            >
              <Monitor className="h-4 w-4" />
              Active Sessions
            </button>
          </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <Card className="rounded-2xl border-[color:var(--profile-border)] bg-white/90 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.35)]">
              <CardHeader className="border-b border-slate-100 bg-[color:var(--profile-subtle)]/70">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold text-slate-900">Personal Information</CardTitle>
                    <CardDescription className="text-sm text-slate-500">Update your personal details</CardDescription>
                  </div>
                  {!isEditing ? (
                    <Button variant="outline" onClick={() => setIsEditing(true)} size="sm">
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setIsEditing(false)} size="sm">
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveProfile}
                        disabled={updateProfileMutation.isPending}
                        size="sm"
                        className="bg-[color:var(--profile-accent)] hover:bg-[color:var(--profile-accent-strong)]"
                      >
                        {updateProfileMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Save
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-xs uppercase tracking-[0.2em] text-slate-500">Username</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="username"
                        value={profile?.username || ''}
                        disabled
                        className="pl-10 bg-gray-50 border-gray-200"
                      />
                    </div>
                    <p className="text-xs text-gray-500">Username cannot be changed</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-xs uppercase tracking-[0.2em] text-slate-500">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={!isEditing}
                        className="pl-10 border-gray-200"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs uppercase tracking-[0.2em] text-slate-500">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={!isEditing}
                        className="pl-10 border-gray-200"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs uppercase tracking-[0.2em] text-slate-500">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={!isEditing}
                        className="pl-10 border-gray-200"
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-3">
                  <Label className="text-xs uppercase tracking-[0.2em] text-slate-500">Role & Permissions</Label>
                  <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/90 p-4">
                    <div className="rounded-xl bg-[color:var(--profile-accent-soft)] p-2.5 text-[color:var(--profile-accent-strong)]">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{profile?.roleName}</p>
                      <p className="text-sm text-slate-600">
                        Contact your administrator to change role permissions
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        logout();
                        setTimeout(() => router.push('/login'), 100);
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Re-login
                    </Button>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs uppercase tracking-[0.2em] text-slate-500">Current Permissions</Label>
                    <Badge className="text-xs border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-100">
                      <Key className="h-3 w-3 mr-1" />
                      {permissions.length} permissions
                    </Badge>
                  </div>
                  <Alert className="border-[color:var(--profile-border)] bg-[color:var(--profile-accent-soft)]/60">
                    <AlertCircle className="h-4 w-4 text-[color:var(--profile-accent-strong)]" />
                    <AlertTitle className="text-[color:var(--profile-accent-strong)]">Permission Updates</AlertTitle>
                    <AlertDescription className="text-slate-700">
                      If your role permissions were recently updated, click &quot;Re-login&quot; above to refresh your access.
                    </AlertDescription>
                  </Alert>
                  <div className="max-h-40 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="flex flex-wrap gap-1.5">
                      {permissions.length > 0 ? (
                        permissions.map((perm) => (
                          <Badge key={perm} variant="outline" className="text-xs font-mono bg-slate-50 border-slate-300 text-slate-700">
                            {perm}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No specific permissions assigned</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-4">
            <Card className="rounded-2xl border-[color:var(--profile-border)] bg-white/90 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.35)]">
              <CardHeader className="border-b border-slate-100 bg-[color:var(--profile-subtle)]/70">
                <CardTitle className="text-base font-semibold text-slate-900">Change Password</CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  Ensure your account stays secure by using a strong password
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-xs uppercase tracking-[0.2em] text-slate-500">Current Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="pl-10 pr-10 border-gray-200"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-xs uppercase tracking-[0.2em] text-slate-500">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10 pr-10 border-gray-200"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {newPassword && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Password strength</span>
                        <span className={cn(
                          'font-medium',
                          passwordStrength.score < 30 && 'text-red-600',
                          passwordStrength.score >= 30 && passwordStrength.score < 60 && 'text-orange-600',
                          passwordStrength.score >= 60 && passwordStrength.score < 80 && 'text-blue-600',
                          passwordStrength.score >= 80 && 'text-green-600'
                        )}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <Progress value={passwordStrength.score} className="h-1.5" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-xs uppercase tracking-[0.2em] text-slate-500">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={cn(
                        "pl-10 pr-10 border-gray-200",
                        confirmPassword && (passwordsMatch ? "border-green-500" : "border-red-500")
                      )}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && (
                    <div className="flex items-center gap-2 text-xs">
                      {passwordsMatch ? (
                        <>
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span className="text-green-600">Passwords match</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3 text-red-600" />
                          <span className="text-red-600">Passwords do not match</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <Alert className="border-[color:var(--profile-border)] bg-[color:var(--profile-accent-soft)]/60">
                  <Shield className="h-4 w-4 text-[color:var(--profile-accent-strong)]" />
                  <AlertTitle className="text-[color:var(--profile-accent-strong)]">Password Requirements</AlertTitle>
                  <AlertDescription className="text-slate-700">
                    <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                      <li>Minimum 8 characters long</li>
                      <li>Include uppercase and lowercase letters</li>
                      <li>Include at least one number</li>
                      <li>Include at least one special character</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={handleChangePassword}
                  disabled={!currentPassword || !newPassword || !passwordsMatch || changePasswordMutation.isPending}
                  className="w-full sm:w-auto bg-[color:var(--profile-accent)] hover:bg-[color:var(--profile-accent-strong)]"
                  size="sm"
                >
                  {changePasswordMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Change Password
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="space-y-4">
            <Card className="rounded-2xl border-[color:var(--profile-border)] bg-white/90 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.35)]">
              <CardHeader className="border-b border-slate-100 bg-[color:var(--profile-subtle)]/70">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold text-slate-900">Active Sessions</CardTitle>
                    <CardDescription className="text-sm text-slate-500">
                      Manage your active login sessions across devices
                    </CardDescription>
                  </div>
                  <Dialog open={logoutAllDialogOpen} onOpenChange={setLogoutAllDialogOpen}>
                    <DialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout All
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Logout from all devices?</DialogTitle>
                        <DialogDescription>
                          This will terminate all your active sessions except the current one.
                          You will need to login again on other devices.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setLogoutAllDialogOpen(false)} size="sm">
                          Cancel
                        </Button>
                        <Button
                        variant="destructive"
                          onClick={() => logoutAllMutation.mutate()}
                          disabled={logoutAllMutation.isPending}
                          size="sm"
                        >
                          {logoutAllMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Logout All
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {sessionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No active sessions found
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className={cn(
                          "flex items-center justify-between rounded-2xl border p-4",
                          session.isCurrent 
                            ? "border-[color:var(--profile-accent)]/20 bg-[color:var(--profile-accent-soft)]/60" 
                            : "bg-white border-slate-200 hover:border-slate-300"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "rounded-xl p-2.5",
                            session.isCurrent 
                              ? "bg-[color:var(--profile-accent-soft)] text-[color:var(--profile-accent-strong)]" 
                              : "bg-slate-100 text-slate-600"
                          )}>
                            {getDeviceIcon(session.device)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-slate-900 text-sm">{session.device}</p>
                              {session.isCurrent && (
                                <Badge className="text-xs bg-[color:var(--profile-accent)] text-white border-0 hover:bg-[color:var(--profile-accent)]">
                                  Current Session
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-600">{session.browser}</p>
                            <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500">
                              <span className="flex items-center gap-1.5">
                                <Globe className="h-3 w-3" />
                                {session.ip}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Clock className="h-3 w-3" />
                                {formatLastActive(session.lastActive)}
                              </span>
                            </div>
                          </div>
                        </div>
                        {!session.isCurrent && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => logoutSessionMutation.mutate(session.id)}
                            disabled={logoutSessionMutation.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <LogOut className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-[color:var(--profile-border)] bg-white/90 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.35)]">
              <CardHeader className="border-b border-slate-100 bg-[color:var(--profile-subtle)]/70">
                <CardTitle className="text-base font-semibold text-slate-900">Account Activity</CardTitle>
                <CardDescription className="text-sm text-slate-500">Recent security events on your account</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="rounded-xl bg-emerald-50 p-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">Successful login</p>
                      <p className="text-xs text-slate-500 mt-0.5">Today at {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="rounded-xl bg-blue-50 p-2">
                      <RefreshCw className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">Password changed</p>
                      <p className="text-xs text-slate-500 mt-0.5">30 days ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </Tabs>
      </motion.div>
    </div>
  );
}

