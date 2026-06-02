/**
 * ═══════════════════════════════════════════════════════════════════
 * GLOBAL FILL SAMPLE DATA BUTTON - ENTERPRISE EDITION
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Universal button for filling sample data across entire ERP
 * 
 * Features:
 * - Environment-controlled visibility
 * - Role-based access (SuperAdmin/Admin)
 * - API-driven sample data (ensures valid foreign keys)
 * - Audit logging
 * - Professional UI with icons and badges
 * - Toast notifications
 * 
 * Usage:
 * ```tsx
 * <FillSampleDataButton
 *   formType="yarn-receipt"
 *   onFillData={(data) => {
 *     setFormData(data);
 *     calculateTotals();
 *   }}
 * />
 * ```
 * 
 * ═══════════════════════════════════════════════════════════════════
 */

'use client';

import { useState } from 'react';
import { Zap, FlaskConical, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { isSampleDataAllowed, getSampleData, logSampleDataUsage, type FormType } from '@/lib/sample-data';
import { useAuth } from '@/lib/auth-context';
import apiClient from '@/lib/api-client';

// Map form types to API endpoints
const SAMPLE_DATA_ENDPOINTS: Record<string, string> = {
  'yarn-receipt': '/api/sampledata/yarn-receipt',
  'baby-cone': '/api/sampledata/baby-cone',
  'yarn-return': '/api/sampledata/yarn-return',
  'yarn-delivery': '/api/sampledata/yarn-delivery',
  'sizing-job-card': '/api/sampledata/sizing-job-card',
  'warping-job-card': '/api/sampledata/warping-job-card',
  'beam': '/api/sampledata/beam',
  'beam-management': '/api/sampledata/beam',
};

interface FillSampleDataButtonProps {
  formType: FormType;
  onFillData: (data: any) => void;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showBadge?: boolean;
  customLabel?: string;
  useApi?: boolean; // Whether to fetch from API or use local data
}

/**
 * Universal Fill Sample Data Button
 * 
 * Features:
 * - Only visible in dev/staging OR for SuperAdmin/Admin
 * - Fills ALL fields with valid, save-ready data
 * - Triggers calculations and validations
 * - Ensures successful save
 * - Logs usage for audit trail
 */
export function FillSampleDataButton({
  formType,
  onFillData,
  className = '',
  variant = 'outline',
  size = 'default',
  showBadge = true,
  customLabel,
  useApi = true,
}: FillSampleDataButtonProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Check if sample data is allowed
  const isAllowed = isSampleDataAllowed(user?.roleName);

  // Don't render if not allowed
  if (!isAllowed) {
    return null;
  }

  const handleFillSampleData = async () => {
    setIsLoading(true);
    
    try {
      let sampleData: any = null;

      // Try API first for supported modules
      const endpoint = SAMPLE_DATA_ENDPOINTS[formType];
      if (useApi && endpoint) {
        try {
          const response = await apiClient.get<any>(endpoint);
          if (response.success && response.data) {
            sampleData = response.data;
          }
        } catch (apiError) {
          console.warn('API sample data not available, falling back to local:', apiError);
        }
      }

      // Fallback to local sample data
      if (!sampleData) {
        const localData = getSampleData(formType);
        if (typeof localData === 'function') {
          sampleData = await localData();
        } else {
          sampleData = localData;
        }
      }
      
      if (!sampleData || Object.keys(sampleData).length === 0) {
        toast.error('No sample data available for this form', {
          description: 'Please ensure master data exists in the system',
        });
        return;
      }

      // Log usage for audit trail
      logSampleDataUsage(formType, user?.fullName);

      // Call the provided callback with sample data
      onFillData(sampleData);
      
      // Show success notification
      toast.success('⚡ Sample data filled successfully', {
        description: (
          <div className="space-y-1">
            <p>All fields populated with test data</p>
            <p className="text-xs opacity-70">Module: {formType.toUpperCase()}</p>
            {showBadge && (
              <Badge variant="outline" className="mt-1 bg-yellow-50 text-yellow-700 border-yellow-300">
                <FlaskConical className="h-3 w-3 mr-1" />
                SAMPLE MODE
              </Badge>
            )}
          </div>
        ),
        duration: 4000,
      });
    } catch (error) {
      console.error('Error filling sample data:', error);
      toast.error('Failed to fill sample data', {
        description: 'Please contact support if this persists',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const label = customLabel || 'Fill Sample Data';

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleFillSampleData}
      disabled={isLoading}
      className={`gap-2 ${className}`}
      title="Fill form with sample data (QA/Demo/UAT mode)"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Zap className="h-4 w-4" />
      )}
      {label}
      {showBadge && size !== 'icon' && (
        <Badge variant="grey" className="ml-1 text-xs">
          QA
        </Badge>
      )}
    </Button>
  );
}

/**
 * Compact version - icon only
 */
export function FillSampleDataIconButton({
  formType,
  onFillData,
  className = '',
}: Omit<FillSampleDataButtonProps, 'variant' | 'size'>) {
  return (
    <FillSampleDataButton
      formType={formType}
      onFillData={onFillData}
      variant="ghost"
      size="icon"
      className={className}
    />
  );
}

