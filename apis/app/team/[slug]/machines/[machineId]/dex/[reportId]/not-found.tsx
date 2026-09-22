import EmptyState from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <EmptyState
      title="DEX No Encontrado"
      description="No hemos encontrado el DEX que solicitas. Contáctanos si crees que esto es un error."
    />
  );
}
