# CSSP — Customer Self-Service Portal for Data Center Colocation
## Initial Business Plan (v1)

## 1. Executive Summary

CSSP is a CRM-plus-ITSM platform purpose-built for data center colocation providers, giving their enterprise customers a single portal to manage the account relationship end to end: contracts and billing, incident and maintenance visibility, service requests (cross-connects, remote hands, power changes), and SLA reporting. Today, most colocation providers stitch this experience together from email threads, spreadsheets, and a generic ticketing tool, or they buy an enterprise DCIM suite that is built for the provider's internal operations team, not for the customer relationship. Only the largest global operators (Equinix, Digital Realty) have built anything comparable in-house, and they built it for themselves at a cost no regional or mid-market provider could justify.

The opportunity sits in that gap: Southeast Asia's colocation market is growing roughly 15.5% a year, from an estimated USD 5.76 billion in 2025 to USD 13.69 billion by 2031, and Indonesia alone is expected to grow from USD 460 million to USD 1.15 billion by 2030 (16.5% CAGR), with 83 operating facilities today and 18 more in the pipeline across Jakarta, Batam, West Java, and Surabaya. Nearly all of that growth is landing at mid-market and regional providers who have neither the budget nor the internal engineering team to build an Equinix-grade portal, and who are the wrong customer size for the few specialist vendors already selling this (the closest is MCIM, a US-based colocation customer portal vendor whose customers include Applied Digital, Keppel, and NTT — enterprise accounts well above the segment this plan targets).

The plan below sequences from a narrow, defensible beachhead — mid-market colocation operators in Indonesia and adjacent Southeast Asian markets — toward a regional, then multi-region, SaaS platform, with the product build intentionally starting after this plan so that scope, pricing, and go-to-market are decided before a single feature is scoped.

## 2. The Problem

Enterprise colocation customers — the IT and infrastructure teams renting racks, cages, or suites — routinely lose visibility the moment the contract is signed. Getting a straight answer on an open incident, a scheduled maintenance window, a remote-hands ticket, or next month's invoice usually means emailing an account manager and waiting. On the provider side, that same work — chasing status updates, re-explaining SLAs, manually assembling uptime reports for audits — consumes a large share of a Customer Success or NOC team's time and scales linearly with headcount rather than with software. The pain is sharpest for providers between roughly 5 and 60 facilities: too large to run on spreadsheets and personal relationships alone, too small to be a build candidate for a bespoke internal platform.

## 3. Market Opportunity

Southeast Asia's colocation market is valued at roughly USD 5.76 billion in 2025 and is projected to reach USD 13.69 billion by 2031 (15.5% CAGR), driven by cloud migration, AI and high-density compute workloads, submarine cable and connectivity expansion, and data-residency regulation pushing workloads onshore. Indonesia is one of the region's fastest-growing markets within that: from USD 460 million in 2024 to a projected USD 1.15 billion by 2030 (16.5% CAGR), with Batam specifically called out as an emerging investment hotspot alongside Jakarta because of its power infrastructure and proximity to Singapore.

Every new facility that comes online in that pipeline is a new operator (or an existing one expanding) that needs a customer-facing operations layer, and very few of them have one worth the name today. That is the addressable wedge: not competing for the handful of hyperscale, global accounts that Equinix or Digital Realty already own outright with in-house platforms, but serving the much larger population of regional and mid-market operators who are currently underserved.

## 4. Target Customer & Beachhead

The initial customer profile is a colocation or data center operator running somewhere between roughly 5 and 60 facilities (or the equivalent in rack/MW capacity), serving enterprise and mid-market colocation customers, without an internal platform team dedicated to customer experience software. Indonesia and neighboring Southeast Asian markets (Malaysia, Philippines, Vietnam) are the initial geography, both because that is where the pipeline of new facilities is concentrated and because it is the market this plan's author already understands from day-to-day account management work.

One explicit constraint on customer selection needs to be stated up front rather than discovered later: because the author is currently employed as a Customer Success Manager at a data center operator in this exact market, the very first design partners and paying customers should deliberately exclude that employer and, ideally, its closest direct competitors, until an employment contract review (see Section 9) confirms what is and isn't permitted. This narrows the earliest pilot list but avoids a conflict that could otherwise put both the day job and the new venture at risk.

## 5. Product Concept (detail to follow in the product phase)

**Updated after the product phase (see `claude/prd-v2.md`):** CSSP is a consolidated, customer-facing interface sitting on top of a colocation provider's existing internal systems — not a replacement for their DCIM (asset/capacity management) or CMMS (maintenance/work-order management). The MVP consolidates five things enterprise customers currently chase across disconnected channels: visitor management (registering and approving facility visits), incident and maintenance visibility (read through from the provider's DCIM/CMMS), a download center for reports and compliance documents, a ticketing system covering complaints, RFIs, and service requests, and — as an optional stretch module, since it depends on harder BMS protocol integration — live BMS telemetry (temperature, humidity, power draw). The CRM half of the original two-halves concept (contracts, renewals, account health) is pushed later than originally planned: the validated MVP has no CRM features at all, on the theory that consolidating existing operational visibility is the sharper, more differentiated wedge than competing with providers' existing CRM tools. Full detail, data model, and the integration-vs-build-native distinction per module are in the PRD.

## 6. Competitive Landscape

Three categories currently compete for this budget, and none of them serve the mid-market well. The largest global operators (Equinix's Customer Portal, Digital Realty's ServiceFabric) built their own platforms in-house; they are excellent but proprietary to those companies and not for sale. Specialist vendors exist — MCIM's Colocation Customer Portal is the clearest comparable, offering a white-labeled branded dashboard, real-time maintenance and incident visibility, work-request management, and audit-ready reporting — but its public customer list (Applied Digital, Keppel, NTT) signals an enterprise price point and sales motion aimed at large operators, not the regional mid-market. The third category is the do-it-yourself stack: a generic CRM (Salesforce, HubSpot) bolted to a generic ITSM tool (Zendesk, Freshservice, ServiceNow) and a DCIM system (Device42, Sunbird, Nlyte) that was built for internal infrastructure management, not customer-facing use — this is what most mid-market operators actually run today, and it is expensive to license, painful to integrate, and still doesn't give the end customer a unified view.

The differentiation for CSSP is being the consolidated customer-facing front end that most mid-market providers' DCIM/CMMS/BMS investments already deserve but don't have — pulling incident and (eventually) telemetry data out of systems the provider already runs, while providing net-new visitor management, document distribution, and ticketing natively — priced and packaged for operators far smaller than MCIM's target customers, with faster implementation than a DIY stack and none of the burden of stitching three vendors together into something customer-facing. Two further differentiators emerged during the product phase (see `claude/prd-v3.md`): native support for enterprise customers enrolled across multiple of the provider's facilities under one account (useful as the provider itself expands to new sites), and an internal CS engagement/performance-tracking layer for the provider's own team — a capability MCIM's public materials don't describe, since their positioning is entirely customer-facing.

## 7. Business Model

The core model is B2B SaaS sold to the colocation provider (not the end customer), priced along two dimensions that scale naturally with the provider's own growth: a per-facility or per-rack-under-management fee, and a per-seat fee for the provider's own team members (sales, CS, NOC) using the CRM/ITSM back end. A three-tier structure is a reasonable starting point to validate pricing with early design partners:

| Tier | Fit | Indicative basis |
|---|---|---|
| Starter | Single-facility or early-stage operators | Flat monthly fee, capped racks/customers |
| Growth | Multi-facility regional operators (the initial beachhead) | Per-facility + per-seat pricing |
| Enterprise | Larger regional operators approaching MCIM's segment | Custom pricing, SSO/API, dedicated onboarding, multi-site enterprise account rollup, CS team performance module |

Implementation and data-migration services (moving a provider off spreadsheets or a legacy ticketing tool) are a reasonable early revenue line on top of subscription fees, and a useful way to fund the first few customer deployments before self-serve onboarding exists. All figures above are placeholders for validation with real prospects, not settled pricing — they should be pressure-tested in the first round of customer discovery calls before being finalized.

## 8. Go-to-Market & Scaling Path

The plan sequences in four phases rather than trying to reach the full region at once.

Phase 1 (0–6 months): validate the problem and rough-in the offer with 3–5 design-partner conversations at mid-market Indonesian and Southeast Asian operators (excluding the author's current employer per Section 4), aiming for one or two paid or heavily-discounted pilot customers on a narrow MVP feature set (service request submission, incident/maintenance visibility, basic account dashboard). Phase 2 (6–12 months): use pilot feedback to build out the CRM half, add SLA/uptime reporting, and convert pilots to standard paid contracts; target 5–10 paying customers in Indonesia. Phase 3 (12–24 months): expand geographically into one or two adjacent Southeast Asian markets (Malaysia, Philippines, or Vietnam, chosen based on where pilot customers already operate or refer), and start layering in integrations with common DCIM and monitoring tools so the portal becomes the customer-facing layer on top of whatever infrastructure software the provider already runs internally. Phase 4 (24+ months): move toward a platform/ecosystem model — an API and integration marketplace, partnerships with regional system integrators who resell or implement CSSP, and, if the earlier phases validate demand at scale, evaluate whether the CRM/ITSM core generalizes to adjacent verticals (managed hosting, cloud/MSP providers) that share the same customer-visibility problem.

Distribution in the early phases is direct and relationship-led — this is a domain where the founder's own network and credibility in the colocation industry matter more than paid marketing — shifting toward content, industry-event presence (data center associations, colocation trade shows), and channel partnerships with regional systems integrators as the product and case studies mature.

## 9. Risks & Mitigations

The most immediate and controllable risk is not market or product risk — it's the conflict-of-interest exposure created by building a company that sells to the same industry as the current employer. Before approaching any prospective customer or writing a line of code that touches employer systems or data, the employment contract should be reviewed specifically for non-compete, conflict-of-interest, and IP-assignment clauses, ideally with a lawyer, since these clauses vary widely and the consequences of getting this wrong (including with a current employer) can be serious. Practical mitigations regardless of what the contract says: build entirely on personal time and personal equipment, never on employer systems or with employer data; keep the current employer and its closest direct competitors off the prospect list until the contract question is resolved; and consider disclosing the side venture to the employer proactively if the contract requires it, rather than risking discovery later. This is not legal advice — it's a flag that the review needs to happen before Phase 1 customer conversations begin.

Beyond that, the plan carries the usual early-stage risks worth naming rather than ignoring: market risk (mid-market operators may be more price-sensitive or change-averse than assumed, especially where "if it ain't broke" thinking dominates infrastructure purchasing); competitive risk (MCIM or a DCIM incumbent could move down-market faster than expected); execution risk (the MVP has grown across the product phase — see `claude/prd-v3.md` Section 12 — to five customer-facing modules plus an enterprise-account hierarchy plus an internal CS performance module, which is a larger build for a small or solo team than the original scope, and argues for deciding what ships to the *first* pilot versus what follows once that pilot validates the core loop); and capital/time risk (this is explicitly a side venture funded with personal time and money against a single-income household with existing financial commitments, which argues for the phased, revenue-funded approach above rather than raising outside capital early).

## 10. Team & Resourcing

The plan assumes a solo founder-operator in the early phases, using contract or fractional help for the parts outside the founder's own expertise — most likely a contract developer or small dev shop for the initial MVP build, since the founder's strength is customer-facing colocation domain knowledge rather than software engineering. Hiring (even part-time or contract) a designer for the portal UI before the first pilot is a high-leverage early investment, since "self-service portal" lives or dies on whether customers find it easier than emailing their account manager. Formal hiring beyond contractors is a Phase 2/3 decision, gated on paid customer revenue rather than committed upfront.

## 11. Financial Overview (illustrative, not a forecast)

Real financial projections require real cost quotes (development, hosting, any licensing) and real pricing validated with prospects, so the numbers below are placeholders to structure thinking, not a forecast — and none of this is financial advice. The main cost lines in Phase 1 are development (whether contracted or self-built), basic infrastructure/hosting, and the founder's own time; the main early revenue lines are pilot/implementation fees and the first handful of subscription contracts. A useful early exercise, once 2-3 design-partner conversations have happened, is working backward from "how many Growth-tier customers at what price would this need to replace or supplement current income" — that number should directly inform how aggressively to price and how many pilots to target in Phase 1.

## 12. Milestones (next 12 months)

| Timeframe | Milestone |
|---|---|
| Month 0–1 | Employment contract review; finalize MVP scope; identify 8-10 target design-partner operators |
| Month 1–3 | Run design-partner discovery conversations; validate problem, pricing tiers, and must-have MVP features |
| Month 3–6(-9) | Build/commission MVP (visitor management, incident/maintenance visibility, download center, ticketing; BMS telemetry as a stretch goal); sign 1-2 pilots — timeline extended from the original 3-6 months given the broader scope confirmed in the PRD |
| Month 6–9 | Incorporate pilot feedback; add CRM/account-management module; convert pilots to paid contracts |
| Month 9–12 | Add SLA/uptime reporting; reach 5+ paying customers; begin scoping Phase 3 geographic expansion |

## 13. Next Step

This plan is deliberately silent on the product's feature spec, data model, tech stack, and UI — that's the next deliverable, once this plan (market framing, target customer, pricing approach, and phasing) is agreed or adjusted. The immediate open questions worth resolving before moving to product: does the beachhead customer profile and phasing above feel right, does the illustrative pricing structure need adjusting based on what's already known about what operators in this market currently pay for CRM/ITSM/DCIM tools, and should the employment contract review happen before or in parallel with early design-partner conversations.

---

### Sources
- [Booming Southeast Asia Data Center Colocation Market Outlook, 2031](https://www.globenewswire.com/news-release/2026/07/15/3327895/0/en/booming-southeast-asia-data-center-colocation-market-outlook-2031-malaysia-and-batam-emerge-as-data-center-investment-hotspots.html)
- [Indonesia Data Center Colocation Market: Hyperscale Expansion and Cloud Demand Contributes USD 1.15 Billion Opportunity](https://www.barchart.com/story/news/33694748/indonesia-data-center-colocation-market-hyperscale-expansion-and-cloud-demand-contributes-usd-1-15-billion-opportunity)
- [Indonesia Data Center Colocation Market Size & Share, Growth (Arizton)](https://www.arizton.com/market-reports/indonesia-data-center-colocation-market)
- [Colocation Customer Portal - MCIM](https://mcim.io/platform/colocation-customer-portal/)
- [Top 10 DCIM vendors - DCD](https://www.datacenterdynamics.com/en/opinions/top-10-dcim-vendors/)
- [Device42 vs Sunbird DCIM Comparison](https://www.trustradius.com/compare-products/device42-vs-sunbird-dcim)
