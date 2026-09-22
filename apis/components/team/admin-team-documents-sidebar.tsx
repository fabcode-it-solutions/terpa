"use client";

import {
  generateEmailPreviewAction,
  sendSetupEmailAction,
} from "@/actions/admin";
import { updateOnboardingTask } from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TEAM_ONBOARDING_TASKS } from "@/lib/constants/team";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import { Check, Loader, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Props = {
  teamId: string;
  tasks: {
    key: string;
    value: boolean;
  }[];
  histories: (
    | ({
        user: {
          firstName: string | null;
          lastName: string | null;
          email: string;
        };
      } & {
        id: string;
        key: string;
        previousValue: boolean;
        newValue: boolean;
        createdAt: Date;
        userId: string;
        teamId: string;
      })
    | null
  )[];
  timeline: ({
    user: {
      firstName: string | null;
      lastName: string | null;
      email: string;
    };
  } & {
    id: string;
    key: string;
    previousValue: boolean;
    newValue: boolean;
    createdAt: Date;
    userId: string;
    teamId: string;
  })[];
};

interface EmailPreviewData {
  subject: string;
  body: string;
}

function AdminTeamHistoryCard({ timeline }: { timeline: Props["timeline"] }) {
  if (timeline.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {timeline.map((history) => {
          const task = TEAM_ONBOARDING_TASKS.find((t) => t.key === history.key);
          return (
            <div key={history.id} className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                {history.newValue ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
                <p className="font-medium text-sm">{task?.label}</p>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-sm text-muted-foreground">
                      {history.user.firstName
                        ? `${history.user.firstName} ${history.user.lastName}`
                        : history.user.email}{" "}
                      hace{" "}
                      {formatDistanceToNow(new Date(history.createdAt), {
                        locale: es,
                      })}
                      .
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>
                    {formatInTimeZone(
                      new Date(history.createdAt),
                      "America/Mexico_City",
                      "dd/MM/yyyy hh:mm:ss a",
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function AdminTeamDocumentsSidebar({
  teamId,
  tasks,
  histories,
  timeline,
  onboardingCompleted = true,
}: Props & { onboardingCompleted?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailList, setEmailList] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  // Fetch email preview when dialog opens
  const {
    data: emailPreview,
    isLoading: isLoadingPreview,
    error: previewError,
  } = useQuery({
    queryKey: ["email-preview", teamId],
    queryFn: () => generateEmailPreviewAction(teamId),
    enabled: emailDialogOpen,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update custom fields when preview data loads or dialog opens
  useEffect(() => {
    if (emailDialogOpen && emailPreview?.success && emailPreview.data) {
      setCustomSubject(emailPreview.data.subject);
      setCustomBody(emailPreview.data.body);
    }
  }, [emailPreview, emailDialogOpen]);

  const handleTaskChange = async (taskKey: string, newValue: boolean) => {
    setLoading((prev) => ({ ...prev, [taskKey]: true }));
    const result = await updateOnboardingTask({
      teamId,
      taskKey,
      newValue,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Task updated successfully");
      router.refresh();
    }
    setLoading((prev) => ({ ...prev, [taskKey]: false }));
  };

  const handleSendSetupEmail = async () => {
    setSendingEmail(true);
    try {
      const customEmailContent = {
        subject: customSubject.trim(),
        body: customBody.trim(),
      };

      const result = await sendSetupEmailAction(
        teamId,
        emailList,
        customEmailContent.subject && customEmailContent.body
          ? customEmailContent
          : undefined,
      );

      if (result.success) {
        toast.success("Correo de setup enviado exitosamente");
        setEmailDialogOpen(false);
        setEmailList("");
        setCustomSubject("");
        setCustomBody("");
      } else {
        toast.error(result.error || "Error al enviar el correo");
      }
    } catch (error) {
      toast.error("Error inesperado al enviar el correo");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setEmailDialogOpen(open);
    if (!open) {
      setEmailList("");
      setCustomSubject("");
      setCustomBody("");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Tareas Onboarding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {TEAM_ONBOARDING_TASKS.map((task) => {
            const taskValue =
              tasks.find((t) => t.key === task.key)?.value ?? false;
            const history = histories.find((h) => h?.key === task.key);
            return (
              <div key={task.key} className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={task.key}
                    checked={taskValue}
                    onCheckedChange={(checked) =>
                      handleTaskChange(task.key, !!checked)
                    }
                    disabled={loading[task.key]}
                  />
                  <Label htmlFor={task.key} className="flex-1">
                    {task.label}
                  </Label>
                  <div className="h-4 w-4">
                    {loading[task.key] && (
                      <Loader className="animate-spin h-4 w-4" />
                    )}
                  </div>
                </div>
                {history && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-sm text-muted-foreground">
                          {history.user.firstName
                            ? `${history.user.firstName} ${history.user.lastName}`
                            : history.user.email}{" "}
                          {history.newValue ? "completó" : "revirtió"} esta
                          tarea hace{" "}
                          {formatDistanceToNow(new Date(history.createdAt), {
                            locale: es,
                          })}
                          .
                        </p>
                      </TooltipTrigger>
                      <TooltipContent>
                        {formatInTimeZone(
                          new Date(history.createdAt),
                          "America/Mexico_City",
                          "dd/MM/yyyy hh:mm:ss a",
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {onboardingCompleted && (
        <Card>
          <CardHeader>
            <CardTitle>Envío de Correo Setup</CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog open={emailDialogOpen} onOpenChange={handleDialogClose}>
              <DialogTrigger asChild>
                <Button className="w-full">Mandar Correo Setup</Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle>Configurar y Enviar Correo de Setup</DialogTitle>
                  <DialogDescription>
                    Revisa y edita el contenido del correo antes de enviarlo.
                  </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-6 py-4">
                  {/* Email Recipients */}
                  <div>
                    <Label htmlFor="emailList" className="text-sm font-medium">
                      Lista de correos electrónicos:
                    </Label>
                    <Textarea
                      id="emailList"
                      placeholder="email1@ejemplo.com, email2@ejemplo.com, email3@ejemplo.com"
                      value={emailList}
                      onChange={(e) => setEmailList(e.target.value)}
                      className="mt-2"
                      rows={3}
                    />
                  </div>

                  {/* Loading Indicator */}
                  {isLoadingPreview && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader className="h-4 w-4 animate-spin" />
                      Cargando contenido del correo...
                    </div>
                  )}

                  {/* Email Content - Always Editable */}
                  <div className="space-y-4">
                    <div>
                      <Label
                        htmlFor="customSubject"
                        className="text-sm font-medium"
                      >
                        Asunto del correo:
                      </Label>
                      <Textarea
                        id="customSubject"
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        className="mt-2"
                        rows={2}
                        placeholder="Ingresa el asunto del correo..."
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="customBody"
                        className="text-sm font-medium"
                      >
                        Contenido del correo:
                      </Label>
                      <Textarea
                        id="customBody"
                        value={customBody}
                        onChange={(e) => setCustomBody(e.target.value)}
                        className="mt-2 font-mono text-sm"
                        rows={16}
                        placeholder="Ingresa el contenido del correo..."
                      />
                    </div>
                  </div>

                  {previewError && (
                    <div className="text-sm text-destructive">
                      Error al cargar la vista previa del correo
                    </div>
                  )}
                </div>

                <DialogFooter className="flex-shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDialogClose(false)}
                    disabled={sendingEmail}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSendSetupEmail}
                    disabled={
                      sendingEmail ||
                      !emailList.trim() ||
                      !customSubject.trim() ||
                      !customBody.trim()
                    }
                  >
                    {sendingEmail ? "Enviando..." : "Enviar Correo"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}

      <AdminTeamHistoryCard timeline={timeline} />
    </div>
  );
}
