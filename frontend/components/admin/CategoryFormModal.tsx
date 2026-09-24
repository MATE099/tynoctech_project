"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useState } from "react";
import Modal from "./Modal";
import { slugify } from "../../lib/slug";
import type { CategoryField } from "../../lib/validations/category";
import { Category } from "../../types";

const inputClass =
  "w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-600 dark:bg-zinc-900";

/** The id ties the footer's submit button to the form inside the dialog. */
const FORM_ID = "category-form";

type FieldErrors = Partial<Record<CategoryField, string[]>>;

function Field({
  id,
  label,
  hint,
  errors,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  errors?: string[];
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {children}
      {errors?.length ? (
        <p id={`${id}-error`} className="text-sm text-red-600 dark:text-red-400">
          {errors[0]}
        </p>
      ) : (
        hint && <p className="text-xs text-zinc-500">{hint}</p>
      )}
    </div>
  );
}

/**
 * Add/Edit category dialog, talking to the JSON API.
 *
 * Products use a full page with a Server Action; categories are small enough
 * to edit without leaving the list, so this uses a modal plus `fetch`. Both
 * end up in the same service layer, so the rules are identical.
 *
 * The parent mounts this only while it is open, which means the inputs start
 * from `category` (edit) or empty (create) every single time.
 */
export default function CategoryFormModal({
  category,
  onClose,
}: {
  /** Provided when editing; omitted when creating. */
  category?: Category;
  onClose: () => void;
}) {
  const router = useRouter();
  const isEdit = Boolean(category);

  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  // Once the admin edits the slug by hand we stop overwriting it from the name.
  const [slugEdited, setSlugEdited] = useState(false);

  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: React.FormEvent) {
    // Stop the browser's own submit; we send the data with fetch instead.
    event.preventDefault();
    setIsPending(true);
    setMessage(null);
    setFieldErrors({});

    try {
      const response = await fetch(
        isEdit
          ? `/api/admin/categories/${encodeURIComponent(category!.id)}`
          : "/api/admin/categories",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          // Editing never sends the slug: it is the key products point at.
          body: JSON.stringify(
            isEdit ? { name, description } : { name, slug, description },
          ),
        },
      );
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setFieldErrors(data?.fieldErrors ?? {});
        setMessage(data?.error ?? "Could not save the category.");
        return;
      }

      onClose();
      // Re-runs the Server Component so the table shows the new data.
      router.refresh();
    } catch {
      setMessage("Could not reach the server. Is the database running?");
    } finally {
      setIsPending(false);
    }
  }

  function invalidProps(field: CategoryField) {
    const invalid = Boolean(fieldErrors[field]?.length);
    return {
      "aria-invalid": invalid,
      "aria-describedby": invalid ? `${field}-error` : undefined,
      className: `${inputClass} ${
        invalid ? "border-red-500" : "border-zinc-300 dark:border-zinc-700"
      }`,
    };
  }

  return (
    <Modal
      open
      title={isEdit ? "Edit category" : "Add category"}
      onClose={() => {
        if (!isPending) onClose();
      }}
      footer={
        <>
          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          {/* `form={FORM_ID}` submits the form even though this button sits
              outside it in the DOM. */}
          <button
            type="submit"
            form={FORM_ID}
            disabled={isPending}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending
              ? "Saving..."
              : isEdit
                ? "Save changes"
                : "Create category"}
          </button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4">
        {message && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            {message}
          </div>
        )}

        <Field id="name" label="Name" errors={fieldErrors.name}>
          <input
            id="name"
            autoFocus
            required
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              // Suggest a slug as they type, until they override it.
              if (!isEdit && !slugEdited) setSlug(slugify(event.target.value));
            }}
            {...invalidProps("name")}
          />
        </Field>

        {isEdit ? (
          <Field
            id="slug"
            label="Slug"
            hint="Fixed after creation: products are stored against this value."
          >
            <input
              id="slug"
              value={category!.slug}
              readOnly
              disabled
              className={`${inputClass} border-zinc-300 text-zinc-500 dark:border-zinc-700`}
            />
          </Field>
        ) : (
          <Field
            id="slug"
            label="Slug"
            hint="Used in URLs and as the database key. Filled in from the name."
            errors={fieldErrors.slug}
          >
            <input
              id="slug"
              required
              value={slug}
              onChange={(event) => {
                setSlugEdited(true);
                setSlug(event.target.value);
              }}
              {...invalidProps("slug")}
            />
          </Field>
        )}

        <Field
          id="description"
          label="Description (optional)"
          errors={fieldErrors.description}
        >
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            {...invalidProps("description")}
          />
        </Field>
      </form>
    </Modal>
  );
}
