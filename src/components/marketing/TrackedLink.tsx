"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { track, type LandingEvent } from "@/lib/analytics";

type Props = Omit<ComponentProps<typeof Link>, "href" | "onClick"> & {
  href: ComponentProps<typeof Link>["href"];
  event: LandingEvent;
  properties?: Record<string, string | number>;
};

export function TrackedLink({ href, event, properties, children, ...rest }: Props) {
  return (
    <Link href={href} onClick={() => track(event, properties)} {...rest}>
      {children}
    </Link>
  );
}
