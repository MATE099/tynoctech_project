/** Shown when an admin page cannot load its data (e.g. DynamoDB is offline). */
export default function ErrorState({
  title = "Something went wrong",
  message,
}: {
  title?: string;
  message: string;
}) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center dark:border-red-900 dark:bg-red-950/40"
    >
      <p className="font-medium text-red-800 dark:text-red-300">{title}</p>
      <p className="mt-1 text-sm text-red-700 dark:text-red-400">{message}</p>
    </div>
  );
}
