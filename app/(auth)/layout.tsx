import type { ReactNode } from "react";
import Image from "next/image";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Form */}
      <div className="relative flex w-full flex-col lg:w-1/2">
        {/* Theme toggle - top right corner */}
        <div className="absolute right-6 top-6 z-10">
          <ThemeToggle />
        </div>

        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800" />

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
        <div className="absolute inset-0 bg-black/10 dark:bg-black/20" />
      </div>
    </div>
  );
}
