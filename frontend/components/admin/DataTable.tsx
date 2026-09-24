import { ReactNode } from "react";
import EmptyState from "./EmptyState";
import TableSkeleton from "./TableSkeleton";

/**
 * Describes one column.
 *
 * `render` is optional: when given, the table calls it instead of printing the
 * raw value. That is how we will later show buttons, badges or images in a cell
 * without changing this component.
 */
export type Column<T> = {
  header: string;
  /** Key of the row object to display, e.g. "name". */
  accessor?: keyof T;
  /** Custom cell content, e.g. Edit/Delete buttons. */
  render?: (row: T) => ReactNode;
  className?: string;
};

/**
 * Reusable admin table.
 *
 * `<T extends { id: string }>` is a GENERIC: the table works with any row shape
 * as long as it has an `id` (used as the React key). This one component will
 * serve products, categories, users, carts and wishlists.
 *
 * It also owns the three states every list needs: loading, empty, and data.
 */
export default function DataTable<T extends { id: string }>({
  columns,
  rows,
  isLoading = false,
  emptyMessage = "No records found.",
  emptyState,
}: {
  columns: Column<T>[];
  rows: T[];
  isLoading?: boolean;
  /** Simple one-line empty text. */
  emptyMessage?: string;
  /** A full <EmptyState /> with a description and action; wins over emptyMessage. */
  emptyState?: ReactNode;
}) {
  if (isLoading) {
    return <TableSkeleton columns={columns.length} rows={5} />;
  }

  if (rows.length === 0) {
    return emptyState ?? <EmptyState title={emptyMessage} />;
  }

  return (
    // overflow-x-auto lets a wide table scroll sideways on phones instead of
    // breaking the page layout. This is what keeps the admin responsive.
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/60">
          <tr>
            {columns.map((column) => (
              <th
                key={column.header}
                className={`px-4 py-3 font-medium ${column.className ?? ""}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-zinc-100 transition last:border-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
            >
              {columns.map((column) => (
                <td
                  key={column.header}
                  className={`px-4 py-3 ${column.className ?? ""}`}
                >
                  {column.render
                    ? column.render(row)
                    : // String() guards against numbers/undefined being rendered
                      String(column.accessor ? row[column.accessor] : "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
