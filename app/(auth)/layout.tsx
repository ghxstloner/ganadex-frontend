import type { ReactNode } from "react";
import Image from "next/image";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Form */}
      <div className="relative flex w-full flex-col lg:w-1/2">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100" />
        
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
        <div className="absolute inset-0 bg-black/10" />
      </div>
    </div>
  );
}
