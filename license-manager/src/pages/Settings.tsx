import { useState, useEffect, type FormEvent } from 'react';
import { useAdminStore } from '../store/useAdminStore';
import { api } from '../lib/api';
import {
  Shield,
  KeyRound,
  Mail,
  Lock,
  UserPlus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface AdminAccount {
  id: string;
  email: string;
  createdAt: string;
  lastLogin: string | null;
  loginCount?: number;
}

export function SettingsPage() {
  const { admin, updateEmail, updatePassword } = useAdminStore();

  // Email form state
  const [newEmail, setNewEmail] = useState('');
  const [emailCurrentPassword, setEmailCurrentPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailError, setEmailError] = useState('');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Admin accounts list state
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(true);
  const [createAdminOpen, setCreateAdminOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [adminActionError, setAdminActionError] = useState('');
  const [adminActionSuccess, setAdminActionSuccess] = useState('');

  async function loadAdmins() {
    setAdminsLoading(true);
    try {
      const res = await api.get<{ admins: AdminAccount[] }>('/api/admin/list');
      setAdmins(res.data.admins);
    } catch {
      // ignore
    } finally {
      setAdminsLoading(false);
    }
  }

  useEffect(() => {
    loadAdmins();
  }, []);

  async function handleEmailChange(e: FormEvent) {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess('');

    if (!newEmail.trim()) {
      setEmailError('Please enter a new email address.');
      return;
    }
    if (!emailCurrentPassword) {
      setEmailError('Please enter your current password to authorize this change.');
      return;
    }

    setEmailLoading(true);
    try {
      await updateEmail(newEmail.trim(), emailCurrentPassword);
      setEmailSuccess('Email updated successfully! Your login email is now updated.');
      setNewEmail('');
      setEmailCurrentPassword('');
      loadAdmins();
    } catch (err: any) {
      setEmailError(err.message || 'Failed to update email.');
    } finally {
      setEmailLoading(false);
    }
  }

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword) {
      setPasswordError('Please provide your current and new password.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      await updatePassword(currentPassword, newPassword);
      setPasswordSuccess(
        'Password updated successfully! Next login will require your new password.'
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleCreateNewAdmin(e: FormEvent) {
    e.preventDefault();
    setAdminActionError('');
    setAdminActionSuccess('');

    if (!createEmail.trim() || !createPassword) {
      setAdminActionError('Email and password are required.');
      return;
    }
    if (createPassword.length < 8) {
      setAdminActionError('Password must be at least 8 characters.');
      return;
    }

    setCreateLoading(true);
    try {
      await api.post('/api/admin/create', {
        email: createEmail.trim(),
        password: createPassword,
      });
      setAdminActionSuccess(`Administrator ${createEmail.trim()} created successfully.`);
      setCreateEmail('');
      setCreatePassword('');
      setCreateAdminOpen(false);
      loadAdmins();
    } catch (err: any) {
      setAdminActionError(err?.response?.data?.error || err.message || 'Failed to create admin.');
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleDeleteAdmin(id: string, email: string) {
    if (!confirm(`Are you sure you want to remove administrator ${email}?`)) {
      return;
    }
    setAdminActionError('');
    setAdminActionSuccess('');
    try {
      await api.post('/api/admin/delete', { id });
      setAdminActionSuccess(`Administrator ${email} removed.`);
      loadAdmins();
    } catch (err: any) {
      setAdminActionError(err?.response?.data?.error || err.message || 'Failed to delete admin.');
    }
  }

  return (
    <div
      className="page-wrapper"
      style={{ padding: '24px 32px', maxWidth: 1100, margin: '0 auto' }}
    >
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Shield size={24} style={{ color: 'var(--color-accent)' }} />
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
            Dynamic Credentials & Security
          </h1>
        </div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>
          Manage your administrator email, passwords, and team access dynamically directly from the
          database without hardcoded values.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 24,
          marginBottom: 28,
        }}
      >
        {/* Email Card */}
        <div
          style={{
            background: 'var(--color-surface, #1e222d)',
            borderRadius: 12,
            border: '1px solid var(--color-border, #2d3342)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'rgba(6, 182, 212, 0.12)',
                color: '#06B6D4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Mail size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: 'var(--color-text)' }}>
                Update Administrator Email
              </h3>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                Current: <strong style={{ color: 'var(--color-text)' }}>{admin?.email}</strong>
              </span>
            </div>
          </div>

          {emailSuccess && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10B981',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 13,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <CheckCircle2 size={16} />
              {emailSuccess}
            </div>
          )}

          {emailError && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#EF4444',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 13,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertCircle size={16} />
              {emailError}
            </div>
          )}

          <form
            onSubmit={handleEmailChange}
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 6,
                  color: 'var(--color-text-muted)',
                }}
              >
                New Email Address
              </label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="new-admin@forgeqa.in"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--color-border, #333)',
                  background: 'var(--color-bg, #14171f)',
                  color: 'var(--color-text, #fff)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 6,
                  color: 'var(--color-text-muted)',
                }}
              >
                Confirm Current Password
              </label>
              <input
                type="password"
                required
                value={emailCurrentPassword}
                onChange={(e) => setEmailCurrentPassword(e.target.value)}
                placeholder="Enter current password to verify"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--color-border, #333)',
                  background: 'var(--color-bg, #14171f)',
                  color: 'var(--color-text, #fff)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={emailLoading}
              style={{
                marginTop: 6,
                padding: '10px 16px',
                background: 'var(--color-accent, #06B6D4)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: emailLoading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: emailLoading ? 0.7 : 1,
              }}
            >
              {emailLoading && <Loader2 size={16} className="animate-spin" />}
              {emailLoading ? 'Updating Email...' : 'Update Dynamic Email'}
            </button>
          </form>
        </div>

        {/* Password Card */}
        <div
          style={{
            background: 'var(--color-surface, #1e222d)',
            borderRadius: 12,
            border: '1px solid var(--color-border, #2d3342)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <KeyRound size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: 'var(--color-text)' }}>
                Change Password
              </h3>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                Updated dynamically with secure PBKDF2 hash
              </span>
            </div>
          </div>

          {passwordSuccess && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10B981',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 13,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <CheckCircle2 size={16} />
              {passwordSuccess}
            </div>
          )}

          {passwordError && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#EF4444',
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: 13,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertCircle size={16} />
              {passwordError}
            </div>
          )}

          <form
            onSubmit={handlePasswordChange}
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 6,
                  color: 'var(--color-text-muted)',
                }}
              >
                Current Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  style={{
                    width: '100%',
                    padding: '10px 36px 10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--color-border, #333)',
                    background: 'var(--color-bg, #14171f)',
                    color: 'var(--color-text, #fff)',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 6,
                  color: 'var(--color-text-muted)',
                }}
              >
                New Password (minimum 8 chars)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNewPass ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Choose a strong password"
                  style={{
                    width: '100%',
                    padding: '10px 36px 10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--color-border, #333)',
                    background: 'var(--color-bg, #14171f)',
                    color: 'var(--color-text, #fff)',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 6,
                  color: 'var(--color-text-muted)',
                }}
              >
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--color-border, #333)',
                  background: 'var(--color-bg, #14171f)',
                  color: 'var(--color-text, #fff)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              style={{
                marginTop: 6,
                padding: '10px 16px',
                background: '#10B981',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: passwordLoading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: passwordLoading ? 0.7 : 1,
              }}
            >
              {passwordLoading && <Loader2 size={16} className="animate-spin" />}
              {passwordLoading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        </div>
      </div>

      {/* Admin Accounts List */}
      <div
        style={{
          background: 'var(--color-surface, #1e222d)',
          borderRadius: 12,
          border: '1px solid var(--color-border, #2d3342)',
          padding: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <div>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 600,
                margin: '0 0 4px',
                color: 'var(--color-text)',
              }}
            >
              Active Administrator Accounts
            </h3>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              All dynamic credentials stored securely in MongoDB
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={loadAdmins}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid var(--color-border, #333)',
                background: 'transparent',
                color: 'var(--color-text-muted)',
                fontSize: 13,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <RefreshCw size={14} className={adminsLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setCreateAdminOpen(!createAdminOpen)}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--color-accent, #06B6D4)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <UserPlus size={15} />
              {createAdminOpen ? 'Cancel' : 'Add Administrator'}
            </button>
          </div>
        </div>

        {adminActionSuccess && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10B981',
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: 13,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <CheckCircle2 size={16} />
            {adminActionSuccess}
          </div>
        )}

        {adminActionError && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#EF4444',
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: 13,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertCircle size={16} />
            {adminActionError}
          </div>
        )}

        {createAdminOpen && (
          <form
            onSubmit={handleCreateNewAdmin}
            style={{
              background: 'var(--color-bg, #14171f)',
              padding: 18,
              borderRadius: 8,
              border: '1px dashed var(--color-accent, #06B6D4)',
              marginBottom: 20,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 14,
              alignItems: 'flex-end',
            }}
          >
            <div style={{ flex: '1 1 220px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 6,
                  color: 'var(--color-text-muted)',
                }}
              >
                Admin Email
              </label>
              <input
                type="email"
                required
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                placeholder="teammate@company.com"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--color-border, #333)',
                  background: 'var(--color-surface, #1e222d)',
                  color: '#fff',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ flex: '1 1 220px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 6,
                  color: 'var(--color-text-muted)',
                }}
              >
                Password (min 8 chars)
              </label>
              <input
                type="password"
                required
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                placeholder="Choose temporary or permanent password"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--color-border, #333)',
                  background: 'var(--color-surface, #1e222d)',
                  color: '#fff',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={createLoading}
              style={{
                padding: '10px 18px',
                background: 'var(--color-accent, #06B6D4)',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {createLoading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <UserPlus size={15} />
              )}
              Create Admin
            </button>
          </form>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table
            style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--color-border, #2d3342)',
                  color: 'var(--color-text-muted)',
                }}
              >
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Administrator Email</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Created Date</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Last Login</th>
                <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {admins.map((acc) => {
                const isCurrent = acc.id === admin?.id || acc.email === admin?.email;
                return (
                  <tr
                    key={acc.id}
                    style={{
                      borderBottom: '1px solid var(--color-border, rgba(255,255,255,0.05))',
                    }}
                  >
                    <td style={{ padding: '14px', color: 'var(--color-text)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 600 }}>{acc.email}</span>
                        {isCurrent && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: 9999,
                              background: 'rgba(6, 182, 212, 0.15)',
                              color: '#06B6D4',
                            }}
                          >
                            You (Current)
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px', color: 'var(--color-text-muted)' }}>
                      {new Date(acc.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '14px', color: 'var(--color-text-muted)' }}>
                      {acc.lastLogin ? new Date(acc.lastLogin).toLocaleString() : 'Never logged in'}
                    </td>
                    <td style={{ padding: '14px', textAlign: 'right' }}>
                      {!isCurrent && admins.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteAdmin(acc.id, acc.email)}
                          title="Remove administrator"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#EF4444',
                            cursor: 'pointer',
                            padding: 6,
                            borderRadius: 6,
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
