/**
 * ═══════════════════════════════════════════════════════════════════
 * SAMPLE MODE BADGE COMPONENT
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Visual indicator showing when a form contains sample data
 * 
 * Features:
 * - Persistent badge while in sample mode
 * - Professional styling
 * - Clear visual distinction from production data
 * - Auto-dismissible option
 * 
 * Usage:
 * ```tsx
 * const [sampleMode, setSampleMode] = useState(false);
 * 
 * return (
 *   <>
 *     {sampleMode && <SampleModeBadge onClear={() => setSampleMode(false)} />}
 *   </>
 * );
 * ```
 * 
 * ═══════════════════════════════════════════════════════════════════
 */

'use client';

import { FlaskConical, X, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface SampleModeBadgeProps {
  formType?: string;
  filledAt?: Date;
  onClear?: () => void;
  variant?: 'default' | 'compact' | 'floating';
  position?: 'top' | 'bottom' | 'inline';
  showWarning?: boolean;
}

/**
 * Sample Mode Badge
 * 
 * Shows visual indicator that form contains sample data
 * Helps prevent confusion between test and real data
 */
export function SampleModeBadge({
  formType,
  filledAt,
  onClear,
  variant = 'default',
  position = 'top',
  showWarning = true,
}: SampleModeBadgeProps) {
  const getBadgeContent = () => {
    switch (variant) {
      case 'compact':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 gap-1">
            <FlaskConical className="h-3 w-3" />
            SAMPLE
          </Badge>
        );

      case 'floating':
        return (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-yellow-50 border-2 border-yellow-300 rounded-lg shadow-lg p-4 max-w-sm"
          >
            <div className="flex items-start gap-3">
              <FlaskConical className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-yellow-900">SAMPLE MODE</span>
                  {showWarning && (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  )}
                </div>
                <p className="text-sm text-yellow-700">
                  This form contains test data for QA/UAT/Demo purposes
                </p>
                {formType && (
                  <p className="text-xs text-yellow-600 mt-1">
                    Module: {formType.toUpperCase()}
                  </p>
                )}
                {filledAt && (
                  <p className="text-xs text-yellow-600">
                    Filled: {new Date(filledAt).toLocaleTimeString()}
                  </p>
                )}
              </div>
              {onClear && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onClear}
                  className="h-6 w-6 text-yellow-600 hover:text-yellow-900 hover:bg-yellow-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </motion.div>
        );

      default:
        return (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`bg-yellow-50 border-l-4 border-yellow-400 p-4 ${
              position === 'bottom' ? 'mt-4' : 'mb-4'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FlaskConical className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-yellow-900">SAMPLE MODE ACTIVE</span>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-400 text-xs">
                      QA/UAT/DEMO
                    </Badge>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    This form contains test data. Save will create sample records.
                  </p>
                  {formType && (
                    <p className="text-xs text-yellow-600 mt-1">
                      Module: {formType.toUpperCase()}
                      {filledAt && ` • Filled at ${new Date(filledAt).toLocaleTimeString()}`}
                    </p>
                  )}
                </div>
              </div>
              {onClear && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onClear}
                  className="gap-2 border-yellow-400 text-yellow-700 hover:bg-yellow-100"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </motion.div>
        );
    }
  };

  return (
    <AnimatePresence>
      {getBadgeContent()}
    </AnimatePresence>
  );
}

/**
 * Inline Sample Mode Indicator
 * For showing in headers, titles, etc.
 */
export function InlineSampleBadge() {
  return (
    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 gap-1 ml-2">
      <FlaskConical className="h-3 w-3" />
      SAMPLE
    </Badge>
  );
}

