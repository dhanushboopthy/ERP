/**
 * Navigation Progress Bar
 * Shows a loading bar at the top during route transitions
 */

'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export function NavigationProgress() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Start progress when pathname changes
    setIsNavigating(true);
    setProgress(20);

    // Simulate progress
    const timer1 = setTimeout(() => setProgress(60), 100);
    const timer2 = setTimeout(() => setProgress(80), 200);
    const timer3 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => setIsNavigating(false), 200);
    }, 500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [pathname]);

  return (
    <AnimatePresence>
      {isNavigating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 shadow-lg"
          style={{
            width: `${progress}%`,
            transition: 'width 0.3s ease-out',
          }}
        >
          <div className="absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-white/30 to-transparent" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
