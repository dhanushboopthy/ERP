/**
 * Global Sample Data Utility for QA Testing
 * Textile Sizing ERP - Production Grade
 */

import { toast } from 'sonner';

export type ModuleName = 
  | 'yarn-receipt'
  | 'baby-cone'
  | 'yarn-delivery'
  | 'yarn-return'
  | 'sizing-job-card'
  | 'beam-management';

interface SampleDataConfig {
  moduleName: ModuleName;
  data: Record<string, any>;
  calculations?: () => void;
}

/**
 * Sample data templates for each module
 */
const SAMPLE_DATA_TEMPLATES: Record<ModuleName, Record<string, any>> = {
  'yarn-receipt': {
    receiptDate: new Date().toISOString().split('T')[0],
    partyId: 1, // Will be resolved from actual data
    vehicleNo: 'TN-33-AB-4567',
    driverName: 'Ramesh Kumar',
    millName: 'Lakshmi Weaving Mills',
    pdcNo: `PDC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    pdcDate: new Date().toISOString().split('T')[0],
    remarks: 'QA sample inward receipt - Auto-generated for testing',
    // Details will be added dynamically
  },
  
  'baby-cone': {
    babyConeDate: new Date().toISOString().split('T')[0],
    lotNo: `LOT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    bagNo: 1,
    totalCones: 24,
    grossWeight: 52.500,
    tareWeight: 2.500,
    windingLoss: 1.200,
    leftoverWeight: 0.500,
    remarks: 'QA sample baby cone entry',
  },

  'yarn-delivery': {
    dcDate: new Date().toISOString().split('T')[0],
    vehicleNo: 'TN-01-XY-9876',
    driverName: 'Murugan',
    remarks: 'QA sample yarn delivery',
    grossWeight: 520.000,
    tareWeight: 20.000,
    ratePerKg: 350.00,
  },

  'yarn-return': {
    dcDate: new Date().toISOString().split('T')[0],
    returnType: 'MillReturn',
    vehicleNo: 'TN-33-AB-4567',
    driverName: 'Ramesh',
    remarks: 'QA sample yarn return',
    grossWeight: 100.000,
    tareWeight: 5.000,
  },

  'sizing-job-card': {
    jobCardDate: new Date().toISOString().split('T')[0],
    lotNo: `SET-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    totalEnds: 4800,
    warpingMeters: 5000,
    sizingMeters: 4950,
    pickupPercentage: 8.5,
    elongationPercentage: 1.0,
    machineNo: 'SIZ-01',
    operatorName: 'Sakthivel',
    remarks: 'QA sample sizing job card',
  },

  'beam-management': {
    beamNo: `BM-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    totalEnds: 4800,
    beamLength: 4950,
    grossWeight: 850.000,
    tareWeight: 45.000,
    remarks: 'QA sample beam entry',
  },
};

/**
 * Check if user can use sample data
 */
export function canUseSampleData(): boolean {
  if (typeof window === 'undefined') return false;
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NEXT_PUBLIC_ENVIRONMENT !== 'production';
  
  // Allow for SuperAdmin or in non-production environment
  return user.role === 'SuperAdmin' || isDevelopment;
}

/**
 * Log QA sample data usage
 */
async function logSampleDataUsage(moduleName: ModuleName, userId?: string) {
  try {
    const logEntry = {
      action: 'QA_SAMPLE_DATA_USED',
      module: moduleName,
      user: userId || JSON.parse(localStorage.getItem('user') || '{}').username || 'Unknown',
      timestamp: new Date().toISOString(),
    };
    
    console.log('[QA Sample Data]', logEntry);
    
    // Could send to analytics/audit endpoint
    // await apiClient.post('/audit/qa-sample-data', logEntry);
  } catch (error) {
    console.error('Failed to log sample data usage:', error);
  }
}

/**
 * Get sample data for a specific module
 */
export function getSampleData(moduleName: ModuleName): Record<string, any> {
  const template = SAMPLE_DATA_TEMPLATES[moduleName];
  if (!template) {
    throw new Error(`No sample data template found for module: ${moduleName}`);
  }
  
  return { ...template };
}

/**
 * Fill form with sample data
 */
export async function fillSampleData(
  moduleName: ModuleName,
  setters: Record<string, (value: any) => void>,
  options?: {
    onComplete?: () => void;
    additionalData?: Record<string, any>;
    skipFields?: string[];
  }
): Promise<void> {
  if (!canUseSampleData()) {
    toast.error('Sample data is only available for SuperAdmin or in non-production environment');
    return;
  }

  try {
    const sampleData = getSampleData(moduleName);
    const allData = { ...sampleData, ...options?.additionalData };

    // Fill form fields
    Object.entries(allData).forEach(([key, value]) => {
      if (options?.skipFields?.includes(key)) return;
      
      const setter = setters[key];
      if (setter && typeof setter === 'function') {
        setter(value);
      }
    });

    // Log usage
    await logSampleDataUsage(moduleName);

    // Call completion callback
    if (options?.onComplete) {
      options.onComplete();
    }

    toast.success('✨ Sample data filled successfully', {
      description: 'All fields populated with QA test data',
    });
  } catch (error) {
    console.error('Error filling sample data:', error);
    toast.error('Failed to fill sample data');
  }
}

/**
 * Generate dynamic sample data for yarn receipt details
 */
export function generateYarnReceiptDetails(yarnCounts: any[]) {
  if (!yarnCounts || yarnCounts.length === 0) return [];
  
  const yarnCount = yarnCounts[0];
  return [
    {
      yarnCountId: yarnCount.id,
      lotNo: `LOT-${new Date().getFullYear()}-001`,
      bagNo: 1,
      coneCount: 48,
      grossWeight: 520.000,
      tareWeight: 20.000,
      netWeight: 500.000,
      ratePerKg: 320.00,
    },
  ];
}

/**
 * Calculate derived fields
 */
export const calculations = {
  netWeight: (gross: number, tare: number): number => {
    return Number((gross - tare).toFixed(3));
  },
  
  yieldWeight: (net: number, loss: number, leftover: number): number => {
    return Number((net - loss - leftover).toFixed(3));
  },
  
  yieldPercentage: (actualYield: number, netWeight: number): number => {
    if (netWeight === 0) return 0;
    return Number(((actualYield / netWeight) * 100).toFixed(2));
  },
  
  amount: (weight: number, rate: number): number => {
    return Number((weight * rate).toFixed(2));
  },
};

/**
 * Validate sample data before submission
 */
export function validateSampleData(moduleName: ModuleName, data: Record<string, any>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Common validations
  if (data.grossWeight && data.tareWeight && data.grossWeight <= data.tareWeight) {
    errors.push('Gross weight must be greater than tare weight');
  }

  if (data.netWeight && data.netWeight <= 0) {
    errors.push('Net weight must be positive');
  }

  // Module-specific validations
  switch (moduleName) {
    case 'baby-cone':
      if (data.totalCones && data.totalCones <= 0) {
        errors.push('Total cones must be positive');
      }
      if (data.windingLoss && data.windingLoss < 0) {
        errors.push('Winding loss cannot be negative');
      }
      break;

    case 'sizing-job-card':
      if (data.totalEnds && data.totalEnds <= 0) {
        errors.push('Total ends must be positive');
      }
      if (data.pickupPercentage && (data.pickupPercentage < 0 || data.pickupPercentage > 100)) {
        errors.push('Pickup percentage must be between 0 and 100');
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default {
  fillSampleData,
  getSampleData,
  canUseSampleData,
  calculations,
  validateSampleData,
  generateYarnReceiptDetails,
};
