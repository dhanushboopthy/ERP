'use client';

import * as React from 'react';
import { Lock } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

interface PermissionButtonProps extends ButtonProps {
  /** Permission code required to enable this button e.g. "YARN_RECEIPT.CREATE" */
  permission: string;
  /** Message shown in toast when permission is missing */
  deniedMessage?: string;
}

/**
 * A Button that is visually disabled and shows a toast when the user
 * lacks the required permission.  Drop-in replacement for <Button>.
 */
export function PermissionButton({
  permission,
  deniedMessage = "You don't have permission to perform this action. Please contact your administrator.",
  onClick,
  children,
  ...props
}: PermissionButtonProps) {
  const { hasPermission } = useAuth();
  const allowed = hasPermission(permission);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!allowed) {
      e.stopPropagation();
      toast.error(deniedMessage, {
        icon: <Lock className="h-4 w-4" />,
        duration: 4000,
      });
      return;
    }
    onClick?.(e);
  };

  return (
    <Button
      {...props}
      onClick={handleClick}
      /* Keep original variant but dim it when no permission */
      className={allowed ? props.className : `${props.className ?? ''} opacity-50 cursor-not-allowed`}
      aria-disabled={!allowed}
    >
      {!allowed && <Lock className="mr-1.5 h-3.5 w-3.5 opacity-70" />}
      {children}
    </Button>
  );
}
