export function generateCSV(data: any[], filename: string) {
    if (!data || !data.length) {
        console.warn('No data to export');
        return;
    }

    // Extract headers
    const headers = Object.keys(data[0]).filter(key => typeof data[0][key] !== 'object');
    
    // Construct rows
    const rows = data.map(row => {
        return headers.map(header => {
            const val = row[header];
            if (val === null || val === undefined) return '""';
            return `"${String(val).replace(/"/g, '""')}"`;
        }).join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(',') + "\n" 
        + rows.join('\n');

    // Create a link to download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

