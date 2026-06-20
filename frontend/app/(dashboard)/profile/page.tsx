"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth-store";
import { updateMe } from "@/lib/api/endpoints/me";
import { extractApiError } from "@/lib/utils/errors";
import { getAvatarColor, getInitials } from "@/lib/utils/format";

const schema = z.object({
  full_name: z.string().min(1, "Required"),
  phone: z.string().optional().or(z.literal("")),
});
type FormData = z.infer<typeof schema>;

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", phone: "" },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        full_name: user.full_name,
        phone: user.phone ?? "",
      });
    }
  }, [user, form]);

  const update = useMutation({
    mutationFn: (data: FormData) =>
      updateMe({ full_name: data.full_name, phone: data.phone || undefined }),
    onSuccess: (u) => {
      setUser(u);
      toast.success("Profile updated");
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  if (!user) return null;

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account details.
        </p>
      </header>

      <Card>
        <CardContent className="flex items-center gap-4 p-5">
          <Avatar className="h-16 w-16">
            <AvatarFallback
              style={{ backgroundColor: getAvatarColor(user.full_name) }}
              className="text-lg"
            >
              {getInitials(user.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <span className="text-base font-semibold">{user.full_name}</span>
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Badge variant="secondary" className="self-start capitalize">
              {user.role}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 md:p-6">
          <form
            onSubmit={form.handleSubmit((d) => update.mutate(d))}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" {...form.register("full_name")} />
              {form.formState.errors.full_name && (
                <p className="text-xs text-error">
                  {form.formState.errors.full_name.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" {...form.register("phone")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Email</Label>
              <Input value={user.email ?? ""} disabled />
              <p className="text-xs text-muted-foreground">
                Email is managed in your sign-in settings.
              </p>
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={update.isPending}>
                {update.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
