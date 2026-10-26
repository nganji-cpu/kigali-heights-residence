import { NotFoundState } from "@/components/ui/not-found-state";

export default function NotFound() {
  return (
    <section className="bg-ivory py-24 lg:py-32">
      <div className="shell">
        <NotFoundState
          eyebrow="404 · Page not found"
          title="We could not find that part of the residence."
          description="The page may have moved, or the link may be out of date. Try the apartment list, or head back to the entrance."
          primary={{ href: "/rooms", label: "Browse apartments" }}
          secondary={{ href: "/", label: "Back to home" }}
        />
      </div>
    </section>
  );
}
