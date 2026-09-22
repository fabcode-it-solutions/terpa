import { AppContainer } from "@/components/ui/app-layout";
import EmptyState from "@/components/ui/empty-state";
import { Title } from "@/components/ui/typography";

export default function Page() {
  return (
    <AppContainer>
      <Title>Admin Page</Title>
      <EmptyState
        title="This is an empty state"
        description="This is a placeholder for when there is no data to show."
      />
    </AppContainer>
  );
}
