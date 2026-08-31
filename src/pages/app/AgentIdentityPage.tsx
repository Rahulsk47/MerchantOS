import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Pause, RotateCcw, Eye, Bot, Clock, Activity, ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/app/AppLayout';
import { Card } from '@/components/ui/Card';
import { Badge, TrustBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { Reveal } from '@/components/ui/Reveal';
import { useApp } from '@/lib/store';
import type { AgentIdentity } from '@/lib/types';

export default function AgentIdentityPage() {
  const { agents, setAgentStatus, pushToast } = useApp();
  const [selected, setSelected] = useState<AgentIdentity | null>(null);

  const handlePause = (agent: AgentIdentity) => {
    setAgentStatus(agent.id, 'paused');
    pushToast({ type: 'warning', title: `${agent.name} paused`, message: 'The agent can no longer request transactions.' });
    setSelected(null);
  };

  const handleRevoke = (agent: AgentIdentity) => {
    setAgentStatus(agent.id, 'revoked');
    pushToast({ type: 'error', title: `${agent.name} revoked`, message: 'All permissions have been removed.' });
    setSelected(null);
  };

  const handleReactivate = (agent: AgentIdentity) => {
    setAgentStatus(agent.id, 'active');
    pushToast({ type: 'success', title: `${agent.name} reactivated`, message: 'The agent is now active.' });
    setSelected(null);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Agent Identity"
        subtitle="Manage AI agent access, trust levels, and permissions. Identity states are simulated for this prototype."
      />

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Verified Agents', count: agents.filter((a) => a.trustLevel === 'verified').length, tone: 'text-success-400', desc: 'Identity verified and authorized' },
          { label: 'Known Agents', count: agents.filter((a) => a.trustLevel === 'known').length, tone: 'text-warning-400', desc: 'Recognized but limited' },
          { label: 'Unknown Agents', count: agents.filter((a) => a.trustLevel === 'unknown').length, tone: 'text-danger-400', desc: 'Restricted to public info' },
        ].map((s, i) => (
          <Reveal key={s.label} delay={i * 0.05}>
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xs text-ink-500 uppercase tracking-wider">{s.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${s.tone}`}>{s.count}</p>
                  <p className="text-2xs text-ink-500 mt-1">{s.desc}</p>
                </div>
                <ShieldCheck className={`w-8 h-8 ${s.tone} opacity-30`} />
              </div>
            </Card>
          </Reveal>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {agents.map((agent, i) => (
          <Reveal key={agent.id} delay={i * 0.05}>
            <Card hover className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${agent.avatarColor} flex items-center justify-center shrink-0`}>
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{agent.name}</h3>
                    <p className="text-xs text-ink-400 mt-0.5">{agent.organization}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <TrustBadge level={agent.trustLevel} />
                      {agent.status === 'active' && <Badge tone="success">Active</Badge>}
                      {agent.status === 'paused' && <Badge tone="warning">Paused</Badge>}
                      {agent.status === 'revoked' && <Badge tone="danger">Revoked</Badge>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="surface-flat p-3">
                  <p className="text-2xs text-ink-500">Provider</p>
                  <p className="text-xs text-ink-200 mt-0.5 font-mono">{agent.provider}</p>
                </div>
                <div className="surface-flat p-3">
                  <p className="text-2xs text-ink-500">Permission Level</p>
                  <p className="text-xs text-ink-200 mt-0.5 capitalize">{agent.permissionLevel}</p>
                </div>
                <div className="surface-flat p-3">
                  <p className="text-2xs text-ink-500">Auth Status</p>
                  <p className={`text-xs mt-0.5 ${agent.authStatus === 'authenticated' ? 'text-success-400' : 'text-danger-400'}`}>{agent.authStatus}</p>
                </div>
                <div className="surface-flat p-3">
                  <p className="text-2xs text-ink-500">Last Activity</p>
                  <p className="text-xs text-ink-200 mt-0.5">{agent.lastActivity}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Button size="sm" variant="outline" onClick={() => setSelected(agent)}><Eye className="w-3.5 h-3.5" /> View Details</Button>
                {agent.status === 'active' && (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => handlePause(agent)}><Pause className="w-3.5 h-3.5" /> Pause</Button>
                    <Button size="sm" variant="ghost" className="text-danger-400 hover:text-danger-500" onClick={() => handleRevoke(agent)}><RotateCcw className="w-3.5 h-3.5" /> Revoke</Button>
                  </>
                )}
                {agent.status === 'paused' && (
                  <Button size="sm" onClick={() => handleReactivate(agent)}><ShieldCheck className="w-3.5 h-3.5" /> Reactivate</Button>
                )}
              </div>
            </Card>
          </Reveal>
        ))}
      </div>

      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.name} subtitle={selected?.organization}>
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${selected.avatarColor} flex items-center justify-center`}>
                <Bot className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <TrustBadge level={selected.trustLevel} />
                  {selected.status === 'active' && <Badge tone="success">Active</Badge>}
                  {selected.status === 'paused' && <Badge tone="warning">Paused</Badge>}
                </div>
                <p className="text-xs text-ink-400 mt-1.5 font-mono">{selected.id}</p>
              </div>
            </div>

            <div className="surface-flat p-4">
              <p className="text-xs font-semibold text-ink-300 mb-3 flex items-center gap-2"><ShieldAlert className="w-3.5 h-3.5" /> Why this access level?</p>
              <p className="text-xs text-ink-400 leading-relaxed">
                {selected.trustLevel === 'verified' && 'This agent has completed identity verification through its provider and is authorized for full transaction capabilities within merchant-defined policies.'}
                {selected.trustLevel === 'known' && 'This agent is recognized but has limited permissions. It can interact with the catalog but transactions require additional checks or human approval.'}
                {selected.trustLevel === 'unknown' && 'This agent has not completed identity verification. It is restricted to public catalog information only — no transaction authority is granted.'}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-ink-300 mb-3 flex items-center gap-2"><Activity className="w-3.5 h-3.5" /> Activity History</p>
              <div className="space-y-2.5">
                {selected.activity.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-ink-800/40 border border-ink-700/40">
                    <Clock className="w-3.5 h-3.5 text-ink-500 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-white">{a.action}</p>
                        <span className="text-2xs text-ink-500">{a.time}</span>
                      </div>
                      <p className="text-2xs text-ink-400 mt-0.5">{a.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {selected.status === 'active' ? (
                <>
                  <Button className="flex-1" variant="outline" onClick={() => handlePause(selected)}><Pause className="w-4 h-4" /> Pause Agent</Button>
                  <Button className="flex-1" variant="danger" onClick={() => handleRevoke(selected)}><RotateCcw className="w-4 h-4" /> Revoke</Button>
                </>
              ) : (
                <Button className="flex-1" onClick={() => handleReactivate(selected)}><ShieldCheck className="w-4 h-4" /> Reactivate</Button>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
