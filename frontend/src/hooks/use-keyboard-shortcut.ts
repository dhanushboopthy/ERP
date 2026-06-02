import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  callback: () => void;
  description?: string;
}

export function useKeyboardShortcut(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.key || typeof event.key !== 'string') return;
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl === undefined || shortcut.ctrl === (event.ctrlKey || event.metaKey);
        const shiftMatch = shortcut.shift === undefined || shortcut.shift === event.shiftKey;
        const altMatch = shortcut.alt === undefined || shortcut.alt === event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          event.preventDefault();
          shortcut.callback();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// Common shortcut presets
export const commonShortcuts = {
  save: (callback: () => void) => ({ key: 's', ctrl: true, callback, description: 'Save' }),
  cancel: (callback: () => void) => ({ key: 'Escape', callback, description: 'Cancel' }),
  create: (callback: () => void) => ({ key: 'n', ctrl: true, callback, description: 'New' }),
  search: (callback: () => void) => ({ key: 'f', ctrl: true, callback, description: 'Search' }),
  refresh: (callback: () => void) => ({ key: 'r', ctrl: true, callback, description: 'Refresh' }),
  delete: (callback: () => void) => ({ key: 'Delete', callback, description: 'Delete' }),
  edit: (callback: () => void) => ({ key: 'e', ctrl: true, callback, description: 'Edit' }),
  export: (callback: () => void) => ({ key: 'e', ctrl: true, shift: true, callback, description: 'Export' }),
};
