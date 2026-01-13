import type { ReactNode } from "react";
import Image from "next/image";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Left side - Form */}
      <div className="relative flex w-full flex-col overflow-hidden lg:w-1/2">
        {/* Theme toggle - top right corner */}
        <div className="absolute right-6 top-6 z-10">
          <ThemeToggle />
        </div>

        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/20 dark:from-primary/15 dark:via-background dark:to-secondary/25" />
        <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-secondary/25 blur-3xl" />

        {/* Content */}
        <div className="relative flex flex-1 flex-col">
          {children}
        </div>
      </div>

      {/* Right side - Image (hidden on mobile) */}
      <div className="relative hidden lg:block lg:w-1/2">
        <Image
          src="/login/vertical-image.jpg"
          alt="Decorative background"
          fill
          className="object-cover"
          priority
        />
        {/* Overlay for better text contrast if needed */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-black/10 to-black/30 dark:from-black/30 dark:via-black/20 dark:to-black/50" />
      </div>
    </div>
  );
}
