import { Markdown } from "@/components/markdown";

/** Terminal-style window chrome around a code snippet. */
export function CodeWindow({
  title,
  code,
  lang = "python",
}: {
  title: string;
  code: string;
  lang?: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-edge bg-surface">
      <div className="flex items-center gap-2 border-b border-edge px-4 py-2.5">
        <span aria-hidden className="flex gap-1.5">
          <i className="size-2.5 rounded-full bg-edge-strong" />
          <i className="size-2.5 rounded-full bg-edge-strong" />
          <i className="size-2.5 rounded-full bg-edge-strong" />
        </span>
        <span className="ml-1 font-mono text-xs text-mute">{title}</span>
      </div>
      <div className="text-sm [&_pre]:my-0 [&_pre]:rounded-none [&_pre]:border-0 [&_pre]:bg-transparent [&_pre]:px-5 [&_pre]:py-4">
        <Markdown>{"```" + lang + "\n" + code + "\n```"}</Markdown>
      </div>
    </div>
  );
}
