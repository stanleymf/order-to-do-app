import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Users, Settings, Trash2, Eye, EyeOff } from 'lucide-react';
import { AuthService } from '../utils/authService';
import { toast } from 'sonner';
import type { User } from '../types';

interface UserManagementProps {
  currentUser: User;
}

export function UserManagement({ currentUser }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  // Registration form state
  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    role: 'florist' as 'admin' | 'florist',
    password: '',
    confirmPassword: ''
  });
  const [regError, setRegError] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  
  // Profile update form state
  const [profileForm, setProfileForm] = useState({
    name: currentUser.name,
    email: currentUser.email,
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [profileError, setProfileError] = useState('');
  const [showProfilePasswords, setShowProfilePasswords] = useState(false);

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    const result = await AuthService.getUsers();
    
    if (result.success && result.users) {
      setUsers(result.users);
    } else {
      toast.error(result.error || 'Failed to load users');
    }
    
    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    // Validation
    if (!regForm.name || !regForm.email || !regForm.password) {
      setRegError('All fields are required');
      return;
    }

    if (regForm.password !== regForm.confirmPassword) {
      setRegError('Passwords do not match');
      return;
    }

    if (regForm.password.length < 6) {
      setRegError('Password must be at least 6 characters');
      return;
    }

    setIsRegistering(true);

    const result = await AuthService.register({
      name: regForm.name,
      email: regForm.email,
      role: regForm.role,
      password: regForm.password
    });

    if (result.success) {
      toast.success('User registered successfully');
      setRegForm({
        name: '',
        email: '',
        role: 'florist',
        password: '',
        confirmPassword: ''
      });
      loadUsers(); // Refresh user list
    } else {
      setRegError(result.error || 'Registration failed');
    }

    setIsRegistering(false);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');

    // Validation
    if (!profileForm.name || !profileForm.email) {
      setProfileError('Name and email are required');
      return;
    }

    if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmNewPassword) {
      setProfileError('New passwords do not match');
      return;
    }

    if (profileForm.newPassword && profileForm.newPassword.length < 6) {
      setProfileError('New password must be at least 6 characters');
      return;
    }

    if (profileForm.newPassword && !profileForm.currentPassword) {
      setProfileError('Current password is required to change password');
      return;
    }

    setIsUpdatingProfile(true);

    const updates: any = {
      name: profileForm.name,
      email: profileForm.email
    };

    if (profileForm.newPassword) {
      updates.currentPassword = profileForm.currentPassword;
      updates.newPassword = profileForm.newPassword;
    }

    const result = await AuthService.updateProfile(updates);

    if (result.success) {
      toast.success('Profile updated successfully');
      setProfileForm({
        ...profileForm,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });
    } else {
      setProfileError(result.error || 'Profile update failed');
    }

    setIsUpdatingProfile(false);
  };

  const handleDeactivateUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to deactivate ${userName}? This action cannot be undone.`)) {
      return;
    }

    const result = await AuthService.deactivateUser(userId);

    if (result.success) {
      toast.success(`${userName} has been deactivated`);
      loadUsers(); // Refresh user list
    } else {
      toast.error(result.error || 'Failed to deactivate user');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage user accounts and permissions</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            All Users
          </TabsTrigger>
          <TabsTrigger value="register" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Register User
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            My Profile
          </TabsTrigger>
        </TabsList>

        {/* Users List Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                Manage all registered users in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-medium">{user.name}</h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-xs text-gray-500">
                            Created: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                        <Badge variant={user.isActive !== false ? 'default' : 'destructive'}>
                          {user.isActive !== false ? 'Active' : 'Inactive'}
                        </Badge>
                        {user.id !== currentUser.id && user.isActive !== false && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeactivateUser(user.id, user.name)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {users.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No users found</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Register User Tab */}
        <TabsContent value="register">
          <Card>
            <CardHeader>
              <CardTitle>Register New User</CardTitle>
              <CardDescription>
                Create a new user account for the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">Full Name</Label>
                    <Input
                      id="reg-name"
                      value={regForm.name}
                      onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                      placeholder="Enter full name"
                      required
                      disabled={isRegistering}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">Email</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      value={regForm.email}
                      onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                      placeholder="Enter email address"
                      required
                      disabled={isRegistering}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reg-role">Role</Label>
                  <Select
                    value={regForm.role}
                    onValueChange={(value: 'admin' | 'florist') => setRegForm({ ...regForm, role: value })}
                    disabled={isRegistering}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="florist">Florist</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="reg-password"
                        type={showRegPassword ? "text" : "password"}
                        value={regForm.password}
                        onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                        placeholder="Enter password"
                        required
                        disabled={isRegistering}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        disabled={isRegistering}
                      >
                        {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-confirm-password">Confirm Password</Label>
                    <Input
                      id="reg-confirm-password"
                      type={showRegPassword ? "text" : "password"}
                      value={regForm.confirmPassword}
                      onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                      placeholder="Confirm password"
                      required
                      disabled={isRegistering}
                    />
                  </div>
                </div>

                {regError && (
                  <Alert variant="destructive">
                    <AlertDescription>{regError}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" disabled={isRegistering} className="w-full">
                  {isRegistering ? 'Registering...' : 'Register User'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>My Profile</CardTitle>
              <CardDescription>
                Update your personal information and password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="profile-name">Full Name</Label>
                    <Input
                      id="profile-name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      placeholder="Enter full name"
                      required
                      disabled={isUpdatingProfile}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-email">Email</Label>
                    <Input
                      id="profile-email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      placeholder="Enter email address"
                      required
                      disabled={isUpdatingProfile}
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-4">Change Password (Optional)</h4>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="current-password"
                          type={showProfilePasswords ? "text" : "password"}
                          value={profileForm.currentPassword}
                          onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                          placeholder="Enter current password"
                          disabled={isUpdatingProfile}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowProfilePasswords(!showProfilePasswords)}
                          disabled={isUpdatingProfile}
                        >
                          {showProfilePasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                          id="new-password"
                          type={showProfilePasswords ? "text" : "password"}
                          value={profileForm.newPassword}
                          onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                          placeholder="Enter new password"
                          disabled={isUpdatingProfile}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                        <Input
                          id="confirm-new-password"
                          type={showProfilePasswords ? "text" : "password"}
                          value={profileForm.confirmNewPassword}
                          onChange={(e) => setProfileForm({ ...profileForm, confirmNewPassword: e.target.value })}
                          placeholder="Confirm new password"
                          disabled={isUpdatingProfile}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {profileError && (
                  <Alert variant="destructive">
                    <AlertDescription>{profileError}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" disabled={isUpdatingProfile} className="w-full">
                  {isUpdatingProfile ? 'Updating...' : 'Update Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 