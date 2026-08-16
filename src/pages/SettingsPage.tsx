import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { dataService } from '@/services/dataService';
import { User as UserIcon, Bell, Shield, LogOut, RotateCcw } from 'lucide-react';
import type { Settings as SettingsType } from '@/types';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}

function ToggleSwitch({ checked, onChange, label, description }: ToggleSwitchProps) {
  return (
    <div className="setting-row">
      <div className="setting-row-text">
        <span className="setting-row-label">{label}</span>
        {description && <span className="setting-row-desc">{description}</span>}
      </div>
      <button
        className={`toggle-switch ${checked ? 'on' : ''}`}
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        aria-label={label}
      >
        <span className="toggle-switch-thumb" />
      </button>
    </div>
  );
}

export function SettingsPage() {
  const { settings, saveSettings, currentUser, logout, showToast } = useApp();
  const [local, setLocal] = useState<SettingsType>(settings);
  const [resetOpen, setResetOpen] = useState(false);

  const update = (partial: Partial<SettingsType>) => setLocal({ ...local, ...partial });

  const handleSave = () => saveSettings(local);

  const handleReset = () => {
    dataService.resetAll();
    showToast('Data reset to defaults', 'info');
    setTimeout(() => window.location.reload(), 500);
  };

  return (
    <div className="page-container">
      <PageHeader title="SETTINGS" description="Manage your account, appearance, and security preferences." />

      <div className="settings-grid">
        {/* Account */}
        <GlassCard className="settings-section">
          <div className="settings-section-header">
            <div className="settings-section-icon"><UserIcon size={18} /></div>
            <h3 className="settings-section-title">Account</h3>
          </div>
          <div className="settings-section-body">
            <div className="setting-row">
              <div className="setting-row-text">
                <span className="setting-row-label">Profile</span>
                <span className="setting-row-desc">{currentUser?.name}</span>
              </div>
              <div className="setting-avatar" style={{ background: currentUser?.avatarColor }}>
                {currentUser?.name.charAt(0)}
              </div>
            </div>
            <div className="setting-divider" />
            <div className="setting-row">
              <div className="setting-row-text">
                <span className="setting-row-label">Email</span>
                <span className="setting-row-desc">{currentUser?.email}</span>
              </div>
            </div>
            <div className="setting-divider" />
            <div className="setting-row">
              <div className="setting-row-text">
                <span className="setting-row-label">Role</span>
                <span className="setting-row-desc">{currentUser?.role}</span>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Notifications */}
        <GlassCard className="settings-section">
          <div className="settings-section-header">
            <div className="settings-section-icon"><Bell size={18} /></div>
            <h3 className="settings-section-title">Notifications</h3>
          </div>
          <div className="settings-section-body">
            <ToggleSwitch
              label="Security Alerts"
              description="Receive notifications for all security alerts"
              checked={local.notifications.securityAlerts}
              onChange={(v) => update({ notifications: { ...local.notifications, securityAlerts: v } })}
            />
            <div className="setting-divider" />
            <ToggleSwitch
              label="Critical Alerts"
              description="Immediate notification for critical severity alerts"
              checked={local.notifications.criticalAlerts}
              onChange={(v) => update({ notifications: { ...local.notifications, criticalAlerts: v } })}
            />
            <div className="setting-divider" />
            <ToggleSwitch
              label="Email Notifications"
              description="Send alert summaries to your email"
              checked={local.notifications.emailNotifications}
              onChange={(v) => update({ notifications: { ...local.notifications, emailNotifications: v } })}
            />
          </div>
        </GlassCard>

        {/* Security */}
        <GlassCard className="settings-section">
          <div className="settings-section-header">
            <div className="settings-section-icon"><Shield size={18} /></div>
            <h3 className="settings-section-title">Security</h3>
          </div>
          <div className="settings-section-body">
            <ToggleSwitch
              label="Shield Confirmation"
              description="Require confirmation before changing shield status"
              checked={local.security.shieldConfirmation}
              onChange={(v) => update({ security: { ...local.security, shieldConfirmation: v } })}
            />
            <div className="setting-divider" />
            <ToggleSwitch
              label="Login Security"
              description="Additional verification on login"
              checked={local.security.loginSecurity}
              onChange={(v) => update({ security: { ...local.security, loginSecurity: v } })}
            />
          </div>
        </GlassCard>

        {/* Danger Zone */}
        <GlassCard className="settings-section">
          <div className="settings-section-header">
            <div className="settings-section-icon danger"><RotateCcw size={18} /></div>
            <h3 className="settings-section-title">Data Management</h3>
          </div>
          <div className="settings-section-body">
            <div className="setting-row">
              <div className="setting-row-text">
                <span className="setting-row-label">Reset All Data</span>
                <span className="setting-row-desc">Restore all buildings, labs, computers, and alerts to defaults</span>
              </div>
              <Button variant="danger" size="sm" onClick={() => setResetOpen(true)}>Reset</Button>
            </div>
            <div className="setting-divider" />
            <div className="setting-row">
              <div className="setting-row-text">
                <span className="setting-row-label">Sign Out</span>
                <span className="setting-row-desc">Sign out of your current session</span>
              </div>
              <Button variant="secondary" size="sm" onClick={logout}><LogOut size={15} /> Sign Out</Button>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="settings-save-bar">
        <Button onClick={handleSave}>Save Settings</Button>
      </div>

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={handleReset}
        title="Reset All Data?"
        message="This will permanently delete all your current data and restore the default seed data. This action cannot be undone."
        confirmLabel="Reset Everything"
      />
    </div>
  );
}
