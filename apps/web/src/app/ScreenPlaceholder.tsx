import { Kicker } from "../ui";

interface ScreenPlaceholderProps {
  title: string;
  kicker?: string;
}

/** Temporary stand-in while each Phase 2 screen is built. */
export function ScreenPlaceholder({ title, kicker = "Coming soon" }: ScreenPlaceholderProps) {
  return (
    <section className="content">
      <div className="page-h">
        <div>
          <Kicker>{kicker}</Kicker>
          <h1 className="h1 disp">{title}</h1>
          <div className="h1s">
            This screen is being built in Phase 2 of the implementation plan.
          </div>
        </div>
      </div>
    </section>
  );
}
