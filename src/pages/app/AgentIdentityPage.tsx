import { useState } from 'react';
import {
  Bot,
  Pause,
  Play,
  Eye,
  Clock,
  Activity,
  CheckCircle2,
  Ban,
  ShieldCheck,
} from 'lucide-react';
import { PageHeader } from '@/components/app/AppLayout';
import { Card } from '@/components/ui/Card';
import { Badge, TrustBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { Reveal } from '@/components/ui/Reveal';
import { useApp } from '@/lib/store';
import type { AgentIdentity, TrustLevel } from '@/lib/types';

const trustConfig: Record<
  TrustLevel,
  { label: string; tone: 'success' | 'warning' | 'danger'; color: string; bg: string; border: string; desc: string }
> = {
  verified: {
    label: 'Verified Identity',
    tone: 'success',
    color: 'text-success-400',
    bg: 'bg-success-500/10',
    border: 'border-success-500/30',
    desc: 'Identity verified and authorized through cryptographic protocol. Full transaction capabilities granted within merchant policies.',
  },
  known: {
    label: 'Known Identity',
    tone: 'warning',
    color: 'text-warning-400',
    bg: 'bg-warning-500/10',
    border: 'border-warning-500/30',
    desc: 'Recognized by catalog activity but has limited permissions. Restricted to catalog discovery and inquiry — transactions require merchant approval.',
  },
  unknown: {
    label: 'Unknown Identity',
    tone: 'danger',
    color: 'text-danger-400',
    bg: 'bg-danger-500/10',
    border: 'border-danger-500/30',
    desc: 'Unauthenticated or unrecognized agent. Restricted strictly to public storefront data. No access to private pricing, bulk quotes, or transaction systems.',
  },
};

export default function AgentIdentityPage() {
  const { agents, setAgentStatus, pushToast } = useApp();
  const [selectedAgent, setSelectedAgent] = useState<AgentIdentity | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    action: 'pause' | 'resume' | 'revoke';
    agent: AgentIdentity;
  } | null>(null);

  const handleActionConfirm = () => {
    if (!confirmAction) return;
    const { action, agent } = confirmAction;

    if (action === 'pause') {
      setAgentStatus(agent.id, 'paused');
      pushToast({
        type: 'warning',
        title: `${agent.name} Paused`,
        message: 'The agent has been temporarily restricted from making transaction requests.',
      });
    } else if (action === 'resume') {
      setAgentStatus(agent.id, 'active');
      pushToast({
        type: 'success',
        title: `${agent.name} Resumed`,
        message: 'The agent has regained its previous permissions and can resume interactions.',
      });
    } else if (action === 'revoke') {
      setAgentStatus(agent.id, 'revoked');
      pushToast({
        type: 'error',
        title: `${agent.name} Revoked`,
        message: 'All transaction permissions and OpenTab access have been permanently revoked.',
      });
    }

    // Refresh selectedAgent in drawer if active
    if (selectedAgent && selectedAgent.id === agent.id) {
      setSelectedAgent((prev) =>
        prev
          ? {
              ...prev,
              status: action === 'pause' ? 'paused' : action === 'resume' ? 'active' : 'revoked',
            }
          : null
      );
    }
    setConfirmAction(null);
  };

  const verifiedCount = agents.filter((a) => a.trustLevel === 'verified').length;
  const knownCount = agents.filter((a) => a.trustLevel === 'known').length;
  const unknownCount = agents.filter((a) => a.trustLevel === 'unknown').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Agent Identity & Access Control"
        subtitle="Know who is acting on behalf of buyers. Manage AI agent credentials, trust tiers, and authorization states."
      />

      {/* Trust Level Explanation Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {(['verified', 'known', 'unknown'] as TrustLevel[]).map((level) => {
          const cfg = trustConfig[level];
          return (
            <Card key={level} className={`p-4 border ${cfg.border}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2.5 h-2.5 rounded-full ${cfg.bg} border ${cfg.border} ring-2 ring-current ${cfg.color}`} />
                <span className={`text-xs font-semibold ${cfg.color} capitalize`}>
                  {cfg.label}
                </span>
              </div>
              <p className="text-2xs text-ink-300 leading-relaxed">{cfg.desc}</p>
            </Card>
          );
        })}
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Reveal delay={0.02}>
          <Card className="p-4">
            <div className="text-2xs font-semibold text-ink-400 uppercase tracking-wider">
              Total Agents
            </div>
            <div className="text-2xl font-bold text-white mt-1.5">{agents.length}</div>
            <div className="text-2xs text-ink-500 mt-1">Connecting to catalog</div>
          </Card>
        </Reveal>

        <Reveal delay={0.04}>
          <Card className="p-4">
            <div className="text-2xs font-semibold text-ink-400 uppercase tracking-wider">
              Verified Tier
            </div>
            <div className="text-2xl font-bold text-success-300 mt-1.5">{verifiedCount}</div>
            <div className="text-2xs text-ink-500 mt-1">Full transaction access</div>
          </Card>
        </Reveal>

        <Reveal delay={0.06}>
          <Card className="p-4">
            <div className="text-2xs font-semibold text-ink-400 uppercase tracking-wider">
              Known Tier
            </div>
            <div className="text-2xl font-bold text-warning-300 mt-1.5">{knownCount}</div>
            <div className="text-2xs text-ink-500 mt-1">Catalog discovery only</div>
          </Card>
        </Reveal>

        <Reveal delay={0.08}>
          <Card className="p-4">
            <div className="text-2xs font-semibold text-ink-400 uppercase tracking-wider">
              Unknown / Restricted
            </div>
            <div className="text-2xl font-bold text-danger-300 mt-1.5">{unknownCount}</div>
            <div className="text-2xs text-ink-500 mt-1">Public info only</div>
          </Card>
        </Reveal>
      </div>

      {/* Agents Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent, idx) => {
          const isPaused = agent.status === 'paused';
          const isRevoked = agent.status === 'revoked';

          return (
            <Reveal key={agent.id} delay={idx * 0.05}>
              <Card
                hover
                className={`p-5 transition-all flex flex-col justify-between ${
                  isPaused || isRevoked ? 'opacity-80 border-ink-800' : ''
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl bg-gradient-to-br ${agent.avatarColor} flex items-center justify-center shrink-0 shadow-glow-sm`}
                      >
                        <Bot className="w-6 h-6 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-white truncate">{agent.name}</h3>
                        <p className="text-2xs text-ink-400 truncate">{agent.organization}</p>
                      </div>
                    </div>
                    <TrustBadge level={agent.trustLevel} />
                  </div>

                  {/* Interaction metrics */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="p-2.5 rounded-lg bg-ink-900/60 border border-ink-700/40">
                      <div className="text-2xs text-ink-400 uppercase tracking-wider">
                        Interactions
                      </div>
                      <div className="text-sm font-bold font-mono text-white mt-0.5">
                        {agent.interactions ?? 42}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-ink-900/60 border border-ink-700/40">
                      <div className="text-2xs text-ink-400 uppercase tracking-wider">
                        Conversion
                      </div>
                      <div className="text-sm font-bold font-mono text-success-300 mt-0.5">
                        {agent.conversionRate ?? (agent.trustLevel === 'verified' ? 31.5 : 0)}%
                      </div>
                    </div>
                  </div>

                  {/* Status and Last Activity */}
                  <div className="flex items-center justify-between text-2xs text-ink-400 mb-4 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-ink-500" />
                      <span>{agent.lastActivity}</span>
                    </div>

                    {isPaused ? (
                      <Badge tone="warning">
                        <Pause className="w-3 h-3 mr-1" /> Paused
                      </Badge>
                    ) : isRevoked ? (
                      <Badge tone="danger">
                        <Ban className="w-3 h-3 mr-1" /> Revoked
                      </Badge>
                    ) : (
                      <Badge tone="success">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-ink-800/80">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setSelectedAgent(agent)}
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" /> Details
                  </Button>

                  {agent.status === 'active' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmAction({ action: 'pause', agent })}
                      title="Pause agent"
                    >
                      <Pause className="w-3.5 h-3.5 text-warning-400" />
                    </Button>
                  )}

                  {agent.status === 'paused' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmAction({ action: 'resume', agent })}
                      title="Resume agent"
                    >
                      <Play className="w-3.5 h-3.5 text-success-400" />
                    </Button>
                  )}

                  {agent.status !== 'revoked' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger-400 hover:text-danger-300"
                      onClick={() => setConfirmAction({ action: 'revoke', agent })}
                      title="Revoke access"
                    >
                      <Ban className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </Card>
            </Reveal>
          );
        })}
      </div>

      {/* Agent Detail Drawer */}
      <Drawer
        open={!!selectedAgent}
        onClose={() => setSelectedAgent(null)}
        title="Agent Passport & Access"
        subtitle={selectedAgent?.name}
      >
        {selectedAgent && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${selectedAgent.avatarColor} flex items-center justify-center shrink-0 shadow-glow-sm`}
              >
                <Bot className="w-7 h-7 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white truncate">{selectedAgent.name}</h3>
                <p className="text-xs text-ink-400 truncate">{selectedAgent.organization}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <TrustBadge level={selectedAgent.trustLevel} />
                  {selectedAgent.status === 'active' && <Badge tone="success">Active</Badge>}
                  {selectedAgent.status === 'paused' && <Badge tone="warning">Paused</Badge>}
                  {selectedAgent.status === 'revoked' && <Badge tone="danger">Revoked</Badge>}
                </div>
              </div>
            </div>

            {/* Spec grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-ink-900/60 border border-ink-700/50">
                <p className="text-2xs text-ink-400 uppercase tracking-wider">Agent ID</p>
                <p className="text-xs font-mono font-semibold text-white mt-1">
                  {selectedAgent.id}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-ink-900/60 border border-ink-700/50">
                <p className="text-2xs text-ink-400 uppercase tracking-wider">Permission Scope</p>
                <p className="text-xs font-semibold text-white mt-1 capitalize">
                  {selectedAgent.permissionLevel}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-ink-900/60 border border-ink-700/50">
                <p className="text-2xs text-ink-400 uppercase tracking-wider">Auth Status</p>
                <p
                  className={`text-xs font-semibold mt-1 ${
                    selectedAgent.authStatus === 'authenticated'
                      ? 'text-success-400'
                      : 'text-danger-400'
                  }`}
                >
                  {selectedAgent.authStatus === 'authenticated' ? 'Authenticated' : 'Unverified'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-ink-900/60 border border-ink-700/50">
                <p className="text-2xs text-ink-400 uppercase tracking-wider">Platform Provider</p>
                <p className="text-xs font-mono text-ink-200 mt-1 truncate">
                  {selectedAgent.provider}
                </p>
              </div>
            </div>

            {/* Why this access level card */}
            <Card className="p-4">
              <p className="text-2xs font-semibold text-ink-400 uppercase tracking-wider mb-2">
                Why this access level?
              </p>
              <p className="text-xs text-ink-200 leading-relaxed">
                {trustConfig[selectedAgent.trustLevel].desc}
              </p>
            </Card>

            {/* Activity History Timeline */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-electric-400" />
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
                  Activity Timeline
                </h4>
              </div>

              <div className="space-y-2.5">
                {selectedAgent.activity.map((act, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-ink-900/60 border border-ink-800/80 flex items-start gap-3 relative"
                  >
                    <div className="w-2 h-2 rounded-full bg-electric-400 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-white truncate">{act.action}</p>
                        <span className="text-2xs text-ink-500 shrink-0 font-mono">{act.time}</span>
                      </div>
                      <p className="text-2xs text-ink-400 mt-0.5 leading-snug">{act.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Control buttons */}
            <div className="flex gap-2 pt-3 border-t border-ink-800">
              {selectedAgent.status === 'active' ? (
                <>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() =>
                      setConfirmAction({
                        action: 'pause',
                        agent: selectedAgent,
                      })
                    }
                  >
                    <Pause className="w-4 h-4 mr-1.5" /> Pause Agent
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    onClick={() =>
                      setConfirmAction({
                        action: 'revoke',
                        agent: selectedAgent,
                      })
                    }
                  >
                    <Ban className="w-4 h-4 mr-1.5" /> Revoke
                  </Button>
                </>
              ) : selectedAgent.status === 'paused' ? (
                <>
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={() =>
                      setConfirmAction({
                        action: 'resume',
                        agent: selectedAgent,
                      })
                    }
                  >
                    <Play className="w-4 h-4 mr-1.5" /> Resume Agent
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    onClick={() =>
                      setConfirmAction({
                        action: 'revoke',
                        agent: selectedAgent,
                      })
                    }
                  >
                    <Ban className="w-4 h-4 mr-1.5" /> Revoke
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() =>
                    setConfirmAction({
                      action: 'resume',
                      agent: selectedAgent,
                    })
                  }
                >
                  <ShieldCheck className="w-4 h-4 mr-1.5" /> Re-authorize Agent
                </Button>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Confirmation Modal */}
      <Modal
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title={
          confirmAction?.action === 'pause'
            ? 'Pause Agent Access?'
            : confirmAction?.action === 'resume'
              ? 'Resume Agent Access?'
              : 'Permanently Revoke Agent Permissions?'
        }
        size="sm"
      >
        {confirmAction && (
          <div className="p-5 space-y-4">
            <p className="text-sm text-ink-200">
              {confirmAction.action === 'pause' ? (
                <>
                  Are you sure you want to pause{' '}
                  <strong className="text-white">{confirmAction.agent.name}</strong>? The agent will be temporarily restricted from making purchases and requesting discounts.
                </>
              ) : confirmAction.action === 'resume' ? (
                <>
                  Resume access for <strong className="text-white">{confirmAction.agent.name}</strong>? The agent will regain its previous permissions and transaction authority.
                </>
              ) : (
                <>
                  Permanently revoke permissions for{' '}
                  <strong className="text-white">{confirmAction.agent.name}</strong>? All active OpenTabs and transaction capabilities for this agent will be terminated immediately.
                </>
              )}
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setConfirmAction(null)}>
                Cancel
              </Button>
              <Button
                variant={confirmAction.action === 'revoke' ? 'danger' : 'primary'}
                onClick={handleActionConfirm}
              >
                {confirmAction.action === 'pause'
                  ? 'Pause Agent'
                  : confirmAction.action === 'resume'
                    ? 'Resume Agent'
                    : 'Revoke Permissions'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
