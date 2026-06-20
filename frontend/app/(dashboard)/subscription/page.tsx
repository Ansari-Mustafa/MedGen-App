import { CreditCard } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export default function SubscriptionPage() {
  return (
    <ComingSoon
      title="Subscription"
      description="Manage your plan and billing."
      icon={CreditCard}
    />
  );
}
