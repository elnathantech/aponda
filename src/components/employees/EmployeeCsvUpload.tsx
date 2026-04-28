import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useBulkCreateEmployees } from '@/hooks/useEmployees';
import type { Employee } from '@/hooks/useEmployees';
import { toast } from 'sonner';

interface EmployeeCsvUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
}

const TEMPLATE_HEADERS = [
  'first_name',
  'last_name',
  'email',
  'phone',
  'ni_number',
  'job_title',
  'department',
  'start_date',
  'annual_salary',
  'pay_frequency',
  'tax_code',
  'status',
];

const TEMPLATE_SAMPLE = [
  ['Jane', 'Doe', 'jane@example.com', '07700900000', 'AB123456C', 'Engineer', 'Tech', '2025-01-15', '45000', 'monthly', '1257L', 'active'],
  ['John', 'Smith', 'john@example.com', '07700900001', 'CD654321E', 'Designer', 'Product', '2025-02-01', '38000', 'monthly', '1257L', 'active'],
];

function downloadTemplate() {
  const rows = [TEMPLATE_HEADERS.join(','), ...TEMPLATE_SAMPLE.map((r) => r.join(','))];
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'aponda-employees-template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result.map((s) => s.trim());
}

function parseCsv(text: string): Partial<Employee>[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());

  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cells[i] ?? '';
    });
    return {
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email || null,
      phone: row.phone || null,
      ni_number: row.ni_number || null,
      job_title: row.job_title || null,
      department: row.department || null,
      start_date: row.start_date || new Date().toISOString().split('T')[0],
      annual_salary: parseFloat(row.annual_salary) || 0,
      pay_frequency: (row.pay_frequency as Employee['pay_frequency']) || 'monthly',
      tax_code: row.tax_code || '1257L',
      status: (row.status as Employee['status']) || 'pending',
    } as Partial<Employee>;
  });
}

export function EmployeeCsvUpload({ open, onOpenChange, companyId }: EmployeeCsvUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<Partial<Employee>[]>([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const bulkCreate = useBulkCreateEmployees();

  const reset = () => {
    setParsed([]);
    setFileName('');
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleFile = async (file: File) => {
    setError('');
    setFileName(file.name);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      const valid = rows.filter((r) => r.first_name && r.last_name);
      if (!valid.length) {
        setError('No valid rows found. Each row needs at least first_name and last_name.');
        setParsed([]);
        return;
      }
      setParsed(valid);
    } catch (e) {
      setError('Could not read file. Make sure it is a valid CSV.');
    }
  };

  const handleImport = async () => {
    if (!parsed.length) return;
    try {
      await bulkCreate.mutateAsync({ companyId, employees: parsed });
      reset();
      onOpenChange(false);
    } catch {
      // toast handled in hook
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk import employees from CSV</DialogTitle>
          <DialogDescription>
            Faster setup for teams with several employees. Download the template, fill it in, then upload.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Download CSV template
            </Button>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Choose CSV file
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>

          <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Required columns</p>
            <p className="text-xs">
              first_name, last_name (required) · email, phone, ni_number, job_title, department,
              start_date (YYYY-MM-DD), annual_salary, pay_frequency (weekly/fortnightly/monthly),
              tax_code, status (pending/active)
            </p>
          </div>

          {fileName && (
            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate text-sm">{fileName}</span>
              </div>
              {parsed.length > 0 && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  {parsed.length} ready
                </span>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {parsed.length > 0 && (
            <div className="max-h-48 overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Job title</th>
                    <th className="text-left p-2">Salary</th>
                    <th className="text-left p-2">Start</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.slice(0, 20).map((p, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">
                        {p.first_name} {p.last_name}
                      </td>
                      <td className="p-2">{p.job_title || '-'}</td>
                      <td className="p-2">£{Number(p.annual_salary || 0).toLocaleString()}</td>
                      <td className="p-2">{p.start_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsed.length > 20 && (
                <p className="p-2 text-xs text-muted-foreground text-center bg-muted/30">
                  and {parsed.length - 20} more…
                </p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!parsed.length || bulkCreate.isPending}
            >
              {bulkCreate.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Import {parsed.length || ''} employees
            </Button>
          </div>

          {!parsed.length && !fileName && (
            <p className="text-xs text-muted-foreground text-center">
              Tip: bulk import is recommended when you have more than 3 employees.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
