/**
 * ═══════════════════════════════════════════════════════════════════
 * ADVANCED SAMPLE DATA HOOKS - ENTERPRISE EDITION
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Features:
 * - Automatic calculation triggers
 * - Sample mode tracking
 * - Audit logging
 * - Stock impact awareness
 * - Validation triggers
 * 
 * ═══════════════════════════════════════════════════════════════════
 */

import { useCallback, useState } from 'react';
import { getSampleData, logSampleDataUsage, type FormType } from '@/lib/sample-data';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';

/**
 * Sample mode state
 */
interface SampleModeState {
  isActive: boolean;
  formType?: FormType;
  filledAt?: Date;
}

interface FillOptions {
  onCalculate?: () => void;
  onValidate?: () => void;
  showToast?: boolean;
  showBadge?: boolean;
}

/**
 * ENTERPRISE HOOK: Sample data with full tracking and calculations
 * 
 * Usage:
 * ```tsx
 * const { fillSampleData, isSampleMode } = useSampleDataAdvanced('yarn-receipt');
 * 
 * <FillSampleDataButton 
 *   formType="yarn-receipt"
 *   onFillData={(data) => fillSampleData(data, setFormData, {
 *     onCalculate: calculateTotals,
 *     onValidate: validateForm
 *   })}
 * />
 * 
 * {isSampleMode && <Badge>SAMPLE MODE</Badge>}
 * ```
 */
export function useSampleDataAdvanced(formType: FormType) {
  const { user } = useAuth();
  const [sampleMode, setSampleMode] = useState<SampleModeState>({ isActive: false });

  /**
   * Fill sample data with full enterprise features
   */
  const fillSampleData = useCallback(
    (
      sampleData: any,
      setFormState: (data: any) => void,
      options?: FillOptions
    ) => {
      // Update form state
      setFormState((prev: any) => ({
        ...prev,
        ...sampleData,
      }));

      // Mark as sample mode
      setSampleMode({
        isActive: true,
        formType,
        filledAt: new Date(),
      });

      // Trigger calculations if provided
      if (options?.onCalculate) {
        setTimeout(() => {
          try {
            options.onCalculate!();
          } catch (error) {
            console.error('Calculation error:', error);
            toast.error('Calculation error occurred');
          }
        }, 100);
      }

      // Trigger validations if provided
      if (options?.onValidate) {
        setTimeout(() => {
          try {
            options.onValidate!();
          } catch (error) {
            console.error('Validation error:', error);
          }
        }, 200);
      }

      // Log usage for audit trail
      logSampleDataUsage(formType, user?.fullName);

      // Show toast notification
      if (options?.showToast !== false) {
        toast.success('⚡ Sample data filled successfully', {
          description: 'All fields populated. Calculations triggered. Ready to save.',
          duration: 4000,
        });
      }
    },
    [formType, user]
  );

  /**
   * Get sample data for this form type
   */
  const getSample = useCallback(() => {
    return getSampleData(formType);
  }, [formType]);

  /**
   * Fill directly without needing the data
   */
  const fillDirect = useCallback(
    (setFormState: (data: any) => void, options?: FillOptions) => {
      const data = getSampleData(formType);
      fillSampleData(data, setFormState, options);
    },
    [formType, fillSampleData]
  );

  /**
   * Clear sample mode tracking
   */
  const clearSampleMode = useCallback(() => {
    setSampleMode({ isActive: false });
  }, []);

  /**
   * Fill only specific fields
   */
  const fillFields = useCallback(
    (
      fieldNames: string[],
      setFormState: (updater: (prev: any) => any) => void
    ) => {
      const sampleData = getSampleData(formType);
      const filteredData: any = {};

      fieldNames.forEach((field) => {
        if (field in sampleData) {
          filteredData[field] = sampleData[field];
        }
      });

      setFormState((prev: any) => ({
        ...prev,
        ...filteredData,
      }));
    },
    [formType]
  );

  /**
   * Fill with custom transformations
   */
  const fillWithTransform = useCallback(
    (
      transform: (data: any) => any,
      setFormState: (data: any) => void,
      options?: FillOptions
    ) => {
      const sampleData = getSampleData(formType);
      const transformedData = transform(sampleData);
      fillSampleData(transformedData, setFormState, options);
    },
    [formType, fillSampleData]
  );

  return {
    fillSampleData,
    getSample,
    fillDirect,
    fillFields,
    fillWithTransform,
    isSampleMode: sampleMode.isActive,
    sampleMode,
    clearSampleMode,
  };
}

/**
 * CALCULATION-AWARE HOOK: For forms with complex calculations
 * 
 * Usage:
 * ```tsx
 * const { fillSampleData } = useSampleDataWithCalculations('yarn-receipt', {
 *   calculateTotal: calculateTotalAmount,
 *   calculateTax: calculateGST,
 *   calculateStock: updateStockImpact
 * });
 * ```
 */
export function useSampleDataWithCalculations(
  formType: FormType,
  calculations: Record<string, () => void>
) {
  const { fillSampleData: baseFill, getSample, isSampleMode, clearSampleMode } = 
    useSampleDataAdvanced(formType);

  /**
   * Fill and trigger all calculations
   */
  const fillSampleData = useCallback(
    (sampleData: any, setFormState: (data: any) => void) => {
      baseFill(sampleData, setFormState, {
        onCalculate: () => {
          // Trigger all calculations sequentially
          Object.entries(calculations).forEach(([name, fn]) => {
            try {
              fn();
              console.log(`✓ Calculation: ${name}`);
            } catch (error) {
              console.error(`✗ Calculation failed: ${name}`, error);
            }
          });
        },
        showToast: true,
      });
    },
    [baseFill, calculations]
  );

  return {
    fillSampleData,
    getSample,
    isSampleMode,
    clearSampleMode,
  };
}
