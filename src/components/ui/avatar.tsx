// =============================================================================
// Avatar Component
// LR AI Hub Design System
// =============================================================================

"use client";

import React, { forwardRef, useState, type HTMLAttributes } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type AvatarSize = "xs" | "sm" | "md" | "lg";
export type AvatarStatus = "online" | "offline" | "busy" | "away" | null;

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  /** Full name used to generate initials when no image is provided */
  name?: string;
  /** Image source URL */
  src?: string | null;
  /** Alt text for the image */
  alt?: string;
  /** Size variant */
  size?: AvatarSize;
  /** Online status indicator */
  status?: AvatarStatus;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/** Extract up to 2 initials from a name string */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

/** Deterministic color based on name string */
const avatarBackgrounds = [
  "bg-lr-green-100 text-lr-green-700",
  "bg-lr-gold-100 text-lr-gold-800",
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-orange-100 text-orange-700",
  "bg-teal-100 text-teal-700",
  "bg-pink-100 text-pink-700",
  "bg-indigo-100 text-indigo-700",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarBackgrounds[Math.abs(hash) % avatarBackgrounds.length] ?? avatarBackgrounds[0]!;
}

// -----------------------------------------------------------------------------
// Size Styles
// -----------------------------------------------------------------------------

const sizeStyles: Record<AvatarSize, { container: string; text: string; status: string }> = {
  xs: {
    container: "h-6 w-6",
    text: "text-[0.625rem] font-semibold",
    status: "h-2 w-2 ring-[1.5px]",
  },
  sm: {
    container: "h-8 w-8",
    text: "text-caption font-semibold",
    status: "h-2.5 w-2.5 ring-2",
  },
  md: {
    container: "h-10 w-10",
    text: "text-body-sm font-bold",
    status: "h-3 w-3 ring-2",
  },
  lg: {
    container: "h-14 w-14",
    text: "text-title-sm font-bold",
    status: "h-3.5 w-3.5 ring-2",
  },
};

const statusColors: Record<NonNullable<AvatarStatus>, string> = {
  online: "bg-lr-green-500",
  offline: "bg-surface-400",
  busy: "bg-error",
  away: "bg-warning",
};

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, name = "", src, alt, size = "md", status = null, ...props }, ref) => {
    const [imgError, setImgError] = useState(false);
    const showImage = src && !imgError;
    const styles = sizeStyles[size];
    const initials = name ? getInitials(name) : "?";
    const colorClass = name ? getAvatarColor(name) : "bg-surface-200 text-surface-500";

    return (
      <div ref={ref} className={cn("relative inline-flex shrink-0", className)} {...props}>
        {/* Avatar Circle */}
        <div
          className={cn(
            "relative flex items-center justify-center overflow-hidden rounded-full",
            styles.container,
            !showImage && colorClass
          )}
          role="img"
          aria-label={alt || name || "Avatar"}
        >
          {showImage ? (
            <Image
              src={src as string}
              alt={alt || name || "Avatar"}
              onError={() => setImgError(true)}
              className="h-full w-full object-cover"
              fill
              sizes="56px"
              unoptimized
            />
          ) : (
            <span className={cn("select-none leading-none", styles.text)}>
              {initials}
            </span>
          )}
        </div>

        {/* Status Indicator */}
        {status && (
          <span
            className={cn(
              "absolute bottom-0 right-0 rounded-full ring-white",
              styles.status,
              statusColors[status]
            )}
            aria-label={`Status: ${status}`}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";
