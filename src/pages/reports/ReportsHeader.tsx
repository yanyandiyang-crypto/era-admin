import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReportsHeaderProps {
  isGenerating: boolean;
  generatePDF: () => Promise<void>;
  generateExcel: () => Promise<void>;
}

export default function ReportsHeader({
  isGenerating,
  generatePDF,
  generateExcel,
}: ReportsHeaderProps) {
  return (
    <div className="relative overflow-hidden bg-linear-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl shadow-2xl">
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.1),_transparent_50%),_radial-gradient(circle_at_bottom,_rgba(99,102,241,0.1),_transparent_50%)]" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />

      <div className="relative p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Reports & Analytics
            </h1>
            <p className="text-blue-100 mt-1 font-medium">
              Generate comprehensive reports with incident data and 5W1H analysis
            </p>
          </div>

          {/* Export Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={generatePDF}
              disabled={isGenerating}
              className="bg-white text-blue-700 hover:bg-blue-50 border-white/20 shadow-lg"
              size="sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
            <Button
              onClick={generateExcel}
              disabled={isGenerating}
              variant="outline"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm"
              size="sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Download Excel
                </>
              )}
            </Button>

          </div>
        </div>
      </div>
    </div>
  );
}
