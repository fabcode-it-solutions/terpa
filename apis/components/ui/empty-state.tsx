import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description?: string;
  className?: string;
};

export default function EmptyState(props: Props) {
  return (
    <div
      className={cn(
        "flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm bg-background py-32 px-6",
        props.className,
      )}
    >
      <div className="flex flex-col items-center gap-1 text-center">
        <h3 className="text-2xl font-bold tracking-tight">{props.title}</h3>
        {props.description && (
          <p className="text-sm text-muted-foreground">{props.description}</p>
        )}
      </div>
    </div>
  );
}
