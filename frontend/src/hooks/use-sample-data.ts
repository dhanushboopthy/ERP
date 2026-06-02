import { useCallback } from 'react';
import { getSampleData, type FormType } from '@/lib/sample-data';

/**
 * Hook for integrating sample data into forms
 * 
 * Usage:
 * ```tsx
 * const { fillSampleData } = useSampleData('company');
 * 
 * // In your component:
 * <FillSampleDataButton 
 *   formType="company"
 *   onFillData={(data) => fillSampleData(data, setFormData)}
 * />
 * ```
 */
export function useSampleData(formType: FormType) {
  /**
   * Fill sample data into form state
   * @param sampleData - The sample data to fill
   * @param setFormState - State setter function (from useState)
   */
  const fillSampleData = useCallback(
    (sampleData: any, setFormState: (data: any) => void) => {
      setFormState((prev: any) => ({
        ...prev,
        ...sampleData,
      }));
    },
    []
  );

  /**
   * Get sample data for this form type
   */
  const getSample = useCallback(() => {
    return getSampleData(formType);
  }, [formType]);

  /**
   * Fill directly without needing the data
   * Useful for simple forms
   */
  const fillDirect = useCallback(
    (setFormState: (data: any) => void) => {
      const data = getSampleData(formType);
      fillSampleData(data, setFormState);
    },
    [formType, fillSampleData]
  );

  return {
    fillSampleData,
    getSample,
    fillDirect,
  };
}

/**
 * Hook for forms with multiple nested objects
 * Allows selective filling of specific sections
 */
export function useSampleDataAdvanced(formType: FormType) {
  const { fillSampleData, getSample } = useSampleData(formType);

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
   * Fill all except specific fields
   */
  const fillExcept = useCallback(
    (
      excludeFields: string[],
      setFormState: (updater: (prev: any) => any) => void
    ) => {
      const sampleData = getSampleData(formType);
      const filteredData = { ...sampleData };

      excludeFields.forEach((field) => {
        delete filteredData[field];
      });

      fillSampleData(filteredData, setFormState);
    },
    [formType, fillSampleData]
  );

  return {
    fillSampleData,
    getSample,
    fillFields,
    fillExcept,
  };
}
