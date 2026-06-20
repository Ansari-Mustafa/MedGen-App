import { CalendarClock } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export default function AvailabilityPage() {
  return (
    <ComingSoon
      title="Availability"
      description="Set your weekly schedule and time off."
      icon={CalendarClock}
    />
  );
}
