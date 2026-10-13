"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger in milliseconds, applied as a transition delay. */
  delay?: number;
  as?: "div" | "section" | "article" | "li" | "header" | "footer";
}

/**
 * Adds a gentle fade-and-rise entrance the first time an element scrolls into
 * view. Motion is defined in globals.css behind a
 * `prefers-reduced-motion: no-preference` query, so reduced-motion users simply
 * see the content immediately.
 *
 * The observer writes `data-visible` straight onto the node instead of holding
 * it in React state, which keeps the reveal out of the render path.
 */
export function Reveal({ children, className, delay = 0, as = "div" }: RevealProps) {
  const Tag = as;
  const node = useRef<HTMLElement | null>(null);

  const setNode = useCallback((element: HTMLElement | null) => {
    node.current = element;
  }, []);

  useEffect(() => {
    const element = node.current;
    if (!element) return;

    if (typeof IntersectionObserver === "undefined") {
      element.dataset.visible = "true";
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            element.dataset.visible = "true";
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={setNode}
      data-visible="false"
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn("reveal", className)}
    >
      {children}
    </Tag>
  );
}
