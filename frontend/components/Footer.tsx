/**
 * Site-wide footer. Rendered by the root layout so it shows on every page.
 */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-zinc-500">
        <p>© {year} TynocStore. Built for the internship project.</p>
      </div>
    </footer>
  );
}
