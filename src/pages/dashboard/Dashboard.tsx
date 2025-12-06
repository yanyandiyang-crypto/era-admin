import { useDashboard } from "./useDashboard";
import { DashboardUI } from "./DashboardUI";
import { format } from "date-fns";

export default function DashboardPage() {
  const dashboardData = useDashboard();

  return (
    <DashboardUI
      {...dashboardData}
      format={format}
      currentTime={new Date()}
    />
  );
}
