import React from 'react';
import * as LucideIcons from 'lucide-react';

/**
 * Centralized Icon Component
 * 
 * Usage options:
 * 1. Using Component with name prop:
 *    import Icon from '@/components/Icon';
 *    <Icon name="Search" size={18} className="w-4 h-4" />
 * 
 * 2. Importing named icon from centralized file:
 *    import { Search, User } from '@/components/Icon';
 *    <Search size={18} />
 */

const normalizeIconName = (name) => {
  if (!name) return null;
  if (LucideIcons[name]) return name;

  // Convert kebab-case or camelCase or lowercase to PascalCase
  const pascal = name
    .replace(/(?:^|-|_)([a-z0-9])/g, (_, char) => char.toUpperCase());

  return LucideIcons[pascal] ? pascal : name;
};

export const Icon = ({ name, size = 18, color, className = '', ...props }) => {
  if (!name) return null;

  const iconName = normalizeIconName(name);
  const IconComponent = LucideIcons[iconName];

  if (!IconComponent) {
    console.warn(`Icon "${name}" (normalized: "${iconName}") was not found in icon registry.`);
    return null;
  }

  return (
    <IconComponent 
      size={size} 
      color={color} 
      className={className} 
      {...props} 
    />
  );
};

// Re-export icon components for centralized imports across the application
export const {
  LayoutDashboard, 
  Bell, 
  Building2, 
  User, 
  Inbox, 
  Monitor, 
  Calendar, 
  Search, 
  RotateCw, 
  Volume2, 
  CheckCheck, 
  Trash2, 
  Sun, 
  Moon, 
  Info, 
  Sliders, 
  Layers,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  PinOff,
  Settings,
  Plus,
  Edit2,
  Save,
  FileSpreadsheet,
  RefreshCw,
  AlertTriangle,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  Key,
  Edit,
  FileCheck,
  MapPin,
  UserPlus,
  Briefcase,
  FileText,
  HelpCircle,
  Database
} = LucideIcons;

export default Icon;
