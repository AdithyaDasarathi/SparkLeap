import KPICharts from '@/components/KPICharts';
import KPIDashboard from '@/components/KPIDashboard';

export default function KPIPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <KPICharts />
      <KPIDashboard userId="demo-user" />
    </div>
  );
} 