import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  AlertTriangle,
  Check,
  Wrench,
  Eye,
  Code2,
  Truck,
  RotateCcw,
  Tag,
  ShieldCheck,
  Laptop,
  Mouse,
  Headphones,
  Lightbulb,
  Usb,
  Shield,
  Layers,
} from 'lucide-react';
import { PageHeader } from '@/components/app/AppLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { Reveal } from '@/components/ui/Reveal';
import { useApp } from '@/lib/store';
import { formatINR } from '@/lib/utils';
import type { Product } from '@/lib/types';

const productIcons: Record<string, typeof Package> = {
  laptop: Laptop,
  mouse: Mouse,
  sleeve: Shield,
  lamp: Lightbulb,
  headphones: Headphones,
  hub: Usb,
  keyboard: Layers,
};

export default function CatalogPage() {
  const { products, fixProductIssues, pushToast, merchant } = useApp();
  const [view, setView] = useState<'products' | 'agent'>('products');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [fixingId, setFixingId] = useState<string | null>(null);

  // Custom shipping/returns fix fields in drawer
  const [customShipping, setCustomShipping] = useState('');
  const [customReturns, setCustomReturns] = useState('');

  const avgReadiness = Math.round(
    products.reduce((s, p) => s + p.aiReadiness, 0) / (products.length || 1)
  );
  const readyProducts = products.filter((p) => p.readinessIssues.length === 0);
  const attentionProducts = products.filter((p) => p.readinessIssues.length > 0);

  const handleFix = (product: Product) => {
    setFixingId(product.id);
    setTimeout(() => {
      fixProductIssues(product.id, {
        shipping: customShipping || undefined,
        returns: customReturns || undefined,
      });
      setFixingId(null);
      pushToast({
        type: 'success',
        title: 'AI Readiness Fixed',
        message: `Schema and metadata updated for "${product.name}". AI agents can now fully understand this item.`,
      });
      // update selected product in drawer if still open
      setSelectedProduct((prev) =>
        prev && prev.id === product.id
          ? {
              ...prev,
              readinessIssues: [],
              aiReadiness: Math.max(95, prev.aiReadiness + 20),
              shipping: customShipping || prev.shipping,
              returns: customReturns || prev.returns,
            }
          : prev
      );
      setCustomShipping('');
      setCustomReturns('');
    }, 900);
  };

  const agentViewData = {
    merchant: {
      name: merchant.businessName || 'Northwind Commerce',
      industry: merchant.industry || 'Electronics & Accessories',
      storeUrl: merchant.storeUrl || 'northwind.example.com',
      capabilities: [
        'catalog_discovery',
        'realtime_inventory_check',
        'agent_transactions',
        'opentab_authorizations',
        'automated_invoice_settlement',
      ],
    },
    policies: {
      auto_approve_under: merchant.boundaries.autoApproveThreshold,
      human_approval_above: merchant.boundaries.maxTxnAmount,
      max_discount: `${merchant.boundaries.maxDiscount}%`,
      min_margin: `${merchant.boundaries.minMargin}%`,
      allowed_categories: ['Electronics', 'Accessories'],
    },
    products: products.map((p) => ({
      sku: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      currency: 'INR',
      availability: p.inventory > 0 ? 'in_stock' : 'out_of_stock',
      inventory_count: p.inventory,
      shipping_estimate: p.shipping,
      return_policy: p.returns,
      ai_readiness_score: p.aiReadiness,
    })),
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Catalog & AI Commerce Passport"
        subtitle="Manage your products and inspect how AI systems, buyer agents, and shopping assistants understand your store."
        action={
          <div className="flex rounded-xl border border-ink-700/50 p-1 bg-ink-900/60">
            <button
              onClick={() => setView('products')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                view === 'products'
                  ? 'bg-electric-500/20 text-electric-300 shadow-glow-sm'
                  : 'text-ink-400 hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5 inline mr-1.5" /> Products ({products.length})
            </button>
            <button
              onClick={() => setView('agent')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                view === 'agent'
                  ? 'bg-electric-500/20 text-electric-300 shadow-glow-sm'
                  : 'text-ink-400 hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 inline mr-1.5" /> Agent Passport View
            </button>
          </div>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Reveal delay={0.02}>
          <Card className="p-4">
            <div className="text-2xs font-semibold text-ink-400 uppercase tracking-wider">
              Total Products
            </div>
            <div className="text-2xl font-bold text-white mt-1.5">{products.length}</div>
            <div className="text-2xs text-ink-500 mt-1">Across 2 catalog categories</div>
          </Card>
        </Reveal>

        <Reveal delay={0.04}>
          <Card className="p-4">
            <div className="text-2xs font-semibold text-ink-400 uppercase tracking-wider">
              AI Ready
            </div>
            <div className="text-2xl font-bold text-success-300 mt-1.5">
              {readyProducts.length}
            </div>
            <div className="text-2xs text-ink-500 mt-1">100% metadata complete</div>
          </Card>
        </Reveal>

        <Reveal delay={0.06}>
          <Card className="p-4">
            <div className="text-2xs font-semibold text-ink-400 uppercase tracking-wider">
              Needs Attention
            </div>
            <div className="text-2xl font-bold text-warning-300 mt-1.5">
              {attentionProducts.length}
            </div>
            <div className="text-2xs text-ink-500 mt-1">Missing shipping or policy</div>
          </Card>
        </Reveal>

        <Reveal delay={0.08}>
          <Card className="p-4">
            <div className="text-2xs font-semibold text-ink-400 uppercase tracking-wider">
              Avg AI Readiness
            </div>
            <div className="text-2xl font-bold text-electric-300 mt-1.5">
              {avgReadiness}
              <span className="text-xs text-ink-400 font-normal"> /100</span>
            </div>
            <div className="text-2xs text-ink-500 mt-1">Storewide semantic index</div>
          </Card>
        </Reveal>
      </div>

      <AnimatePresence mode="wait">
        {view === 'products' ? (
          <motion.div
            key="products"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <Card className="overflow-hidden">
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-ink-700/50 bg-ink-900/40">
                      <th className="text-2xs font-semibold uppercase tracking-wider text-ink-400 px-5 py-3.5">
                        Product
                      </th>
                      <th className="text-2xs font-semibold uppercase tracking-wider text-ink-400 px-5 py-3.5 hidden sm:table-cell">
                        Category
                      </th>
                      <th className="text-2xs font-semibold uppercase tracking-wider text-ink-400 px-5 py-3.5 text-right">
                        Price
                      </th>
                      <th className="text-2xs font-semibold uppercase tracking-wider text-ink-400 px-5 py-3.5 text-right hidden md:table-cell">
                        Inventory
                      </th>
                      <th className="text-2xs font-semibold uppercase tracking-wider text-ink-400 px-5 py-3.5 text-center">
                        AI Readiness
                      </th>
                      <th className="text-2xs font-semibold uppercase tracking-wider text-ink-400 px-5 py-3.5 text-right">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-800/60">
                    {products.map((p) => {
                      const Icon = productIcons[p.image] || Package;
                      const hasIssues = p.readinessIssues.length > 0;
                      return (
                        <tr
                          key={p.id}
                          onClick={() => setSelectedProduct(p)}
                          className="hover:bg-ink-800/40 cursor-pointer transition-colors"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-ink-800/80 border border-ink-700/60 flex items-center justify-center shrink-0">
                                <Icon className="w-5 h-5 text-ink-300" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                                <p className="text-2xs text-ink-400 truncate max-w-xs sm:hidden">
                                  {p.category} · {formatINR(p.price)}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 hidden sm:table-cell">
                            <Badge tone="muted">{p.category}</Badge>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <span className="text-sm font-mono font-medium text-white">
                              {formatINR(p.price)}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right hidden md:table-cell">
                            <span
                              className={`text-xs font-medium ${
                                p.inventory === 0
                                  ? 'text-danger-400'
                                  : p.inventory < 20
                                    ? 'text-warning-300'
                                    : 'text-ink-200'
                              }`}
                            >
                              {p.inventory === 0 ? 'Out of stock' : `${p.inventory} in stock`}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-center">
                            <div className="inline-flex items-center gap-2.5">
                              <div className="w-16 h-2 rounded-full bg-ink-800 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    p.aiReadiness >= 85
                                      ? 'bg-success-400'
                                      : p.aiReadiness >= 70
                                        ? 'bg-warning-400'
                                        : 'bg-danger-400'
                                  }`}
                                  style={{ width: `${p.aiReadiness}%` }}
                                />
                              </div>
                              <span
                                className={`text-xs font-mono font-semibold ${
                                  p.aiReadiness >= 85
                                    ? 'text-success-300'
                                    : p.aiReadiness >= 70
                                      ? 'text-warning-300'
                                      : 'text-danger-300'
                                }`}
                              >
                                {p.aiReadiness}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-right">
                            {hasIssues ? (
                              <Badge tone="warning">
                                <AlertTriangle className="w-3 h-3 mr-1" /> {p.readinessIssues.length} issue{p.readinessIssues.length > 1 ? 's' : ''}
                              </Badge>
                            ) : (
                              <Badge tone="success">
                                <Check className="w-3 h-3 mr-1" /> Ready
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="agent"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            <Card className="p-4 border-electric-500/30 bg-electric-500/5">
              <div className="flex items-start gap-3">
                <Eye className="w-5 h-5 text-electric-300 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-white">How AI agents see your business</h3>
                  <p className="text-xs text-ink-300 mt-1 leading-relaxed">
                    This structured passport format enables search agents, personal buyers, and procurement bots to query your live prices, evaluate shipping timeframes, verify return policies, and request transaction authorizations within your specified boundaries.
                  </p>
                </div>
              </div>
            </Card>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Structured JSON view */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-white flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-electric-400" />
                    AI Commerce Passport (JSON Schema)
                  </span>
                  <Badge tone="electric">Live Synchronized</Badge>
                </div>
                <div className="rounded-2xl bg-ink-950/80 border border-ink-800 p-4 font-mono text-xs leading-relaxed overflow-x-auto max-h-[560px] scrollbar-thin">
                  <JsonViewer data={agentViewData} />
                </div>
              </div>

              {/* Explanatory blocks */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-white mb-2">Passport Semantic Mappings</h3>
                <PassportInfoCard
                  icon={Package}
                  title="Catalog & SKUs"
                  desc={`${products.length} active products mapped to structured schemas with real-time stock counters and price guarantees.`}
                />
                <PassportInfoCard
                  icon={Tag}
                  title="Prices & Currencies"
                  desc="Prices are exposed in INR with deterministic decimal precision. Discounts require OpenTab scope authorization."
                />
                <PassportInfoCard
                  icon={Truck}
                  title="Shipping & Dispatch Estimates"
                  desc="Accurate dispatch SLAs are indexed per item, enabling shopping bots to provide definitive delivery guarantees."
                />
                <PassportInfoCard
                  icon={RotateCcw}
                  title="Return Policy Guarantees"
                  desc="15-day return window published on catalog items to eliminate buyer agent hesitation during checkout."
                />
                <PassportInfoCard
                  icon={ShieldCheck}
                  title="Merchant Guardrails & Boundaries"
                  desc={`Max ${merchant.boundaries.maxDiscount}% discount, min ${merchant.boundaries.minMargin}% margin, auto-approve ceiling ${formatINR(merchant.boundaries.autoApproveThreshold)}.`}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Detail Drawer */}
      <Drawer
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title="Product Passport Details"
        subtitle={selectedProduct?.name}
      >
        {selectedProduct && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-ink-800 border border-ink-700/60 flex items-center justify-center shrink-0">
                {(() => {
                  const Icon = productIcons[selectedProduct.image] || Package;
                  return <Icon className="w-7 h-7 text-electric-400" />;
                })()}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{selectedProduct.name}</h3>
                <Badge tone="muted" className="mt-1">
                  {selectedProduct.category}
                </Badge>
              </div>
            </div>

            {/* Spec grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-ink-900/60 border border-ink-700/50">
                <p className="text-2xs text-ink-400 uppercase tracking-wider">Unit Price</p>
                <p className="text-base font-mono font-bold text-white mt-1">
                  {formatINR(selectedProduct.price)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-ink-900/60 border border-ink-700/50">
                <p className="text-2xs text-ink-400 uppercase tracking-wider">Inventory Stock</p>
                <p
                  className={`text-base font-bold mt-1 ${
                    selectedProduct.inventory === 0 ? 'text-danger-400' : 'text-success-400'
                  }`}
                >
                  {selectedProduct.inventory === 0
                    ? 'Out of stock'
                    : `${selectedProduct.inventory} units`}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-ink-900/60 border border-ink-700/50">
                <p className="text-2xs text-ink-400 uppercase tracking-wider">Shipping Estimate</p>
                <p className="text-xs text-ink-100 mt-1 font-medium leading-snug">
                  {selectedProduct.shipping}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-ink-900/60 border border-ink-700/50">
                <p className="text-2xs text-ink-400 uppercase tracking-wider">Returns Policy</p>
                <p className="text-xs text-ink-100 mt-1 font-medium leading-snug">
                  {selectedProduct.returns}
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-2xs text-ink-400 uppercase tracking-wider mb-1.5">Description</p>
              <p className="text-xs text-ink-300 leading-relaxed">{selectedProduct.description}</p>
            </div>

            {/* AI Readiness Section */}
            <div className="p-4 rounded-xl bg-ink-800/40 border border-ink-700/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">AI Readiness Score</span>
                <span
                  className={`text-sm font-mono font-bold ${
                    selectedProduct.aiReadiness >= 85
                      ? 'text-success-300'
                      : selectedProduct.aiReadiness >= 70
                        ? 'text-warning-300'
                        : 'text-danger-300'
                  }`}
                >
                  {selectedProduct.aiReadiness} / 100
                </span>
              </div>

              <div className="h-2 rounded-full bg-ink-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    selectedProduct.aiReadiness >= 85
                      ? 'bg-success-400'
                      : selectedProduct.aiReadiness >= 70
                        ? 'bg-warning-400'
                        : 'bg-danger-400'
                  }`}
                  style={{ width: `${selectedProduct.aiReadiness}%` }}
                />
              </div>

              {selectedProduct.readinessIssues.length > 0 ? (
                <div className="space-y-3 pt-2">
                  <p className="text-2xs text-warning-400 font-semibold uppercase tracking-wider">
                    Detected Metadata Gaps:
                  </p>
                  {selectedProduct.readinessIssues.map((issue, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-warning-500/10 border border-warning-500/20 flex items-start gap-2"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-warning-400 shrink-0 mt-0.5" />
                      <span className="text-xs text-ink-200">{issue}</span>
                    </div>
                  ))}

                  <div className="space-y-2 pt-2 border-t border-ink-700/50">
                    <label className="block text-2xs text-ink-400 uppercase tracking-wider">
                      Specify Shipping SLA (Optional Override)
                    </label>
                    <input
                      value={customShipping}
                      onChange={(e) => setCustomShipping(e.target.value)}
                      placeholder="e.g. Ships in 1–2 business days. Express dispatch."
                      className="w-full bg-ink-900/80 border border-ink-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-ink-600 focus:outline-none focus:border-electric-500"
                    />

                    <label className="block text-2xs text-ink-400 uppercase tracking-wider pt-1">
                      Specify Return Window (Optional Override)
                    </label>
                    <input
                      value={customReturns}
                      onChange={(e) => setCustomReturns(e.target.value)}
                      placeholder="e.g. 15-day return window. No questions asked."
                      className="w-full bg-ink-900/80 border border-ink-700 rounded-lg px-3 py-2 text-xs text-white placeholder:text-ink-600 focus:outline-none focus:border-electric-500"
                    />
                  </div>

                  <Button
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => handleFix(selectedProduct)}
                    disabled={fixingId === selectedProduct.id}
                  >
                    <Wrench className="w-3.5 h-3.5 mr-1.5" />
                    {fixingId === selectedProduct.id ? 'Applying AI Metadata Fix...' : 'Fix Issues & Boost Readiness'}
                  </Button>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-success-500/10 border border-success-500/20 flex items-center gap-2">
                  <Check className="w-4 h-4 text-success-400 shrink-0" />
                  <span className="text-xs text-success-200">
                    All clear — AI systems can fully query, compare, and transact this product.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

function PassportInfoCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof Package;
  title: string;
  desc: string;
}) {
  return (
    <Card className="p-3.5">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-ink-800 border border-ink-700/60 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-electric-400" />
        </div>
        <div>
          <p className="text-xs font-semibold text-white">{title}</p>
          <p className="text-2xs text-ink-400 mt-0.5 leading-relaxed">{desc}</p>
        </div>
      </div>
    </Card>
  );
}

function JsonViewer({ data }: { data: unknown }) {
  const jsonStr = JSON.stringify(data, null, 2);
  const lines = jsonStr.split('\n');

  return (
    <div className="text-ink-300">
      {lines.map((line, idx) => {
        let highlighted = <span className="text-ink-200">{line}</span>;
        if (line.includes('": "')) {
          const [key, ...rest] = line.split('": "');
          highlighted = (
            <span>
              <span className="text-electric-300">{key}"</span>:{' '}
              <span className="text-accent-300">"{rest.join('": "')}</span>
            </span>
          );
        } else if (line.includes('": ') && (line.includes('[') || line.includes('{'))) {
          const [key, ...rest] = line.split('": ');
          highlighted = (
            <span>
              <span className="text-electric-300">{key}"</span>: {rest.join('": ')}
            </span>
          );
        } else if (line.includes('": ')) {
          const [key, val] = line.split('": ');
          highlighted = (
            <span>
              <span className="text-electric-300">{key}"</span>:{' '}
              <span className="text-warning-300">{val}</span>
            </span>
          );
        }

        return (
          <div key={idx} className="flex">
            <span className="text-ink-600 select-none w-8 shrink-0 text-right pr-3 font-mono">
              {idx + 1}
            </span>
            <span className="flex-1 font-mono">{highlighted}</span>
          </div>
        );
      })}
    </div>
  );
}
