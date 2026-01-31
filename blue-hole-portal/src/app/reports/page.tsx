'use client';

// Disable static page generation (requires blockchain connection)
export const dynamic = 'force-dynamic';

import React from 'react';
import {
  ArrowLeft,
  FilePdf,
  FileXls,
  Calendar,
  ChartBar,
  Download,
  Funnel,
  CurrencyDollar,
  TrendUp,
  Vault,
  Users,
  Lightning,
} from 'phosphor-react';
import { useRouter } from 'next/navigation';
import { analyticsService } from '@/services/analytics';
import { blockchainService } from '@/services/blockchain';
import { Card } from '@belizechain/shared';

// Report types
const reportTemplates = [
  {
    id: 'treasury-summary',
    name: 'Treasury Summary',
    description: 'Overview of treasury balance, proposals, and spending',
    icon: Vault,
    color: 'text-maya-600 bg-maya-100',
  },
  {
    id: 'spending-analysis',
    name: 'Spending Analysis',
    description: 'Detailed breakdown of government spending by department',
    icon: ChartBar,
    color: 'text-caribbean-600 bg-caribbean-100',
  },
  {
    id: 'revenue-forecast',
    name: 'Revenue Forecast',
    description: 'Projected revenue and economic indicators',
    icon: TrendUp,
    color: 'text-jungle-600 bg-jungle-100',
  },
  {
    id: 'citizen-metrics',
    name: 'Citizen Metrics',
    description: 'Active accounts, KYC status, and demographics',
    icon: Users,
    color: 'text-bluehole-600 bg-bluehole-100',
  },
  {
    id: 'transaction-volume',
    name: 'Transaction Volume',
    description: 'Network activity and transaction statistics',
    icon: Lightning,
    color: 'text-orange-600 bg-orange-100',
  },
];

export default function FinancialReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [showBuilder, setShowBuilder] = React.useState(false);
  const [analytics, setAnalytics] = React.useState<any>(null);
  
  // Report builder state
  const [selectedTemplate, setSelectedTemplate] = React.useState<string | null>(null);
  const [dateRange, setDateRange] = React.useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [selectedDepartments, setSelectedDepartments] = React.useState<string[]>([]);
  const [includeCharts, setIncludeCharts] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);

  const departments = [
    'Treasury', 'Infrastructure', 'Social Programs', 'Education',
    'Health', 'Security', 'Environment', 'Economic Development'
  ];

  React.useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      await blockchainService.initialize();
      const data = await analyticsService.getTreasuryAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePDFReport = async () => {
    if (!selectedTemplate) {
      alert('Please select a report template');
      return;
    }

    setGenerating(true);
    try {
      // Fetch fresh data for the report
      await blockchainService.initialize();
      const reportData = await analyticsService.getTreasuryAnalytics();
      
      // In production, this would use a library like jsPDF or call a backend service
      // For now, we'll create a downloadable data file
      const reportContent = {
        template: selectedTemplate,
        generatedAt: new Date().toISOString(),
        dateRange,
        departments: selectedDepartments,
        includeCharts,
        data: reportData,
      };

      // Create blob and download
      const blob = new Blob([JSON.stringify(reportContent, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `belizechain-report-${selectedTemplate}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('PDF report generation initiated! (Using JSON format for demo)');
      setShowBuilder(false);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGenerating(false);
    }
  };

  const generateExcelReport = async () => {
    if (!selectedTemplate) {
      alert('Please select a report template');
      return;
    }

    setGenerating(true);
    try {
      await blockchainService.initialize();
      const reportData = await analyticsService.getTreasuryAnalytics();

      // Create CSV content (simplified Excel format)
      let csvContent = 'BelizeChain Financial Report\n';
      csvContent += `Report Type: ${selectedTemplate}\n`;
      csvContent += `Generated: ${new Date().toLocaleDateString()}\n`;
      csvContent += `Period: ${dateRange.start} to ${dateRange.end}\n\n`;

      csvContent += 'Metric,Value\n';
      csvContent += `Current Balance,${Number(reportData.currentBalance) / 1e12}\n`;
      csvContent += `Total Revenue,${Number(reportData.totalRevenue) / 1e12}\n`;
      csvContent += `Total Expenses,${Number(reportData.totalExpenses) / 1e12}\n`;
      csvContent += `30-Day Forecast,${Number(reportData.cashFlowForecast.thirtyDay) / 1e12}\n`;

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `belizechain-report-${selectedTemplate}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('Excel report (CSV) generated successfully!');
      setShowBuilder(false);
    } catch (error) {
      console.error('Failed to generate Excel:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGenerating(false);
    }
  };

  const toggleDepartment = (dept: string) => {
    setSelectedDepartments(prev =>
      prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
    );
  };

  if (loading && !analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sand-50 via-caribbean-50 to-jungle-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-sand-200 rounded-lg w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-40 bg-sand-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand-50 via-caribbean-50 to-jungle-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 rounded-lg hover:bg-sand-100 transition-colors"
            >
              <ArrowLeft size={24} className="text-bluehole-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-bluehole-900">Financial Reports</h1>
              <p className="text-bluehole-600">Generate and download government financial reports</p>
            </div>
          </div>
          <button
            onClick={() => setShowBuilder(!showBuilder)}
            className="flex items-center space-x-2 px-6 py-3 bg-bluehole-600 text-white rounded-lg hover:bg-bluehole-700 transition-colors shadow-lg"
          >
            <Funnel size={20} weight="fill" />
            <span>Custom Report Builder</span>
          </button>
        </div>

        {/* Quick Stats */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <div className="flex items-center space-x-3 mb-2">
                <Vault size={24} className="text-maya-600" weight="duotone" />
                <p className="text-sm text-bluehole-600">Treasury Balance</p>
              </div>
              <p className="text-3xl font-bold text-bluehole-900">
                ${(Number(analytics.currentBalance) / 1e12).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-bluehole-600">DALLA</p>
            </Card>

            <Card>
              <div className="flex items-center space-x-3 mb-2">
                <ChartBar size={24} className="text-caribbean-600" weight="duotone" />
                <p className="text-sm text-bluehole-600">Total Expenses</p>
              </div>
              <p className="text-3xl font-bold text-bluehole-900">
                ${(Number(analytics.totalExpenses) / 1e12).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-bluehole-600">DALLA</p>
            </Card>

            <Card>
              <div className="flex items-center space-x-3 mb-2">
                <CurrencyDollar size={24} className="text-jungle-600" weight="duotone" />
                <p className="text-sm text-bluehole-600">Total Revenue</p>
              </div>
              <p className="text-3xl font-bold text-bluehole-900">
                ${(Number(analytics.totalRevenue) / 1e12).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </Card>

            <Card>
              <div className="flex items-center space-x-3 mb-2">
                <TrendUp size={24} className="text-orange-600" weight="duotone" />
                <p className="text-sm text-bluehole-600">30-Day Forecast</p>
              </div>
              <p className="text-3xl font-bold text-bluehole-900">
                ${(Number(analytics.cashFlowForecast.thirtyDay) / 1e12).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </Card>
          </div>
        )}

        {/* Report Templates */}
        <Card>
          <h2 className="text-xl font-bold text-bluehole-900 mb-4">Quick Report Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <button
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplate(template.id);
                    setShowBuilder(true);
                  }}
                  className="p-4 rounded-lg border-2 border-sand-200 hover:border-bluehole-400 hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-start space-x-3 mb-3">
                    <div className={`p-3 rounded-lg ${template.color}`}>
                      <Icon size={24} weight="duotone" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-bluehole-900 mb-1">{template.name}</h3>
                      <p className="text-sm text-bluehole-600">{template.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 pt-3 border-t border-sand-200">
                    <FilePdf size={18} className="text-red-600" />
                    <FileXls size={18} className="text-green-600" />
                    <span className="text-xs text-bluehole-500">PDF / Excel</span>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Custom Report Builder Modal */}
        {showBuilder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
            <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6 border-b border-sand-200">
                <h2 className="text-2xl font-bold text-bluehole-900 flex items-center space-x-2">
                  <Funnel size={28} className="text-bluehole-600" weight="fill" />
                  <span>Custom Report Builder</span>
                </h2>
                <p className="text-sm text-bluehole-600 mt-1">
                  {selectedTemplate && reportTemplates.find(t => t.id === selectedTemplate)?.name}
                </p>
              </div>

              <div className="p-6 space-y-6">
                {/* Template Selection (if none selected) */}
                {!selectedTemplate && (
                  <div>
                    <label className="block text-sm font-semibold text-bluehole-900 mb-2">
                      Select Report Template *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {reportTemplates.map((template) => {
                        const Icon = template.icon;
                        return (
                          <button
                            key={template.id}
                            onClick={() => setSelectedTemplate(template.id)}
                            className="p-4 rounded-lg border-2 border-sand-200 hover:border-bluehole-400 transition-all text-left"
                          >
                            <div className="flex items-center space-x-2">
                              <Icon size={24} className={template.color.split(' ')[0]} />
                              <span className="text-sm font-medium">{template.name}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Date Range */}
                <div>
                  <label className="block text-sm font-semibold text-bluehole-900 mb-2">
                    Date Range *
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-bluehole-600 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        className="w-full px-4 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-bluehole-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-bluehole-600 mb-1">End Date</label>
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        className="w-full px-4 py-2 border border-sand-300 rounded-lg focus:ring-2 focus:ring-bluehole-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Department Filters */}
                <div>
                  <label className="block text-sm font-semibold text-bluehole-900 mb-2">
                    Filter by Departments (Optional)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {departments.map((dept) => (
                      <button
                        key={dept}
                        onClick={() => toggleDepartment(dept)}
                        className={`p-2 rounded-lg border-2 transition-all text-sm ${
                          selectedDepartments.includes(dept)
                            ? 'border-bluehole-600 bg-bluehole-50 text-bluehole-900'
                            : 'border-sand-200 hover:border-sand-300 text-bluehole-600'
                        }`}
                      >
                        {dept}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-bluehole-500 mt-2">
                    {selectedDepartments.length === 0
                      ? 'All departments included'
                      : `${selectedDepartments.length} departments selected`}
                  </p>
                </div>

                {/* Options */}
                <div>
                  <label className="block text-sm font-semibold text-bluehole-900 mb-2">
                    Report Options
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeCharts}
                        onChange={(e) => setIncludeCharts(e.target.checked)}
                        className="w-4 h-4 text-bluehole-600 focus:ring-bluehole-500 rounded"
                      />
                      <span className="text-sm text-bluehole-900">Include charts and visualizations</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-sand-200 flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowBuilder(false);
                    setSelectedTemplate(null);
                  }}
                  className="px-6 py-2 border border-sand-300 text-bluehole-700 rounded-lg hover:bg-sand-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={generateExcelReport}
                  disabled={generating}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <FileXls size={18} weight="fill" />
                  <span>Download Excel</span>
                </button>
                <button
                  onClick={generatePDFReport}
                  disabled={generating}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <FilePdf size={18} weight="fill" />
                      <span>Download PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
