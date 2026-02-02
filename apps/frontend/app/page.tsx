"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createNote } from "@/lib/api";

export default function Home() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [maxViews, setMaxViews] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      createNote({
        content: content.trim(),
        maxViews: maxViews ? Number(maxViews) : undefined,
      }),
    onSuccess: (data) => {
      router.push(`/s/${data.slug}`);
    },
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!content.trim()) return;
    mutation.mutate();
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <main className="w-full max-w-lg">
        <h1 className="mb-6 text-2xl font-semibold">Create secure note</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="content" className="mb-1 block text-sm">
              Secret content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste or type your secret..."
              rows={6}
              required
              disabled={mutation.isPending}
              className="w-full rounded border border-zinc-300 bg-white p-3 text-zinc-900 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 disabled:opacity-70 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-400"
            />
          </div>

          <div>
            <label htmlFor="maxViews" className="mb-1 block text-sm">
              Max views (optional)
            </label>
            <input
              id="maxViews"
              type="number"
              min={1}
              max={1000}
              value={maxViews}
              onChange={(e) => setMaxViews(e.target.value)}
              placeholder="Unlimited"
              disabled={mutation.isPending}
              className="w-full rounded border border-zinc-300 bg-white p-3 text-zinc-900 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 disabled:opacity-70 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-400"
            />
          </div>

          {mutation.isError && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {mutation.error instanceof Error
                ? mutation.error.message
                : "Creation failed"}
            </p>
          )}

          <button
            type="submit"
            disabled={mutation.isPending || !content.trim()}
            className="rounded bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-70 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {mutation.isPending ? "Creating…" : "Create secure note"}
          </button>
        </form>
      </main>
    </div>
  );
}
