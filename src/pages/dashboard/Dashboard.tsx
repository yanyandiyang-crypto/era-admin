import { useDashboard } from "./useDashboard";
import { DashboardUI } from "./DashboardUI";

export default function DashboardPage() {
  const dashboardData = useDashboard();

  return <DashboardUI {...dashboardData} />;
}
