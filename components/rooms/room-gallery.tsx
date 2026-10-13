"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface RoomGalleryProps {
  images: string[];
  roomName: string;
}

/**
 * Category imagery with a thumbnail rail. The active image is tracked in local
 * state so guests can move between views without leaving the page.
 */
export function RoomGallery({ images, roomName }: RoomGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? images[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="frame relative aspect-[16/11] w-full">
        <Image
          key={activeImage}
          src={activeImage}
          alt={`${roomName} — view ${activeIndex + 1} of ${images.length}`}
          fill
          priority
          sizes="(min-width: 1024px) 62vw, 100vw"
          className="fade-in object-cover"
        />
        <span className="absolute left-0 top-0 bg-ivory/92 px-3 py-2 text-[0.62rem] font-medium uppercase tracking-[0.22em] text-charcoal backdrop-blur-sm">
          {activeIndex + 1} / {images.length}
        </span>
      </div>

      {images.length > 1 ? (
        <ul className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {images.map((image, index) => {
            const active = index === activeIndex;
            return (
              <li key={image}>
                <button
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Show view ${index + 1} of ${roomName}`}
                  aria-current={active}
                  className={cn(
                    "frame relative block aspect-[4/3] w-full border transition-all duration-300",
                    active ? "border-bronze" : "border-transparent hover:border-charcoal/30",
                  )}
                >
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes="120px"
                    className={cn(
                      "object-cover transition-opacity duration-300",
                      active ? "opacity-100" : "opacity-70 hover:opacity-100",
                    )}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
