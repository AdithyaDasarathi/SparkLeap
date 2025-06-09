export interface CalculationExample {
  input: Record<string, number>;
  output: number;
}

export interface CalculationFormula {
  description: string;
  variables: Record<string, string>;
  calculate: (inputs: Record<string, number>) => number;
  example: CalculationExample;
}

export const businessCalculators: Record<string, CalculationFormula> = {
  'roi': {
    description: 'Calculate Return on Investment (ROI)',
    variables: {
      'return': 'Total return or profit ($)',
      'investment': 'Initial investment amount ($)'
    },
    calculate: (inputs) => ((inputs.return - inputs.investment) / inputs.investment) * 100,
    example: {
      input: { return: 15000, investment: 10000 },
      output: 50 // 50% ROI
    }
  },
  'burn rate': {
    description: 'Calculate Monthly Burn Rate',
    variables: {
      'expenses': 'Total monthly expenses ($)',
      'revenue': 'Total monthly revenue ($)'
    },
    calculate: (inputs) => inputs.expenses - (inputs.revenue || 0),
    example: {
      input: { expenses: 50000, revenue: 30000 },
      output: 20000 // $20,000 burn rate
    }
  },
  'churn rate': {
    description: 'Calculate Customer Churn Rate',
    variables: {
      'lost': 'Number of customers lost',
      'total': 'Total customers at start'
    },
    calculate: (inputs) => (inputs.lost / inputs.total) * 100,
    example: {
      input: { lost: 50, total: 1000 },
      output: 5 // 5% churn rate
    }
  },
  'cac': {
    description: 'Calculate Customer Acquisition Cost (CAC)',
    variables: {
      'spend': 'Total marketing and sales spend ($)',
      'customers': 'Number of new customers acquired'
    },
    calculate: (inputs) => inputs.spend / inputs.customers,
    example: {
      input: { spend: 100000, customers: 200 },
      output: 500 // $500 CAC
    }
  },
  'ltv': {
    description: 'Calculate Customer Lifetime Value (LTV)',
    variables: {
      'revenue': 'Average monthly revenue per customer ($)',
      'margin': 'Profit margin percentage (%)',
      'months': 'Average customer lifetime in months'
    },
    calculate: (inputs) => inputs.revenue * (inputs.margin / 100) * inputs.months,
    example: {
      input: { revenue: 100, margin: 30, months: 24 },
      output: 720 // $720 LTV
    }
  },
  'runway': {
    description: 'Calculate Cash Runway in Months',
    variables: {
      'cash': 'Current cash balance ($)',
      'burn': 'Monthly burn rate ($)'
    },
    calculate: (inputs) => inputs.cash / inputs.burn,
    example: {
      input: { cash: 1000000, burn: 50000 },
      output: 20 // 20 months runway
    }
  },
  'margin': {
    description: 'Calculate Profit Margin Percentage',
    variables: {
      'revenue': 'Total revenue ($)',
      'costs': 'Total costs ($)'
    },
    calculate: (inputs) => ((inputs.revenue - inputs.costs) / inputs.revenue) * 100,
    example: {
      input: { revenue: 200000, costs: 140000 },
      output: 30 // 30% profit margin
    }
  }
};
