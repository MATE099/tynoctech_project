import type { ReactNode } from "react";

/**
 * Shown when a list has nothing to display.
 *
 * A good empty state answers two questions: why is this empty, and what can
 * I do about it? `description` covers the first and `action` the second
 * (e.g. an "Add product" link, or "Clear filters" when a search found nothing).
 */
export default function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
      <p className="font-medium text-zinc-800 dark:text-zinc-200">{title}</p>
      {description && (
        <p className="mt-1 max-w-md text-sm text-zinc-500">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Link styles shared by empty-state actions, so they look like buttons. */
export const emptyActionClass =
  "inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700";

export const emptySecondaryActionClass =
  "inline-flex items-center rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800";
