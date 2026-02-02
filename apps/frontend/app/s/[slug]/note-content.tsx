"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ApiError, getNote } from "@/lib/api";

export function NoteContent({ slug }: { slug: string }) {
  const { data, isPending, isError } = useQuery({
    queryKey: ["note", slug],
    queryFn: () => getNote(slug),
    retry: (_, error) => (error as ApiError).status !== 404,
    gcTime: 0,
  });

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-zinc-500 dark:text-zinc-400">Loading…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <p className="mb-4 text-zinc-700 dark:text-zinc-300">
            This note has expired or been consumed.
          </p>
          <Link
            href="/"
            className="text-sm font-medium text-zinc-900 underline hover:no-underline dark:text-zinc-100"
          >
            Create a new note
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <main className="w-full max-w-lg">
        <pre className="whitespace-pre-wrap rounded border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
          {data.content}
        </pre>
        <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          This note was displayed once and is no longer available.
        </p>
      </main>
    </div>
  );
}
