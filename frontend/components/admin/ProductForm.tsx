"use client";

import Link from "next/link";
import { ReactNode, useActionState } from "react";
import type { ProductFormState } from "../../app/admin/products/actions";
import type { ProductField } from "../../lib/validations/product";
import { Category } from "../../types";

const INITIAL_STATE: ProductFormState = {};

const inputClass =
  "w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-600 dark:bg-zinc-900";

/** Label + input + error message, so each field below is one short block. */
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
 * Product form, shared by the "Add product" and "Edit product" pages.
 *
 * The page decides what happens on submit by passing `action` (a Server
 * Action) and, for editing, `initialValues` loaded from DynamoDB.
 *
 * useActionState wires the form to that action and gives us:
 *   state      - whatever the action returned last (errors + typed values)
 *   formAction - pass this to <form action>
 *   isPending  - true while the action is running (disables the button)
 *
 * The browser `required`/`min` attributes are only a convenience: they can be
 * bypassed, so the Server Action re-validates everything with Zod.
 */
export default function ProductForm({
  categories,
  action,
  initialValues,
  submitLabel,
  pendingLabel,
}: {
  categories: Category[];
  action: (
    state: ProductFormState,
    formData: FormData,
  ) => Promise<ProductFormState>;
  initialValues?: Partial<Record<ProductField, string>>;
  submitLabel: string;
  pendingLabel: string;
}) {
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);

  const errors = state.fieldErrors ?? {};
  // After a failed submit show what the admin typed; otherwise the saved data.
  const values = state.values ?? initialValues ?? {};

  // Red border + aria attributes for fields that failed validation.
  function invalidProps(field: keyof typeof errors) {
    const invalid = Boolean(errors[field]?.length);
    return {
      "aria-invalid": invalid,
      "aria-describedby": invalid ? `${field}-error` : undefined,
      className: `${inputClass} ${
        invalid
          ? "border-red-500"
          : "border-zinc-300 dark:border-zinc-700"
      }`,
    };
  }

  return (
    <form action={formAction} className="space-y-5">
      {state.message && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          {state.message}
        </div>
      )}

      {/* defaultValue (not value) keeps inputs uncontrolled. After a failed
          submit React resets the form, and these defaults refill it with what
          the admin typed. */}
      <Field id="name" label="Name" errors={errors.name}>
        <input
          id="name"
          name="name"
          required
          defaultValue={values.name}
          {...invalidProps("name")}
        />
      </Field>

      <Field
        id="description"
        label="Description"
        hint="At least 10 characters."
        errors={errors.description}
      >
        <textarea
          id="description"
          name="description"
          rows={4}
          required
          defaultValue={values.description}
          {...invalidProps("description")}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="price" label="Price (USD)" errors={errors.price}>
          <input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={values.price}
            {...invalidProps("price")}
          />
        </Field>

        <Field id="stock" label="Stock" errors={errors.stock}>
          <input
            id="stock"
            name="stock"
            type="number"
            step="1"
            min="0"
            required
            defaultValue={values.stock}
            {...invalidProps("stock")}
          />
        </Field>
      </div>

      <Field id="categoryId" label="Category" errors={errors.categoryId}>
        <select
          id="categoryId"
          name="categoryId"
          required
          defaultValue={values.categoryId ?? ""}
          {...invalidProps("categoryId")}
        >
          <option value="" disabled>
            Select a category
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </Field>

      <Field
        id="imageUrl"
        label="Image URL (optional)"
        hint="https link from cdn.dummyjson.com or placehold.co. Leave empty for a placeholder."
        errors={errors.imageUrl}
      >
        <input
          id="imageUrl"
          name="imageUrl"
          type="url"
          placeholder="https://cdn.dummyjson.com/..."
          defaultValue={values.imageUrl}
          {...invalidProps("imageUrl")}
        />
      </Field>

      <div className="flex items-center justify-end gap-3 border-t border-zinc-200 pt-5 dark:border-zinc-800">
        <Link
          href="/admin/products"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? pendingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
