import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

// Tailwind typography (`prose`) styles the README HTML we don't control,
// tuned to the site's tokens via modifier utilities.
const PROSE =
  "prose max-w-none prose-sm sm:prose-base break-words text-ink " +
  "prose-headings:tracking-tight prose-headings:text-ink prose-h1:text-2xl prose-h2:text-xl " +
  "prose-h1:border-b prose-h1:border-edge prose-h1:pb-2 " +
  "prose-h2:border-b prose-h2:border-edge prose-h2:pb-1.5 " +
  "prose-p:text-ink prose-li:text-ink prose-strong:text-ink " +
  "prose-a:text-ink prose-a:underline-offset-4 prose-a:decoration-edge-strong hover:prose-a:decoration-ink " +
  "prose-code:font-mono prose-code:text-ink prose-code:before:content-none prose-code:after:content-none " +
  "prose-pre:bg-surface prose-pre:text-ink prose-pre:border prose-pre:border-edge prose-pre:rounded-2xl " +
  "prose-blockquote:border-edge-strong prose-blockquote:text-mute prose-blockquote:not-italic " +
  "prose-th:border prose-th:border-edge prose-td:border prose-td:border-edge " +
  "prose-th:px-3 prose-th:py-1.5 prose-td:px-3 prose-td:py-1.5 prose-th:bg-surface " +
  "prose-img:rounded-md prose-hr:border-edge";

export function Markdown({ children }: { children: string }) {
  return (
    <div className={PROSE}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // README tables are wider than a phone viewport; without a scroll
          // container they force the whole page to scroll horizontally.
          table: (props) => (
            <div className="overflow-x-auto">
              <table {...props} />
            </div>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
