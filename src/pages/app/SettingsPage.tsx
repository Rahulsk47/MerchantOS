import { useState } from 'react';
import { Building2, Globe, Mail, ShieldCheck, Save, Sliders } from 'lucide-react';
import { PageHeader } from '@/components/app/AppLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Reveal } from '@/components/ui/Reveal';
import { useApp } from '@/lib/store';

export default function SettingsPage() {
  const { merchant, updateMerchant, pushToast } = useApp();
  const [form, setForm] = useState({
    businessName: merchant.businessName,
    industry: merchant.industry,
    storeUrl: merchant.storeUrl,
    contactEmail: merchant.contactEmail,
    maxDiscount: merchant.boundaries.maxDiscount,
    minMargin: merchant.boundaries.minMargin,
    autoApproveThreshold: merchant.boundaries.autoApproveThreshold,
    maxTxnAmount: merchant.boundaries.maxTxnAmount,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      updateMerchant({
        businessName: form.businessName,
        industry: form.industry,
        storeUrl: form.storeUrl,
        contactEmail: form.contactEmail,
        boundaries: {
          maxDiscount: form.maxDiscount,
          minMargin: form.minMargin,
          autoApproveThreshold: form.autoApproveThreshold,
          maxTxnAmount: form.maxTxnAmount,
        },
      });
      setSaving(false);
      pushToast({ type: 'success', title: 'Settings saved', message: 'Your business settings have been updated.' });
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="Settings" subtitle="Manage your business profile and commerce boundaries." />

      <div className="space-y-5">
        <Reveal>
          <Card className="p-5">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-electric-500/10 border border-electric-500/30 flex items-center justify-center">
                <Building2 className="w-4.5 h-4.5 text-electric-400" style={{ width: 18, height: 18 }} />
              </div>
              <h3 className="text-sm font-semibold text-white">Business Profile</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Business name" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
              <Select label="Industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })}>
                <option value="Electronics & Accessories">Electronics & Accessories</option>
                <option value="Fashion & Apparel">Fashion & Apparel</option>
                <option value="Home & Garden">Home & Garden</option>
                <option value="Food & Beverage">Food & Beverage</option>
              </Select>
              <Input label="Store URL" value={form.storeUrl} onChange={(e) => setForm({ ...form, storeUrl: e.target.value })} icon={<Globe className="w-4 h-4" />} />
              <Input label="Contact email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} icon={<Mail className="w-4 h-4" />} />
            </div>
          </Card>
        </Reveal>

        <Reveal delay={0.05}>
          <Card className="p-5">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-accent-500/10 border border-accent-500/30 flex items-center justify-center">
                <Sliders className="w-4.5 h-4.5 text-accent-400" style={{ width: 18, height: 18 }} />
              </div>
              <h3 className="text-sm font-semibold text-white">Business Boundaries</h3>
              <Badge tone="warning">Deterministic</Badge>
            </div>
            <p className="text-xs text-ink-400 mb-4">These policies are enforced deterministically. AI recommendations can never override them. We don't guess your margins — only values you provide are used.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <BoundarySlider label="Maximum discount" value={form.maxDiscount} suffix="%" min={0} max={50} onChange={(v) => setForm({ ...form, maxDiscount: v })} />
              <BoundarySlider label="Minimum margin" value={form.minMargin} suffix="%" min={0} max={50} onChange={(v) => setForm({ ...form, minMargin: v })} hint="Only applies if you provide cost data." />
              <BoundarySlider label="Auto-approval threshold" value={form.autoApproveThreshold} prefix="₹" min={0} max={25000} step={500} onChange={(v) => setForm({ ...form, autoApproveThreshold: v })} />
              <BoundarySlider label="Maximum transaction amount" value={form.maxTxnAmount} prefix="₹" min={5000} max={100000} step={1000} onChange={(v) => setForm({ ...form, maxTxnAmount: v })} />
            </div>
          </Card>
        </Reveal>

        <Reveal delay={0.1}>
          <Card className="p-5">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-success-500/10 border border-success-500/30 flex items-center justify-center">
                <ShieldCheck className="w-4.5 h-4.5 text-success-400" style={{ width: 18, height: 18 }} />
              </div>
              <h3 className="text-sm font-semibold text-white">AI Commerce Readiness</h3>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-electric-300">{merchant.aiReadiness}<span className="text-lg text-ink-400">/100</span></p>
                <p className="text-2xs text-ink-500 mt-1">Readiness Score</p>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div className="surface-flat p-3"><p className="text-2xs text-ink-500">Catalog</p><p className="text-sm font-semibold text-success-400 mt-0.5">Healthy</p></div>
                <div className="surface-flat p-3"><p className="text-2xs text-ink-500">Agent Discovery</p><p className="text-sm font-semibold text-electric-300 mt-0.5">Active</p></div>
                <div className="surface-flat p-3"><p className="text-2xs text-ink-500">Transactions</p><p className="text-sm font-semibold text-success-400 mt-0.5">Protected</p></div>
                <div className="surface-flat p-3"><p className="text-2xs text-ink-500">Policies</p><p className="text-sm font-semibold text-accent-400 mt-0.5">Enforced</p></div>
              </div>
            </div>
          </Card>
        </Reveal>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> Save Changes</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

function BoundarySlider({ label, value, prefix = '', suffix = '', min, max, step = 1, onChange, hint }: { label: string; value: number; prefix?: string; suffix?: string; min: number; max: number; step?: number; onChange: (v: number) => void; hint?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-ink-200">{label}</label>
        <span className="text-sm font-semibold text-electric-300 font-mono">{prefix}{value.toLocaleString('en-IN')}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-ink-800 rounded-full appearance-none cursor-pointer accent-electric-500" />
      {hint && <p className="text-2xs text-ink-500 mt-1.5">{hint}</p>}
    </div>
  );
}
