/**
 * FuelFlow - Export & Print Utilities
 */

/**
 * Download arbitrary data as a CSV file
 */
export function downloadCSV(filename, headers, rows) {
  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = [
    headers.map(escapeCsv).join(','),
    ...rows.map(row => row.map(escapeCsv).join(','))
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download as Excel (.xls HTML table format compatible with MS Excel)
 */
export function downloadExcel(filename, sheetName, headers, rows) {
  const headerHtml = `<tr>${headers.map(h => `<th style="background:#0d1527;color:#ffffff;font-weight:bold;padding:8px;border:1px solid #ddd;">${h}</th>`).join('')}</tr>`;
  const rowsHtml = rows.map(r => `<tr>${r.map(c => `<td style="padding:6px;border:1px solid #ddd;">${c !== null && c !== undefined ? c : ''}</td>`).join('')}</tr>`).join('');

  const template = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>${sheetName || 'FuelFlow Report'}</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
      </head>
      <body>
        <h3>FuelFlow – Smart Fuel Station Manager</h3>
        <h4>${filename}</h4>
        <table border="1">${headerHtml}${rowsHtml}</table>
      </body>
    </html>
  `;

  const blob = new Blob([template], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Trigger browser print
 */
export function triggerPrint() {
  window.print();
}
