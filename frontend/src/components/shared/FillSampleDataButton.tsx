/**
 * Global Fill Sample Data Button Component
 * Reusable across all ERP modules
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { canUseSampleData } from '@/lib/utils/sampleData';

interface FillSampleDataButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
}

export function FillSampleDataButton({
  onClick,
  loading = false,
  disabled = false,
  variant = 'outline',
  size = 'default',
}: FillSampleDataButtonProps) {
  // Only show for SuperAdmin or non-production
  if (!canUseSampleData()) {
    return null;
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled || loading}
      className="gap-2"
    >
      <Sparkles className="h-4 w-4" />
      {loading ? 'Filling...' : '⚡ Fill Sample Data (QA)'}
    </Button>
  );
}

export default FillSampleDataButton;

