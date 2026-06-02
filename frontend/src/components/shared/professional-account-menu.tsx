'use client';

import { User, Settings, LogOut, UserCircle } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';

/**
 * Professional Account Menu Component
 * Enterprise-grade dropdown menu for user account actions
 * 
 * Features:
 * - Clean, professional design with subtle hover effects
 * - Icon-text combination for clarity
 * - Proper visual hierarchy with separators
 * - Logout action highlighted in red
 * - Responsive and accessible
 */
export function ProfessionalAccountMenu() {
  const { user, logout } = useAuth();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 rounded-full hover:bg-blue-50 focus:bg-blue-50 focus:ring-2 focus:ring-blue-200 transition-colors"
          aria-label="Account menu"
        >
          <UserCircle className="h-5 w-5 text-gray-700" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-64 bg-white border-gray-200 shadow-xl rounded-lg overflow-hidden p-0"
      >
        {/* Header with user name */}
        <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-gray-200">
          <div className="flex flex-col space-y-0.5">
            <p className="text-sm font-semibold text-gray-900">
              {user?.fullName || 'User Account'}
            </p>
            <p className="text-xs text-gray-500">
              {user?.roleName || user?.email || ''}
            </p>
          </div>
        </div>

        <div className="py-2">
          {/* Profile Settings */}
          <Link 
            href="/settings/profile"
            className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all cursor-pointer group"
          >
            <User className="mr-3 h-4 w-4 group-hover:text-blue-600" />
            <span className="font-medium">Profile Settings</span>
          </Link>

          {/* System Settings */}
          <Link 
            href="/settings/system"
            className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all cursor-pointer group"
          >
            <Settings className="mr-3 h-4 w-4 group-hover:text-blue-600" />
            <span className="font-medium">System Settings</span>
          </Link>
        </div>

        <div className="h-px bg-gray-200 my-1" />

        {/* Logout */}
        <button 
          onClick={logout}
          className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-all cursor-pointer group"
        >
          <LogOut className="mr-3 h-4 w-4 group-hover:text-red-700" />
          <span className="font-medium">Logout</span>
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
