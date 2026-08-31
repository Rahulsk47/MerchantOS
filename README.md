# MERCHANTOS

### Commerce built for humans and AI.

MerchantOS is an **AI-native commerce operating system** that helps businesses prepare for a future where AI agents can discover products, understand merchants, recommend purchases, and safely transact on behalf of people.

> **AI proposes. Policy decides.**

MerchantOS gives merchants the intelligence, infrastructure, trust, and control to safely serve the next generation of customers—both humans and AI agents.

---

## ✨ The Problem

Commerce today is built primarily for humans browsing websites and completing checkouts.

But AI agents are increasingly capable of:

* Discovering products
* Comparing options
* Understanding merchant information
* Making recommendations
* Requesting purchases on behalf of users

This creates a fundamental challenge:

**How can merchants safely allow AI agents to participate in commerce without giving them unlimited access or control?**

MerchantOS is designed to solve this problem.

---

## 🚀 The Solution

MerchantOS acts as an **intelligence, trust, and authorization layer between AI agents and merchants**.

The platform is built around four connected pillars:

### 📈 GROW

Find revenue opportunities and improve commerce performance today.

### 🔍 DISCOVER

Make merchant products, policies, and business information understandable to AI systems.

### 💳 TRANSACT

Enable controlled AI commerce through **OpenTab**, a scoped and revocable authorization system.

### 🛡️ TRUST

Verify agents, enforce deterministic policies, protect commerce operations, and maintain a transparent audit trail.

---

## 🔄 How MerchantOS Works

```text
Human Customer
      ↓
Authorizes AI Assistant
      ↓
Verified AI Agent
      ↓
Discovers Merchant & Catalog
      ↓
MerchantOS
      ↓
Identity + Policy + OpenTab Validation
      ↓
Payment Provider
      ↓
Transaction Result
      ↓
Trust Ledger
```

MerchantOS does **not** replace banks or payment providers.

Instead, it provides the intelligence and authorization layer that determines whether an AI-initiated commerce action is allowed before payment is processed.

---

# 💳 OpenTab

## Trust isn't unlimited access.

**OpenTab** is the central authorization system within MerchantOS.

Instead of giving an AI agent unlimited authority, a merchant can create a scoped, capped, temporary, and revocable authorization.

An OpenTab can define:

* 💰 Authorization spending cap
* 🛍️ Allowed product categories
* ⚡ Auto-approval threshold
* ⏱️ Expiration time
* 🛡️ Additional merchant policies
* ⏸️ Pause and revoke controls

### Example

```text
Agent: AI Shopping Assistant
Identity: Verified

Authorization Cap: ₹15,000
Auto Approval: ₹5,000
Allowed Categories: Electronics & Accessories
Expires: Today, 6:00 PM
```

Every transaction is evaluated by the backend before a decision is made.

Possible outcomes:

* ✅ **APPROVED**
* ❌ **DECLINED**
* 🟡 **ESCALATED FOR HUMAN APPROVAL**

> **The frontend never makes the final transaction decision.**

---

# 🛡️ The Policy Engine

The core philosophy of MerchantOS is:

> **AI proposes. Policy decides.**

AI systems can recommend actions, but they cannot override merchant-defined rules.

The backend Policy Engine evaluates deterministic rules such as:

* Is the AI agent verified and authorized?
* Is the requested action within its allowed scope?
* Is the OpenTab active and not expired?
* Is the requested amount within the remaining authorization?
* Is inventory available?
* Does the transaction comply with merchant policies?
* Does the transaction require human approval?
* Is the request a duplicate?

This ensures that **merchant control always comes before automation**.

---

# 📋 Trust Ledger

The **Trust Ledger** provides a transparent, human-readable record of important events and decisions.

Every event answers:

* **What happened?**
* **Why did it happen?**
* **Who initiated it?**
* **When did it happen?**
* **Which policy was applied?**

Example:

```text
10:02 AM  — Verified AI agent discovered catalog
10:03 AM  — Agent requested AeroBook Pro
10:03 AM  — OpenTab authority verified
10:03 AM  — Merchant policies evaluated
10:04 AM  — Transaction approved
10:05 AM  — Payment confirmed
```

For the current MVP, the Trust Ledger is implemented as an append-only application-level audit log.

---

# ✨ Features

## 🌐 Public Experience

* Cinematic, immersive landing page
* Interactive AI commerce flow
* Scroll-based storytelling
* Premium motion and transitions
* Responsive design

## 📊 Merchant Operating System

* Commerce overview dashboard
* Growth Intelligence
* Catalog management
* AI Commerce Readiness
* AI Agent Traffic analytics
* Agent Identity management
* OpenTab authorization management
* Transaction monitoring
* Trust Ledger
* Policy Center

## 🤖 AI Commerce

* AI agent discovery
* Simulated agent identity and trust levels
* Structured merchant and catalog information
* AI Commerce Passport
* AI-powered growth insights
* Safe AI transaction requests

## 🛡️ Security & Control

* Server-side policy evaluation
* Scoped transaction authorization
* OpenTab spending limits
* Agent permissions
* Pause and revoke controls
* Idempotency protection
* Human approval workflows
* Organization-level data isolation

---

# 🏗️ Technology Stack

## Frontend

| Technology    | Purpose                       |
| ------------- | ----------------------------- |
| React         | User interface                |
| TypeScript    | Type safety                   |
| Vite          | Development and build tooling |
| Tailwind CSS  | Styling and design system     |
| Framer Motion | Animations and transitions    |
| React Router  | Application routing           |
| Lucide React  | Icons                         |
| Recharts      | Data visualization            |

## Backend

MerchantOS is designed to use **Supabase** as its backend platform.

| Technology         | Purpose                      |
| ------------------ | ---------------------------- |
| Supabase Auth      | Authentication               |
| PostgreSQL         | Primary database             |
| Row Level Security | Multi-tenant data protection |
| Edge Functions     | Secure server-side logic     |
| Realtime           | Live transaction updates     |
| Storage            | Catalog and file uploads     |

---

# 🔐 Architecture

```text
┌──────────────────────────────────┐
│         MERCHANTOS FRONTEND      │
│      React + TypeScript + Vite   │
└───────────────┬──────────────────┘
                │
                ▼
┌──────────────────────────────────┐
│         SUPABASE BACKEND         │
│                                  │
│  Authentication                  │
│  PostgreSQL Database             │
│  Row Level Security              │
│  Edge Functions                  │
│  Realtime                        │
└───────────────┬──────────────────┘
                │
                ▼
┌──────────────────────────────────┐
│       MERCHANTOS POLICY ENGINE   │
│                                  │
│  Agent Identity                  │
│  OpenTab Authorization           │
│  Merchant Policies               │
│  Transaction Evaluation          │
└───────────────┬──────────────────┘
                │
                ▼
┌──────────────────────────────────┐
│       FUTURE INTEGRATIONS        │
│                                  │
│  AI Providers                    │
│  Payment Providers               │
│  E-commerce Platforms            │
└──────────────────────────────────┘
```

---

# 🔄 Transaction Flow

All important transaction decisions happen on the server.

```text
AI Agent Requests Purchase
          ↓
Verify Agent Identity
          ↓
Validate OpenTab
          ↓
Check Catalog & Inventory
          ↓
Evaluate Merchant Policies
          ↓
Check Authorization Limits
          ↓
┌─────────┬──────────┬────────────┐
│ APPROVE │ DECLINE  │ ESCALATE   │
└─────────┴──────────┴────────────┘
          ↓
Record Trust Ledger Event
```

This architecture ensures:

> **Server-side authorization > client-side logic**

---

# 🎮 Demo Mode

MerchantOS includes a realistic demo experience that demonstrates the complete AI commerce lifecycle.

### Scenario 1 — Successful Purchase

A verified AI agent makes a purchase within its OpenTab authorization and merchant policies.

**Result:** ✅ Approved → Payment simulated → Confirmed

### Scenario 2 — Authorization Cap Exceeded

An AI agent requests a purchase that exceeds its remaining authorization.

**Result:** ❌ Declined with a clear explanation and next steps.

### Scenario 3 — Human Approval Required

A transaction is valid but exceeds the automatic approval threshold.

**Result:** 🟡 Escalated → Merchant reviews → Approved or Declined.

---

# 🛠️ Getting Started

## Prerequisites

Make sure you have installed:

* Node.js 18 or later
* npm
* A Supabase account (required when backend integration is enabled)

## Installation

Clone the repository:

```bash
git clone <your-repository-url>
cd MerchantOS
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL shown in your terminal, typically:

```text
http://localhost:5173
```

---

# 🔑 Environment Variables

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> ⚠️ Never commit secret keys or service-role keys to GitHub.

For server-side integrations, store sensitive credentials securely in Supabase Edge Function secrets.

---

# 📁 Suggested Project Structure

```text
src/
├── components/        # Reusable UI components
├── pages/             # Application pages
├── layouts/           # Application layouts
├── hooks/             # Custom React hooks
├── lib/               # Supabase and utility clients
├── services/          # API and business service calls
├── types/             # TypeScript definitions
├── data/              # Demo and mock data
├── utils/             # Utility functions
└── App.tsx

supabase/
├── migrations/        # Database migrations
├── functions/         # Edge Functions
└── seed.sql           # Demo data
```

---

# 🚧 Development Roadmap

### Phase 1 — Product Experience

* [x] MerchantOS concept and product design
* [x] Cinematic public landing experience
* [x] Merchant operating system interface
* [x] Functional demo flows

### Phase 2 — Core Backend

* [ ] Supabase authentication
* [ ] Multi-tenant PostgreSQL database
* [ ] Row Level Security
* [ ] Catalog management

### Phase 3 — OpenTab & Trust

* [ ] OpenTab authorization engine
* [ ] Server-side Policy Engine
* [ ] Transaction lifecycle
* [ ] Human approval workflows
* [ ] Trust Ledger

### Phase 4 — Integrations

* [ ] AI-powered Growth Intelligence
* [ ] Payment provider integration
* [ ] E-commerce platform integrations
* [ ] Agent identity integrations

---

# ⚠️ Current Project Status

MerchantOS is currently being developed as a **functional prototype and MVP**.

Some features may use:

* Simulated AI agents
* Demo transaction data
* Simulated payments
* Mock identity verification

These simulations are clearly separated from future production integrations.

MerchantOS does not claim to provide banking services, hold customer funds, or provide security or compliance guarantees that are not implemented.

---

# 🎯 Vision

AI agents may become a major new interface for commerce.

MerchantOS is built around the belief that businesses should be able to embrace this shift **without sacrificing control, security, or trust**.

> **AI agents will become customers. MerchantOS gives businesses the intelligence, infrastructure, trust, and control to serve them safely.**

---

## Core Principles

**REALISM > unnecessary features**

**CLARITY > complexity**

**TRUST > AI autonomy**

**MERCHANT CONTROL > automation**

**DETERMINISTIC POLICIES > BLACK-BOX DECISIONS**

---

## 📄 License

This project is currently intended for educational, demonstration, and prototype purposes.

---

<div align="center">

### MERCHANTOS

**Commerce built for humans and AI.**

*AI proposes. Policy decides.*

</div>
