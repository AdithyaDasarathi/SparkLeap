# SparkLeap Backend Functions - Comprehensive Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture Overview](#architecture-overview)
3. [Backend Documentation](#backend-documentation)
4. [Frontend Documentation](#frontend-documentation)
5. [Setup and Deployment](#setup-and-deployment)

---

## Overview

SparkLeap is a comprehensive business intelligence and task management platform built with Next.js 13+. It combines AI-powered task management, KPI tracking, and data source integrations to help businesses automate goal execution and monitor key metrics in real-time.

**Key Features:**
- AI-powered task management with natural language processing
- Real-time KPI dashboard with multiple chart types
- Integration with Google Calendar, Google Sheets, Notion, and Stripe
- Automated data synchronization and trend analysis
- Secure OAuth authentication and encrypted credential storage

---

## Architecture Overview

The application follows a modern full-stack architecture:

- **Frontend**: Next.js 13+ with React, TypeScript, and Tailwind CSS
- **Backend**: Next.js API routes with file-based data storage
- **AI Integration**: OpenAI GPT for chat assistance and task processing
- **Authentication**: Google OAuth 2.0 for data source access
- **Charts**: Recharts library for data visualization
- **Data Storage**: JSON file-based persistence with encryption

---

## Backend Documentation

### Core API Structure

The backend is organized into several main API route groups:

#### 1. KPI Management APIs (`/app/api/kpi/`)
**Purpose**: Handle Key Performance Indicator data management

**Routes:**
- `GET /api/kpi` - Fetch KPIs and trends for a user
- `POST /api/kpi/generate-historical-data` - Generate sample historical data
- `GET /api/kpi/verify-sync` - Verify data synchronization status

**Key Features:**
- Automatic sample data generation for demo purposes
- Trend calculation and percentage change analysis
- Support for both real-time and historical data
- Integration with multiple data sources

#### 2. Data Source Integration APIs (`/app/api/datasources/`)
**Purpose**: Manage connections to external data sources

**Routes:**
- `GET/POST /api/datasources` - List and create data source connections
- `GET/PUT/DELETE /api/datasources/[id]` - Manage individual data sources
- `POST /api/datasources/csv-upload` - Handle CSV file uploads

**Supported Data Sources:**
- **Stripe**: Payment processing and subscription data
- **Google Analytics**: Website traffic and user behavior
- **Airtable**: Custom data and metrics
- **Google Sheets**: Manual data entry and calculations
- **CSV Upload**: Bulk data import from files
- **Notion**: Task and project data
- **Manual Entry**: Direct KPI input

#### 3. Synchronization APIs (`/app/api/sync/`)
**Purpose**: Handle data synchronization between sources and KPIs

**Routes:**
- `POST /api/sync` - Trigger automatic sync jobs
- `GET /api/sync` - Get sync job status
- `POST /api/sync/manual` - Trigger manual synchronization

**Features:**
- Automatic scheduling of sync jobs
- Error handling and retry logic
- Real-time sync status monitoring
- Historical sync job tracking

#### 4. Google Integration APIs (`/app/api/google/`)
**Purpose**: Handle Google OAuth and service integrations

**Routes:**
- `GET /api/google/auth` - Initiate Google OAuth flow
- `GET /api/google/callback` - Handle OAuth callback
- `GET /api/google/sheets-auth` - Google Sheets specific auth
- `GET /api/google/sheets-callback` - Sheets OAuth callback

**OAuth Scopes:**
- Google Calendar: Event creation and management
- Google Sheets: Spreadsheet read/write access
- User Profile: Basic user information

#### 5. Calendar Integration APIs (`/app/api/calendar/`)
**Purpose**: Manage Google Calendar integration for task scheduling

**Routes:**
- `GET /api/calendar/list` - List calendar events
- `GET /api/calendar/events` - Fetch calendar events with filters
- `POST /api/calendar/create` - Create new calendar events
- `PUT /api/calendar/update` - Update existing events
- `DELETE /api/calendar/delete` - Delete calendar events

**Features:**
- Automatic task-to-event conversion
- Recurring event support
- Time zone handling
- Conflict detection

#### 6. Stripe Integration APIs (`/app/api/stripe/`)
**Purpose**: Handle Stripe payment processing and subscription management

**Expected Routes:**
- `GET /api/stripe/config` - Retrieve Stripe configuration and webhook endpoints
- `POST /api/stripe/webhooks` - Handle Stripe webhook events
- `GET /api/stripe/customers` - List and manage customer data
- `GET /api/stripe/subscriptions` - Manage subscription lifecycles
- `GET /api/stripe/payments` - Track payment transactions and status
- `GET /api/stripe/metrics` - Extract financial KPIs from Stripe data

**Expected Features:**
- Webhook signature verification for security
- Real-time subscription status updates
- Payment failure handling and retry logic
- Customer lifecycle management
- Subscription plan management
- Revenue recognition and MRR calculations
- Chargeback and dispute tracking
- Tax and billing address management

#### 7. AI and Search APIs
**Routes:**
- `POST /api/search` - AI-powered search functionality
- `POST /api/search_web` - Web search integration
- `POST /api/notion` - Notion integration for task management
- `GET /api/wikipedia` - Wikipedia search integration

### Core Backend Components

#### 1. Database Service (`src/utils/database.ts`)
File-based storage management with the following key methods:

**KPI Management:**
```typescript
static async getKPIsByUser(userId: string): Promise<KPI[]>
static async createKPI(kpi: Omit<KPI, 'id'>): Promise<KPI>
static async updateKPI(id: string, updates: Partial<KPI>): Promise<KPI>
static async getKPITrends(userId: string, metric: KPIMetric, days: number): Promise<KPITrend[]>
static async seedSampleData(userId: string): Promise<void>
```

**Data Source Management:**
```typescript
static async createDataSource(source: Omit<DataSourceConfig, 'id'>): Promise<DataSourceConfig>
static async getDataSource(id: string): Promise<DataSourceConfig | null>
static async updateDataSource(id: string, updates: Partial<DataSourceConfig>): Promise<DataSourceConfig>
```

**Security:**
```typescript
static encryptCredentials(data: string): { encryptedData: string; iv: string }
static decryptCredentials(encryptedData: string, iv: string): string
```

#### 2. Data Source Integrations (`src/utils/dataSourceIntegrations.ts`)

**Base Integration Class:**
```typescript
abstract class DataSourceIntegration {
  abstract testConnection(): Promise<boolean>
  abstract sync(): Promise<IntegrationResult>
  abstract getMetrics(): Promise<Record<string, number>>
}
```

**Specific Integrations:**
- `StripeIntegration`: Revenue, subscription, and payment metrics
- `GoogleSheetsIntegration`: Custom spreadsheet data
- `AirtableIntegration`: Database records and custom fields
- `NotionIntegration`: Task databases and project tracking
- `CSVIntegration`: File-based data import

**Stripe Integration Expectations:**
The `StripeIntegration` class should provide comprehensive payment and subscription data management:

```typescript
class StripeIntegration extends DataSourceIntegration {
  // Core methods
  async testConnection(): Promise<boolean>
  async sync(): Promise<IntegrationResult>
  async getMetrics(): Promise<StripeMetrics>
  
  // Stripe-specific methods
  async getSubscriptions(status?: SubscriptionStatus): Promise<Subscription[]>
  async getCustomers(limit?: number): Promise<Customer[]>
  async getPayments(dateRange?: DateRange): Promise<Payment[]>
  async getInvoices(status?: InvoiceStatus): Promise<Invoice[]>
  async calculateMRR(date?: Date): Promise<number>
  async getChurnRate(period: Period): Promise<number>
  async getRevenueBreakdown(): Promise<RevenueBreakdown>
}
```

**Expected Stripe Metrics:**
- **Monthly Recurring Revenue (MRR)**: Calculated from active subscriptions
- **Annual Recurring Revenue (ARR)**: Yearly subscription revenue projection
- **Customer Lifetime Value (LTV)**: Average revenue per customer
- **Customer Acquisition Cost (CAC)**: From marketing attribution data
- **Churn Rate**: Monthly subscription cancellation percentage
- **Net Revenue Retention**: Revenue growth from existing customers
- **Payment Failure Rate**: Failed payment transaction percentage
- **Average Revenue Per User (ARPU)**: Mean revenue per active customer
- **Gross Revenue**: Total payments received before refunds
- **Net Revenue**: Revenue after refunds and chargebacks

**Webhook Event Handling:**
Expected webhook events to process and sync:
- `customer.subscription.created` - New subscription tracking
- `customer.subscription.updated` - Plan changes and updates
- `customer.subscription.deleted` - Cancellation handling
- `invoice.payment_succeeded` - Successful payment processing
- `invoice.payment_failed` - Failed payment notifications
- `customer.created` - New customer onboarding
- `charge.dispute.created` - Chargeback management

**Integration Factory:**
```typescript
export class IntegrationFactory {
  static createIntegration(source: DataSource, credentials: string, userId: string): DataSourceIntegration
}
```

**Sync Service:**
```typescript
export class KPISyncService {
  static async syncDataSource(sourceId: string): Promise<IntegrationResult>
}
```

#### 3. Task Processing (`src/utils/taskProcessor.ts`)
AI-powered natural language task processing:

```typescript
export async function processTaskInput(input: string): Promise<Task[]>
```

**Features:**
- Natural language parsing using OpenAI GPT
- Time and date extraction with chrono-node
- Automatic priority assignment
- Category classification
- Support for single and multiple task creation

**Task Creation Patterns:**
- "Schedule meeting with John at 3pm tomorrow"
- "Remind me to finish the report by Friday"
- "Add high priority task: Review Q4 budget"

#### 4. AI Integration (`src/utils/openai.ts`)
OpenAI GPT integration for chat and task processing:

```typescript
export async function callChatApi(messages: Message[]): Promise<string>
```

**Features:**
- Context-aware conversations
- Fallback to web search for unknown queries
- Error handling and retry logic
- Support for different GPT models

### Data Models

#### KPI Data Structure
```typescript
export interface KPI {
  id: string;
  userId: string;
  metricName: KPIMetric;
  value: number;
  source: DataSource;
  timestamp: Date;
  lastSyncedAt: Date;
  isManualOverride: boolean;
  overrideValue?: number;
  status: 'active' | 'archived';
}
```

**Supported KPI Metrics:**
- **Financial**: MRR, Net Profit, Burn Rate, Cash on Hand, CAC, LTV, Runway
- **User Metrics**: User Signups, Active Users, Churn Rate, Conversion Rate
- **Custom**: User-defined metrics

#### Task Data Structure
```typescript
export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  category: TaskCategory;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  sourceId?: string;
}
```

**Task Properties:**
- **Priority**: High, Medium, Low
- **Status**: pending, in-progress, completed, cancelled
- **Category**: Follow-up, Product, Hiring, General

#### Stripe Data Structures

**Core Stripe Configuration:**
```typescript
export interface StripeConfig {
  id: string;
  userId: string;
  accountId: string;
  publicKey: string;
  secretKey: string; // Encrypted
  webhookSecret: string; // Encrypted
  isLiveMode: boolean;
  connectedAt: Date;
  lastSyncedAt: Date;
  syncStatus: 'active' | 'error' | 'pending';
  webhookEndpoint?: string;
}
```

**Customer Data Structure:**
```typescript
export interface StripeCustomer {
  id: string; // Stripe customer ID
  userId: string; // Internal user ID
  email: string;
  name?: string;
  description?: string;
  phone?: string;
  address?: StripeAddress;
  metadata: Record<string, string>;
  currency: string;
  balance: number;
  created: Date;
  delinquent: boolean;
  defaultSource?: string;
  invoicePrefix?: string;
  livemode: boolean;
  preferredLocales?: string[];
  taxExempt: 'none' | 'exempt' | 'reverse';
}
```

**Subscription Data Structure:**
```typescript
export interface StripeSubscription {
  id: string; // Stripe subscription ID
  customerId: string;
  userId: string; // Internal user ID
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  created: Date;
  canceledAt?: Date;
  cancelAtPeriodEnd: boolean;
  collectionMethod: 'charge_automatically' | 'send_invoice';
  currency: string;
  items: SubscriptionItem[];
  metadata: Record<string, string>;
  trialStart?: Date;
  trialEnd?: Date;
  billingCycleAnchor: Date;
  daysUntilDue?: number;
  defaultPaymentMethod?: string;
  discount?: StripeDiscount;
  tax?: number;
  applicationFeePercent?: number;
}

export type SubscriptionStatus = 
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'paused';

export interface SubscriptionItem {
  id: string;
  priceId: string;
  quantity: number;
  created: Date;
  metadata: Record<string, string>;
  billingThresholds?: {
    usageGte?: number;
  };
  taxRates: StripeTaxRate[];
}
```

**Payment and Invoice Data Structures:**
```typescript
export interface StripePayment {
  id: string; // Stripe charge/payment intent ID
  customerId: string;
  userId: string; // Internal user ID
  amount: number; // Amount in cents
  currency: string;
  status: PaymentStatus;
  created: Date;
  paid: Date;
  description?: string;
  invoiceId?: string;
  subscriptionId?: string;
  paymentMethodId?: string;
  failureCode?: string;
  failureMessage?: string;
  refunded: boolean;
  refundedAmount: number;
  disputed: boolean;
  metadata: Record<string, string>;
  receiptEmail?: string;
  receiptUrl?: string;
  applicationFee?: number;
  transferGroup?: string;
}

export type PaymentStatus = 
  | 'requires_payment_method'
  | 'requires_confirmation'
  | 'requires_action'
  | 'processing'
  | 'requires_capture'
  | 'canceled'
  | 'succeeded'
  | 'failed';

export interface StripeInvoice {
  id: string; // Stripe invoice ID
  customerId: string;
  subscriptionId?: string;
  userId: string; // Internal user ID
  status: InvoiceStatus;
  currency: string;
  amountDue: number;
  amountPaid: number;
  amountRemaining: number;
  subtotal: number;
  total: number;
  tax?: number;
  created: Date;
  dueDate?: Date;
  paidAt?: Date;
  periodStart: Date;
  periodEnd: Date;
  attemptCount: number;
  attempted: boolean;
  autoAdvance: boolean;
  billingReason: BillingReason;
  collectionMethod: 'charge_automatically' | 'send_invoice';
  description?: string;
  hostedInvoiceUrl?: string;
  invoicePdf?: string;
  number?: string;
  receiptNumber?: string;
  metadata: Record<string, string>;
  lines: InvoiceLineItem[];
  discount?: StripeDiscount;
}

export type InvoiceStatus = 
  | 'draft'
  | 'open'
  | 'paid'
  | 'uncollectible'
  | 'void';

export type BillingReason = 
  | 'subscription_cycle'
  | 'subscription_create'
  | 'subscription_update'
  | 'subscription'
  | 'manual'
  | 'upcoming'
  | 'subscription_threshold';

export interface InvoiceLineItem {
  id: string;
  amount: number;
  currency: string;
  description?: string;
  discountable: boolean;
  invoiceItem?: string;
  livemode: boolean;
  metadata: Record<string, string>;
  period: {
    start: Date;
    end: Date;
  };
  priceId?: string;
  prorated: boolean;
  quantity?: number;
  subscriptionId?: string;
  subscriptionItem?: string;
  taxAmounts: TaxAmount[];
  taxRates: StripeTaxRate[];
  type: 'invoiceitem' | 'subscription';
  unitAmount?: number;
  unitAmountDecimal?: string;
}
```

**Product and Price Data Structures:**
```typescript
export interface StripeProduct {
  id: string; // Stripe product ID
  userId: string; // Internal user ID
  name: string;
  description?: string;
  active: boolean;
  created: Date;
  updated: Date;
  images: string[];
  metadata: Record<string, string>;
  packageDimensions?: {
    height: number;
    length: number;
    weight: number;
    width: number;
  };
  shippable?: boolean;
  type: 'good' | 'service';
  unitLabel?: string;
  url?: string;
}

export interface StripePrice {
  id: string; // Stripe price ID
  productId: string;
  userId: string; // Internal user ID
  active: boolean;
  currency: string;
  type: 'one_time' | 'recurring';
  unitAmount?: number;
  unitAmountDecimal?: string;
  billingScheme: 'per_unit' | 'tiered';
  created: Date;
  livemode: boolean;
  lookupKey?: string;
  metadata: Record<string, string>;
  nickname?: string;
  recurring?: {
    aggregateUsage?: 'sum' | 'last_during_period' | 'last_ever' | 'max';
    interval: 'day' | 'week' | 'month' | 'year';
    intervalCount: number;
    trialPeriodDays?: number;
    usageType: 'licensed' | 'metered';
  };
  taxBehavior?: 'exclusive' | 'inclusive' | 'unspecified';
  tiers?: PriceTier[];
  tiersMode?: 'graduated' | 'volume';
  transformQuantity?: {
    divideBy: number;
    round: 'down' | 'up';
  };
}

export interface PriceTier {
  flatAmount?: number;
  flatAmountDecimal?: string;
  unitAmount?: number;
  unitAmountDecimal?: string;
  upTo?: number | 'inf';
}
```

**Metrics and Analytics Data Structures:**
```typescript
export interface StripeMetrics {
  userId: string;
  periodStart: Date;
  periodEnd: Date;
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  totalRevenue: number;
  netRevenue: number; // After refunds and disputes
  refundedAmount: number;
  disputedAmount: number;
  customerCount: number;
  activeSubscriptions: number;
  trialingSubscriptions: number;
  pastDueSubscriptions: number;
  canceledSubscriptions: number;
  churnRate: number; // Percentage
  churnedMrr: number;
  newMrr: number;
  expandedMrr: number;
  contractedMrr: number;
  arpu: number; // Average Revenue Per User
  averageSubscriptionValue: number;
  paymentFailureRate: number;
  invoiceCollectionRate: number;
  lifetimeValue: number;
  customerAcquisitionCost?: number;
  netRevenueRetention: number;
  grossRevenueRetention: number;
  calculatedAt: Date;
}

export interface RevenueBreakdown {
  subscriptionRevenue: number;
  oneTimeRevenue: number;
  refunds: number;
  disputes: number;
  netRevenue: number;
  byProduct: ProductRevenue[];
  bySubscriptionPlan: PlanRevenue[];
  currency: string;
  period: {
    start: Date;
    end: Date;
  };
}

export interface ProductRevenue {
  productId: string;
  productName: string;
  revenue: number;
  quantity: number;
  refunded: number;
}

export interface PlanRevenue {
  priceId: string;
  planName: string;
  revenue: number;
  subscriptions: number;
  mrr: number;
}
```

**Webhook and Event Data Structures:**
```typescript
export interface StripeWebhookEvent {
  id: string; // Stripe event ID
  userId: string; // Internal user ID
  type: StripeEventType;
  created: Date;
  processed: boolean;
  processedAt?: Date;
  data: {
    object: any; // The Stripe object
    previousAttributes?: any; // For update events
  };
  livemode: boolean;
  pendingWebhooks: number;
  request?: {
    id: string;
    idempotencyKey?: string;
  };
  apiVersion: string;
  error?: string;
  retryCount: number;
  lastRetryAt?: Date;
}

export type StripeEventType = 
  | 'customer.created'
  | 'customer.updated'
  | 'customer.deleted'
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'customer.subscription.trial_will_end'
  | 'invoice.created'
  | 'invoice.updated'
  | 'invoice.paid'
  | 'invoice.payment_failed'
  | 'invoice.payment_succeeded'
  | 'invoice.finalized'
  | 'charge.succeeded'
  | 'charge.failed'
  | 'charge.captured'
  | 'charge.dispute.created'
  | 'charge.dispute.updated'
  | 'charge.refunded'
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'payment_method.attached'
  | 'payment_method.detached'
  | 'setup_intent.succeeded'
  | 'product.created'
  | 'product.updated'
  | 'price.created'
  | 'price.updated';
```

**Supporting Types:**
```typescript
export interface StripeAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface StripeDiscount {
  id: string;
  couponId: string;
  customerId?: string;
  subscriptionId?: string;
  start: Date;
  end?: Date;
  promotionCode?: string;
}

export interface StripeTaxRate {
  id: string;
  displayName: string;
  inclusive: boolean;
  percentage: number;
  active: boolean;
  country?: string;
  state?: string;
  taxType?: string;
  created: Date;
  description?: string;
  jurisdiction?: string;
}

export interface TaxAmount {
  amount: number;
  inclusive: boolean;
  taxRate: string; // Tax rate ID
}

export interface DateRange {
  start: Date;
  end: Date;
}

export type Period = 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface IntegrationResult {
  success: boolean;
  message: string;
  recordsProcessed: number;
  errors: string[];
  lastSyncedAt: Date;
  nextSyncAt?: Date;
}
```

---

## Frontend Documentation

### Page Structure

#### 1. Landing Page (`/app/page.tsx`)
**Purpose**: Marketing landing page with product overview

**Components:**
- `HeroParallax`: Animated hero section with gradient backgrounds
- `Navigation`: Main navigation component with responsive design
- `WhatItDoesTabs`: Feature showcase with tabbed interface
- `KPIDashboardPreview`: Interactive dashboard preview

**Features:**
- Responsive design with mobile optimization
- Animated gradient backgrounds
- Call-to-action buttons linking to main features
- Product demonstration section

#### 2. KPI Dashboard Page (`/app/kpi/page.tsx`)
**Purpose**: Main business intelligence dashboard

**Features:**
- Real-time KPI monitoring with automatic refresh
- Interactive charts and visualizations
- Data source connection management
- AI chat assistant for metric insights
- Dark/light mode toggle
- Customizable KPI selection

#### 3. Task Management Page (`/app/tasks/page.tsx`)
**Purpose**: AI-powered task management interface

**Features:**
- Natural language task creation
- Task categorization and prioritization
- Calendar integration with Google Calendar
- Progress tracking and status updates
- Notion synchronization
- Bulk task operations

#### 4. Calendar Page (`/app/calendar/page.tsx`)
**Purpose**: Google Calendar integration for task scheduling

**Features:**
- Event creation and management
- Task synchronization with calendar
- OAuth authentication flow
- Recurring event support
- Time zone handling

#### 5. CSV Upload Page (`/app/csv-upload/page.tsx`)
**Purpose**: Bulk data import functionality

**Features:**
- Drag-and-drop file upload interface
- CSV validation and parsing
- Column mapping to KPI metrics
- Data preview before import
- Error handling and validation

### Key Frontend Components

#### 1. KPIDashboard (`src/components/KPIDashboard.tsx`)
The main dashboard component displaying business metrics:

**Core KPIs (Always Displayed):**
- **Monthly Recurring Revenue (MRR)**: Line chart with trend analysis
- **Net Profit**: Bar chart with positive/negative coloring
- **Burn Rate**: Combo bar/line chart showing expenses and trends
- **Cash on Hand**: Sparkline with big number display
- **User Signups**: Area chart showing growth patterns
- **Runway**: Horizontal bar countdown display

**Customizable KPIs (Can be Added):**
- **Customer Acquisition Cost (CAC)**: Bar chart with goal lines
- **Churn Rate**: Donut chart showing retention vs. churn
- **Active Users**: Line chart for daily/weekly active users
- **Conversion Rate**: Funnel chart for lead to customer flow

**Interactive Features:**
- Click any KPI card to see detailed trend analysis
- Real-time updates with refresh button
- Goal tracking with visual indicators
- Trend arrows and percentage changes
- AI chat integration for metric insights

#### 2. TaskChat (`src/components/TaskChat.tsx`)
AI-powered chat interface for task management:

**Natural Language Processing Examples:**
- "Schedule meeting with John at 3pm tomorrow"
- "Remind me to finish the report by Friday"
- "Add task: Review Q4 budget with high priority"
- "Show me my tasks for this week"

**AI Capabilities:**
- Task creation from conversational input
- Business insights based on current metrics
- General knowledge questions with web search fallback
- Context-aware responses about task status

**Features:**
- Real-time typing indicators
- Message history persistence
- Error handling with graceful fallbacks
- Integration with task management system

#### 3. TaskManager (`src/components/TaskManager.tsx`)
Comprehensive task management interface:

**Features:**
- Task list display organized by priority and status
- Filtering and sorting by category, due date, priority
- Drag-and-drop status updates
- Bulk operations (complete, delete, archive)
- Integration with Notion and Google Calendar
- Real-time synchronization

#### 4. Data Source Connectors

**GoogleSheetsConnect (`src/components/GoogleSheetsConnect.tsx`):**
- OAuth flow for Google Sheets access
- Spreadsheet selection and range configuration
- Automatic data mapping to KPI metrics
- Real-time data preview
- Error handling for permission issues

**NotionConnect (`src/components/NotionConnect.tsx`):**
- Notion API integration for task databases
- Bidirectional sync with task management
- Custom property mapping
- Database selection interface
- Sync status monitoring

**CSVUpload (`src/components/CSVUpload.tsx`):**
- Drag-and-drop file interface with visual feedback
- Real-time validation and error reporting
- Intelligent column mapping to KPI metrics
- Data preview before import
- Support for various CSV formats

**StripeConnect (`src/components/StripeConnect.tsx`):**
- Stripe account authentication and API key validation
- Real-time connection testing with Stripe API
- Subscription plan and product synchronization
- Webhook endpoint configuration and testing
- Payment method and customer data preview
- MRR calculation and revenue metric display
- Subscription lifecycle management interface
- Payment failure monitoring and alerts

### Chart Types and Visualizations

The dashboard supports multiple chart types optimized for different data:

1. **Line Charts**: Trend analysis over time (MRR, User Signups)
   - Smooth curves with data points
   - Goal line overlays
   - Interactive tooltips

2. **Bar Charts**: Discrete values with color coding (Net Profit, CAC)
   - Positive/negative color differentiation
   - Goal line indicators
   - Hover effects

3. **Area Charts**: Filled trend visualization (User Growth)
   - Gradient fills
   - Multiple series support
   - Time-based x-axis

4. **Sparklines**: Compact trend indicators (Cash on Hand)
   - Minimal design
   - Quick trend visualization
   - Space-efficient

5. **Donut Charts**: Percentage breakdowns (Churn Rate)
   - Center value display
   - Color-coded segments
   - Interactive legends

6. **Funnel Charts**: Conversion flows (Lead to Customer)
   - Step-by-step visualization
   - Conversion rate display
   - Stage comparison

7. **Horizontal Bars**: Countdown displays (Runway)
   - Progress bar style
   - Color coding for urgency
   - Remaining time display

8. **Combo Charts**: Multiple data series (Burn Rate)
   - Bar and line combinations
   - Dual y-axis support
   - Correlated data visualization

### AI Integration Features

#### 1. Task Processing
**Natural Language Understanding:**
- Converts conversational input to structured tasks
- Extracts key information (title, priority, due date, category)
- Handles complex scheduling requests

**Time Parsing:**
- Relative dates ("tomorrow", "next Friday", "in 2 weeks")
- Specific times ("at 3pm", "9:00 AM")
- Date formats (MM/DD/YYYY, "March 15th")

**Priority Assignment:**
- Automatic urgency detection from language
- Keyword-based priority classification
- Context-aware importance assessment

**Category Classification:**
- Business category detection
- Project type identification
- Automatic tagging

#### 2. Chat Assistant
**Context Awareness:**
- Understands current KPI data and trends
- Remembers conversation history
- Provides relevant suggestions

**Business Insights:**
- Analyzes metric performance
- Identifies trends and patterns
- Suggests actionable improvements

**Web Search Fallback:**
- Uses external search for unknown queries
- Provides accurate, up-to-date information
- Handles technical questions

**Task Management:**
- Creates, updates, and queries tasks
- Provides task status summaries
- Suggests task prioritization

#### 3. Data Analysis
**Trend Detection:**
- Identifies patterns in KPI data
- Calculates growth rates and changes
- Predicts future trends

**Goal Tracking:**
- Monitors progress toward targets
- Alerts for goal achievement or risks
- Suggests corrective actions

**Anomaly Detection:**
- Flags unusual metric changes
- Identifies data quality issues
- Suggests investigation areas

**Predictive Insights:**
- Forecasts based on historical data
- Scenario planning capabilities
- Risk assessment

### Authentication and Security

#### Google OAuth Integration
**OAuth Scopes:**
```typescript
const CALENDAR_SCOPES = ['https://www.googleapis.com/auth/calendar'];
const SHEETS_SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const COMBINED_SCOPES = [...CALENDAR_SCOPES, ...SHEETS_SCOPES];
```

**Security Features:**
- Secure credential storage with AES encryption
- Token refresh handling
- Permission scope management
- CSRF protection

**Authentication Flow:**
1. User initiates OAuth flow
2. Redirect to Google authorization
3. Handle callback with authorization code
4. Exchange code for access/refresh tokens
5. Store encrypted credentials
6. Use tokens for API requests

### File-Based Data Storage

The application uses JSON files for data persistence:

**Data Files:**
- `data/kpis.json` - KPI metrics and historical data
- `data/datasources.json` - Data source configurations and credentials
- `data/syncjobs.json` - Synchronization job history and status
- `data/insights.json` - AI-generated insights and recommendations

**Storage Features:**
- Atomic file operations
- Backup and recovery
- Data validation
- Migration support

---

## Setup and Deployment

### Environment Configuration

**Required Environment Variables:**
```env
# OpenAI Integration
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_OPENAI_API_BASE_URL=https://api.openai.com/v1

# Security
ENCRYPTION_KEY=your_32_character_encryption_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Stripe Integration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_endpoint_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Application
NEXTAUTH_URL=http://localhost:3000
```

### Dependencies

**Core Dependencies:**
- Next.js 13.4.19 - React framework
- React 18.2.0 - UI library
- TypeScript 5.2.2 - Type safety
- Tailwind CSS 3.3.3 - Styling

**AI and Integration:**
- OpenAI 4.10.0 - AI chat and task processing
- Google APIs 155.0.1 - Calendar and Sheets integration
- Notion Client 4.0.1 - Notion integration
- Stripe 14.11.0 - Payment processing and subscription management
- Chrono-node 2.7.0 - Date/time parsing

**Charts and UI:**
- Recharts 3.0.0 - Data visualization
- Heroicons 2.0.18 - Icon library
- Date-fns 2.30.0 - Date utilities

### Installation Steps

1. **Clone Repository:**
```bash
git clone <repository-url>
cd sparkleap-tasks
```

2. **Install Dependencies:**
```bash
npm install
```

3. **Environment Setup:**
```bash
cp env.example .env
# Edit .env with your API keys
```

4. **Run Development Server:**
```bash
npm run dev
```

5. **Access Application:**
- Open http://localhost:3000
- Navigate to different features via the navigation menu

### Deployment Considerations

**Production Setup:**
- Use proper database instead of file storage
- Implement proper session management
- Add rate limiting and security headers
- Set up monitoring and logging
- Configure proper error handling

**Scaling:**
- Implement Redis for session storage
- Use database connection pooling
- Add caching layers
- Implement background job processing
- Set up load balancing

This comprehensive platform combines modern web development practices with AI-powered automation to create a powerful business intelligence and task management solution suitable for growing businesses and teams.

