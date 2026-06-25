import AppLayout from "@/components/layout/AppLayout";
import TasksPage from "@/page-components/TasksPage";
export default function PageRoute() {
  return (
    <AppLayout>
      <TasksPage />
    </AppLayout>
  );
}
