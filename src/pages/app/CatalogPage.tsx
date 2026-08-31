import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, AlertTriangle, CheckCircle2, Wrench, Eye, Code2, Truck, RotateCcw, Tag, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/app/AppLayout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Progress } from '@/components/ui/Progress';
import { Reveal } from '@/components/ui/Reveal';
import { useApp } from '@/lib/store';
import { formatINR } from '@/lib/utils';
import type { Product } from '@/lib/types';

export default function CatalogPage() {
  const { products } = useApp();
  const [view, setView] = useState<'catalog' | 'agent'>('catalog');
  const [fixProduct, setFixProduct] = useState<Product | null>(null);

  const avgReadiness = Math.round(products.reduce((s, p) => s + p.aiReadiness, 0) / products.length);
  const issues = products.filter((p) => p.readinessIssues.length > 0);

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Catalog & AI Commerce Passport"
        subtitle="Manage your products and see how AI systems understand your business."
        action={
          <div className="flex items-center gap-1 p-1 rounded-xl bg-ink-800/60 border border-ink-700/50">
            <button onClick={() => setView('catalog')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === 'catalog' ? 'bg-electric-500/20 text-electric-300' : 'text-ink-400 hover:text-white'}`}>
              <Package className="w-3.5 h-3.5 inline mr-1.5" /> Catalog
            </button>
            <button onClick={() => setView('agent')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === 'agent' ? 'bg-electric-500/20 text-electric-300' : 'text-ink-400 hover:text-white'}`}>
              <Eye className="w-3.5 h-3.5 inline mr-1.5" /> Agent View
            </button>
          </div>
        }
      />

      <AnimatePresence mode="wait">
        {view === 'catalog' ? (
          <motion.div key="catalog" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="p-4">
                <p className="text-2xs text-ink-500 uppercase tracking-wider">Products</p>
                <p className="text-2xl font-bold text-white mt-1">{products.length}</p>
              </Card>
              <Card className="p-4">
                <p className="text-2xs text-ink-500 uppercase tracking-wider">Avg AI Readiness</p>
                <p className="text-2xl font-bold text-electric-300 mt-1">{avgReadiness}<span className="text-sm text-ink-400">/100</span></p>
              </Card>
              <Card className="p-4">
                <p className="text-2xs text-ink-500 uppercase tracking-wider">Issues Found</p>
                <p className="text-2xl font-bold text-warning-400 mt-1">{issues.length}</p>
              </Card>
              <Card className="p-4">
                <p className="text-2xs text-ink-500 uppercase tracking-wider">Out of Stock</p>
                <p className="text-2xl font-bold text-danger-400 mt-1">{products.filter((p) => p.inventory <= 0).length}</p>
              </Card>
            </div>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-ink-700/40">
                      <th className="text-left text-2xs font-semibold text-ink-400 uppercase tracking-wider px-5 py-3">Product</th>
                      <th className="text-left text-2xs font-semibold text-ink-400 uppercase tracking-wider px-5 py-3">Category</th>
                      <th className="text-right text-2xs font-semibold text-ink-400 uppercase tracking-wider px-5 py-3">Price</th>
                      <th className="text-right text-2xs font-semibold text-ink-400 uppercase tracking-wider px-5 py-3">Inventory</th>
                      <th className="text-left text-2xs font-semibold text-ink-400 uppercase tracking-wider px-5 py-3">AI Readiness</th>
                      <th className="text-right text-2xs font-semibold text-ink-400 uppercase tracking-wider px-5 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p, i) => (
                      <Reveal key={p.id} delay={i * 0.03}>
                        <tr className="border-b border-ink-700/30 hover:bg-ink-800/30 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-ink-800 border border-ink-700/50 flex items-center justify-center shrink-0">
                                <Package className="w-4.5 h-4.5 text-ink-400" style={{ width: 18, height: 18 }} />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{p.name}</p>
                                <p className="text-2xs text-ink-500">{p.description.slice(0, 40)}...</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5"><Badge tone="muted">{p.category}</Badge></td>
                          <td className="px-5 py-3.5 text-right text-sm font-medium text-white">{formatINR(p.price)}</td>
                          <td className="px-5 py-3.5 text-right">
                            {p.inventory > 0 ? <span className="text-sm text-ink-200">{p.inventory}</span> : <Badge tone="danger">Out of stock</Badge>}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <Progress value={p.aiReadiness} tone={p.aiReadiness >= 85 ? 'success' : p.aiReadiness >= 70 ? 'warning' : 'danger'} className="w-16" />
                              <span className={`text-xs font-medium ${p.aiReadiness >= 85 ? 'text-success-400' : p.aiReadiness >= 70 ? 'text-warning-400' : 'text-danger-400'}`}>{p.aiReadiness}</span>
                              {p.readinessIssues.length > 0 && <AlertTriangle className="w-3.5 h-3.5 text-warning-400" />}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            {p.readinessIssues.length > 0 ? (
                              <Button size="sm" variant="outline" onClick={() => setFixProduct(p)}><Wrench className="w-3 h-3" /> Fix</Button>
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-success-400 ml-auto" />
                            )}
                          </td>
                        </tr>
                      </Reveal>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="agent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card className="p-6">
              <div className="flex items-start gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-accent-500/10 border border-accent-500/30 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-accent-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Agent View — AI Commerce Passport</h3>
                  <p className="text-xs text-ink-400 mt-0.5">This is how AI agents see and understand your business. This is an adaptable commerce information layer — not a proprietary standard everyone must adopt.</p>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-ink-300 mb-3 flex items-center gap-2"><Code2 className="w-3.5 h-3.5" /> Structured Data (JSON)</p>
                  <div className="surface-flat p-4 font-mono text-xs leading-relaxed overflow-x-auto scrollbar-thin bg-ink-900/80">
                    <div className="text-ink-500">{"// AI Commerce Passport"}</div>
                    <div>{'{'}</div>
                    <div className="pl-3"><span className="text-electric-300">"merchant"</span>: <span className="text-accent-400">"Northwind Commerce"</span>,</div>
                    <div className="pl-3"><span className="text-electric-300">"industry"</span>: <span className="text-accent-400">"Electronics & Accessories"</span>,</div>
                    <div className="pl-3"><span className="text-electric-300">"capabilities"</span>: [<span className="text-accent-400">"agent_transactions"</span>, <span className="text-accent-400">"opentab"</span>],</div>
                    <div className="pl-3"><span className="text-electric-300">"products"</span>: [</div>
                    {products.slice(0, 3).map((p) => (
                      <div key={p.id} className="pl-6">
                        <div>{'{'}</div>
                        <div className="pl-3"><span className="text-electric-300">"name"</span>: <span className="text-accent-400">"{p.name}"</span>,</div>
                        <div className="pl-3"><span className="text-electric-300">"price"</span>: <span className="text-warning-400">{p.price}</span>,</div>
                        <div className="pl-3"><span className="text-electric-300">"availability"</span>: <span className="text-success-400">"{p.inventory > 0 ? 'in_stock' : 'out_of_stock'}"</span>,</div>
                        <div className="pl-3"><span className="text-electric-300">"shipping"</span>: <span className="text-accent-400">"{p.shipping}"</span>,</div>
                        <div className="pl-3"><span className="text-electric-300">"returns"</span>: <span className="text-accent-400">"{p.returns}"</span></div>
                        <div>{'},'}</div>
                      </div>
                    ))}
                    <div className="pl-3">{']'}</div>
                    <div>{'}'}</div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-ink-300 mb-3">Plain-Language Explanation</p>
                  <div className="space-y-3">
                    <InfoBlock icon={Package} title="Products" desc={`${products.length} products across Electronics and Accessories categories. AI agents can search, compare, and request purchases.`} />
                    <InfoBlock icon={Tag} title="Prices" desc="All prices in INR. AI agents can understand pricing and compare across products." />
                    <InfoBlock icon={Truck} title="Shipping" desc="Shipping estimates provided per product. Same-day dispatch available for orders before 2 PM." />
                    <InfoBlock icon={RotateCcw} title="Returns" desc="15-day return window on most products. Some products have unspecified return policies." />
                    <InfoBlock icon={ShieldCheck} title="Policies" desc="Merchant-defined boundaries: max 15% discount, min 12% margin, auto-approve under ₹5,000." />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal open={!!fixProduct} onClose={() => setFixProduct(null)} title="Fix AI Readiness Issue" subtitle={fixProduct?.name} size="md">
        {fixProduct && (
          <div className="p-5">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-warning-400" />
                <span className="text-sm font-medium text-white">Issues Found</span>
              </div>
              {fixProduct.readinessIssues.map((issue, i) => (
                <div key={i} className="p-3 rounded-xl bg-warning-500/5 border border-warning-500/20 mb-2">
                  <p className="text-sm text-ink-200">{issue}</p>
                </div>
              ))}
            </div>
            <div className="space-y-3 mb-4">
              <label className="block text-xs font-medium text-ink-200">Add shipping estimate</label>
              <input className="w-full bg-ink-800/60 border border-ink-700/60 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-ink-500 focus:outline-none focus:border-electric-500/50" placeholder="e.g. Ships in 3-5 business days" />
              <label className="block text-xs font-medium text-ink-200">Add return policy</label>
              <input className="w-full bg-ink-800/60 border border-ink-700/60 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-ink-500 focus:outline-none focus:border-electric-500/50" placeholder="e.g. 15-day return window" />
            </div>
            <Button className="w-full" onClick={() => setFixProduct(null)}><CheckCircle2 className="w-4 h-4" /> Apply Fixes</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function InfoBlock({ icon: Icon, title, desc }: { icon: typeof Package; title: string; desc: string }) {
  return (
    <div className="surface-flat p-3.5">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-ink-800 border border-ink-700/50 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-ink-300" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{title}</p>
          <p className="text-xs text-ink-400 mt-0.5 leading-relaxed">{desc}</p>
        </div>
      </div>
    </div>
  );
}
