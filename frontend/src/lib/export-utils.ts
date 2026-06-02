/**
 * Export utilities for CSV and PDF generation
 */

export interface ExportColumn {
  key: string;
  label: string;
  format?: (value: any) => string;
}

/**
 * Export data to CSV file
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn[],
  filename: string
): void {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Create CSV header
  const header = columns.map(col => `"${col.label}"`).join(',');

  // Create CSV rows
  const rows = data.map(item => {
    return columns
      .map(col => {
        const value = item[col.key];
        const formatted = col.format ? col.format(value) : value;
        // Escape quotes and wrap in quotes
        const escaped = String(formatted ?? '').replace(/"/g, '""');
        return `"${escaped}"`;
      })
      .join(',');
  });

  // Combine header and rows
  const csv = [header, ...rows].join('\n');

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export data to print-friendly format (can be used for PDF via browser print)
 */
export function exportToPrintable<T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn[],
  title: string,
  options?: {
    subtitle?: string;
    summaryRows?: Array<{ label: string; value: string | number }>;
    orientation?: 'portrait' | 'landscape';
  }
): void {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  const orientation = options?.orientation || 'landscape';
  
  // Create HTML for print
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        @media print {
          @page { 
            size: A4 ${orientation};
            margin: 0.5cm;
          }
          body { margin: 0; }
        }
        
        body {
          font-family: Arial, sans-serif;
          font-size: 10pt;
          color: #1f2937;
          padding: 20px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #29021A;
          padding-bottom: 10px;
        }
        
        .header h1 {
          color: #29021A;
          margin: 0 0 5px 0;
          font-size: 18pt;
        }
        
        .header p {
          margin: 0;
          color: #6b7280;
          font-size: 9pt;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        
        th {
          background-color: #29021A;
          color: white;
          padding: 8px 6px;
          text-align: left;
          font-size: 9pt;
          font-weight: 600;
          border: 1px solid #29021A;
        }
        
        td {
          padding: 6px;
          border: 1px solid #e5e7eb;
          font-size: 9pt;
        }
        
        tr:nth-child(even) {
          background-color: #f9fafb;
        }
        
        .summary {
          margin-top: 20px;
          padding: 10px;
          background-color: #faf7f9;
          border: 1px solid #29021A;
          border-radius: 4px;
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 0;
          font-size: 10pt;
        }
        
        .summary-row.total {
          font-weight: bold;
          border-top: 2px solid #29021A;
          padding-top: 8px;
          margin-top: 4px;
        }
        
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 8pt;
          color: #9ca3af;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        ${options?.subtitle ? `<p>${options.subtitle}</p>` : ''}
        <p>Generated on ${new Date().toLocaleString()}</p>
      </div>
      
      <table>
        <thead>
          <tr>
            ${columns.map(col => `<th>${col.label}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data
            .map(
              item => `
            <tr>
              ${columns
                .map(col => {
                  const value = item[col.key];
                  const formatted = col.format ? col.format(value) : value;
                  return `<td>${formatted ?? ''}</td>`;
                })
                .join('')}
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      
      ${
        options?.summaryRows
          ? `
      <div class="summary">
        ${options.summaryRows
          .map(
            row => `
          <div class="summary-row ${row.label.toLowerCase().includes('total') ? 'total' : ''}">
            <span>${row.label}:</span>
            <span>${row.value}</span>
          </div>
        `
          )
          .join('')}
      </div>
      `
          : ''
      }
      
      <div class="footer">
        <p>Sudhan Textile ERP - Sizing Department</p>
      </div>
    </body>
    </html>
  `;

  // Open in new window and trigger print
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
    };
  } else {
    alert('Please allow pop-ups to print/export PDF');
  }
}

/**
 * Format currency for export
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '0.00';
  return value.toFixed(2);
}

/**
 * Format date for export
 */
export function formatDateForExport(value: string | null | undefined): string {
  if (!value) return '';
  try {
    const date = new Date(value);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return value || '';
  }
}

/**
 * Format number for export
 */
export function formatNumberForExport(value: number | null | undefined, decimals = 2): string {
  if (value == null) return '0';
  return value.toFixed(decimals);
}
