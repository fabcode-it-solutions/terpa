"use client";

import { teamMemberRemoveAction } from "@/actions/team";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { teamMemberRemoveSchema } from "@/validation/teams";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  userId: string;
};

export default function UserRemoveDialog(props: Props) {
  const params = useParams();
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(teamMemberRemoveSchema),
    values: {
      userId: props.userId,
      teamSlug: params.slug,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const result = await teamMemberRemoveAction(values);
    if (result.success) {
      toast.success("Usuario eliminado correctamente");
      router.push(`/team/${params.slug}/users`);
    } else {
      toast.error("Error al eliminar el usuario");
    }
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">Eliminar Usuario</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar Usuario</DialogTitle>
          <DialogDescription>
            Elimina este usuario si ya no deseas que tenga acceso a este equipo.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit}>
            <DialogFooter>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                variant="destructive"
              >
                Eliminar Usuario
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
