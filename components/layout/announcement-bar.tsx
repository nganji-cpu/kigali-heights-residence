import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { announcement } from "@/data/site";

/**
 * Thin strip above the navigation. Communicates the concept and location
 * without claiming the property is operating.
 */
export function AnnouncementBar() {
  return (
    <div className="bg-ink text-ivory">
      <div className="shell flex min-h-10 flex-wrap items-center justify-center gap-x-4 gap-y-1 py-2 text-center">
        <span className="text-[0.66rem] font-medium uppercase tracking-[0.24em] text-ivory/75 sm:text-[0.68rem]">
          {announcement.text}
        </span>
        <span aria-hidden="true" className="hidden h-3 w-px bg-ivory/25 sm:block" />
        <Link
          href={announcement.link.href}
          className="group inline-flex items-center gap-1.5 text-[0.66rem] font-medium uppercase tracking-[0.24em] text-bronze-soft underline-offset-4 hover:text-ivory hover:underline sm:text-[0.68rem]"
        >
          {announcement.link.label}
          <ArrowRight
            aria-hidden="true"
            className="size-3 transition-transform duration-300 group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </div>
  );
}
