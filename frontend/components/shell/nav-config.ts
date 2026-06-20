import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CalendarClock,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileText,
  Home,
  LayoutGrid,
  Mic,
  Settings,
  Stethoscope,
  Users,
  UserCircle,
} from "lucide-react";
import type { User } from "@/types/models";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  doctorOnly?: boolean;
}

export const primaryNav: NavItem[] = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Appointments", href: "/appointments", icon: CalendarDays },
  { label: "Record", href: "/record", icon: Mic },
  { label: "Reports", href: "/reports", icon: FileText },
];

export const secondaryNav: NavItem[] = [
  { label: "Patients", href: "/patients", icon: Users },
  { label: "Templates", href: "/templates", icon: ClipboardList, doctorOnly: true },
  { label: "Transcripts", href: "/transcripts", icon: LayoutGrid },
  { label: "Clinics", href: "/clinics", icon: Building2 },
  { label: "Availability", href: "/availability", icon: CalendarClock },
];

export const accountNav: NavItem[] = [
  { label: "Profile", href: "/profile", icon: UserCircle },
  { label: "Subscription", href: "/subscription", icon: CreditCard },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function filterByRole(items: NavItem[], user: User | null | undefined) {
  if (!user) return items;
  return items.filter((item) => !item.doctorOnly || user.role === "doctor");
}

export const BrandIcon = Stethoscope;

export function getMobilePrimaryNav(): NavItem[] {
  return [
    { label: "Home", href: "/home", icon: Home },
    { label: "Appts", href: "/appointments", icon: CalendarDays },
    { label: "Record", href: "/record", icon: Mic },
    { label: "Reports", href: "/reports", icon: FileText },
  ];
}
