import { useEffect, useRef, useState } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  Sparkles,
  Settings,
  LogOut,
  User,
  Building2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useApp } from '@/lib/store';
import { supabase } from '@/lib/supabase';

export function TopBar({
  onToggleAI,
}: {
  onToggleAI: () => void;
}) {
  const { merchant, signOut } = useApp();
  const navigate = useNavigate();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const [email, setEmail] = useState('');

  /* ============================================================
     CURRENT USER
  ============================================================ */

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (mounted) {
        setEmail(user?.email ?? '');
      }
    };

    void loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  /* ============================================================
     CLOSE MENUS WHEN CLICKING OUTSIDE
  ============================================================ */

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        profileRef.current &&
        !profileRef.current.contains(target)
      ) {
        setProfileOpen(false);
      }

      if (
        workspaceRef.current &&
        !workspaceRef.current.contains(target)
      ) {
        setWorkspaceOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(target)
      ) {
        setNotifOpen(false);
      }
    };

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, []);

  /* ============================================================
     SIGN OUT
  ============================================================ */

  const handleSignOut = async () => {
    setProfileOpen(false);

    await signOut();

    navigate('/signin', {
      replace: true,
    });
  };

  /* ============================================================
     PROFILE INITIAL
  ============================================================ */

  const profileInitial =
    merchant.businessName?.trim().charAt(0).toUpperCase() ||
    email?.charAt(0).toUpperCase() ||
    'M';

  return (
    <header className="sticky top-0 z-40 h-16 bg-ink-950/80 backdrop-blur-xl border-b border-ink-700/40 flex items-center px-6 gap-4">
      {/* ========================================================
          WORKSPACE
      ======================================================== */}

      <div
        ref={workspaceRef}
        className="relative"
      >
        <button
          type="button"
          onClick={() => {
            setWorkspaceOpen((previous) => !previous);
            setProfileOpen(false);
            setNotifOpen(false);
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ink-800/60 border border-ink-700/50 hover:border-ink-600 transition-colors"
        >
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-electric-500 to-accent-500 flex items-center justify-center text-2xs font-bold text-white">
            {profileInitial}
          </div>

          <span className="text-sm font-medium text-white hidden sm:block">
            {merchant.businessName || 'MerchantOS'}
          </span>

          <ChevronDown
            className={`w-3.5 h-3.5 text-ink-400 transition-transform ${
              workspaceOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {workspaceOpen && (
          <div className="absolute left-0 top-12 w-72 surface p-2 shadow-glow z-50">
            <div className="px-3 py-3 border-b border-ink-700/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-electric-500 to-accent-500 flex items-center justify-center text-sm font-bold text-white">
                  {profileInitial}
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {merchant.businessName ||
                      'MerchantOS Workspace'}
                  </p>

                  <p className="text-xs text-ink-500 truncate">
                    Demo Workspace
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setWorkspaceOpen(false);
                navigate('/app/settings');
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 mt-2 rounded-lg text-left hover:bg-ink-800/70 transition-colors"
            >
              <Building2 className="w-4 h-4 text-ink-400" />

              <div>
                <p className="text-sm text-white">
                  Workspace settings
                </p>

                <p className="text-2xs text-ink-500">
                  Manage merchant configuration
                </p>
              </div>
            </button>
          </div>
        )}
      </div>

      <span className="text-2xs text-ink-500 px-2 py-1 rounded-full bg-ink-800/60 border border-ink-700/40 hidden md:block">
        Demo Workspace
      </span>

      {/* ========================================================
          SEARCH
      ======================================================== */}

      <div className="flex-1 max-w-md mx-auto hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />

          <input
            placeholder="Search transactions, agents, products..."
            className="w-full bg-ink-800/40 border border-ink-700/50 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-ink-500 focus:outline-none focus:border-electric-500/40 transition-colors"
          />
        </div>
      </div>

      {/* ========================================================
          ACTIONS
      ======================================================== */}

      <div className="flex items-center gap-2 ml-auto">
        {/* AI */}
        <button
          type="button"
          onClick={onToggleAI}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-electric-500/10 border border-electric-500/30 text-electric-300 hover:bg-electric-500/20 transition-colors text-sm"
        >
          <Sparkles className="w-4 h-4" />

          <span className="hidden sm:block">
            AI Assistant
          </span>
        </button>

        {/* ======================================================
            NOTIFICATIONS
        ====================================================== */}

        <div
          ref={notificationRef}
          className="relative"
        >
          <button
            type="button"
            onClick={() => {
              setNotifOpen((previous) => !previous);
              setProfileOpen(false);
              setWorkspaceOpen(false);
            }}
            className="relative w-9 h-9 rounded-xl bg-ink-800/60 border border-ink-700/50 flex items-center justify-center hover:border-ink-600 transition-colors"
          >
            <Bell className="w-4 h-4 text-ink-300" />

            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-electric-400" />
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-12 w-80 surface p-4 shadow-glow z-50">
              <p className="text-sm font-semibold text-white mb-3">
                Notifications
              </p>

              <div className="space-y-3">
                {[
                  {
                    title: 'New revenue opportunity',
                    detail:
                      'Bundle: Laptop Sleeve + Wireless Mouse',
                    time: '2m ago',
                  },
                  {
                    title: 'Transaction escalated',
                    detail:
                      'Procurement Agent — ₹23,400',
                    time: '3h ago',
                  },
                  {
                    title: 'OpenTab expiring soon',
                    detail:
                      'AI Shopping Assistant — expires 6 PM',
                    time: '1h ago',
                  },
                ].map((notification, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 pb-3 border-b border-ink-700/40 last:border-0 last:pb-0"
                  >
                    <span className="w-2 h-2 rounded-full bg-electric-400 mt-1.5 shrink-0" />

                    <div>
                      <p className="text-xs font-medium text-white">
                        {notification.title}
                      </p>

                      <p className="text-2xs text-ink-400 mt-0.5">
                        {notification.detail}
                      </p>

                      <p className="text-2xs text-ink-500 mt-0.5">
                        {notification.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ======================================================
            PROFILE / M BUTTON
        ====================================================== */}

        <div
          ref={profileRef}
          className="relative"
        >
          <button
            type="button"
            aria-label="Open profile menu"
            aria-expanded={profileOpen}
            onClick={() => {
              setProfileOpen((previous) => !previous);
              setNotifOpen(false);
              setWorkspaceOpen(false);
            }}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-electric-500 to-accent-500 flex items-center justify-center text-sm font-bold text-white hover:scale-105 active:scale-95 transition-transform"
          >
            {profileInitial}
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-12 w-72 surface p-2 shadow-glow z-50">
              {/* USER INFO */}
              <div className="px-3 py-3 border-b border-ink-700/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-electric-500 to-accent-500 flex items-center justify-center text-sm font-bold text-white">
                    {profileInitial}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {merchant.businessName ||
                        'MerchantOS Merchant'}
                    </p>

                    <p className="text-xs text-ink-500 truncate">
                      {email || 'Merchant account'}
                    </p>
                  </div>
                </div>
              </div>

              {/* ACCOUNT */}
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  navigate('/app/settings');
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 mt-2 rounded-lg text-left hover:bg-ink-800/70 transition-colors"
              >
                <User className="w-4 h-4 text-ink-400" />

                <div>
                  <p className="text-sm text-white">
                    Account
                  </p>

                  <p className="text-2xs text-ink-500">
                    Merchant profile & preferences
                  </p>
                </div>
              </button>

              {/* SETTINGS */}
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  navigate('/app/settings');
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-ink-800/70 transition-colors"
              >
                <Settings className="w-4 h-4 text-ink-400" />

                <span className="text-sm text-white">
                  Settings
                </span>
              </button>

              {/* SIGN OUT */}
              <div className="border-t border-ink-700/40 mt-2 pt-2">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-danger-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-danger-400" />

                  <span className="text-sm text-danger-300">
                    Sign out
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}