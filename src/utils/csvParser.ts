// CSV Parser utility for handling CSV imports
export interface CSVParseOptions {
  delimiter?: string;
  hasHeader?: boolean;
  skipEmptyLines?: boolean;
}

export interface CSVParseResult {
  headers: string[];
  rows: string[][];
  errors: string[];
}

export function parseCSV(csvContent: string, options: CSVParseOptions = {}): CSVParseResult {
  const {
    delimiter = ',',
    hasHeader = true,
    skipEmptyLines = true
  } = options;

  const lines = csvContent.split('\n');
  const result: CSVParseResult = {
    headers: [],
    rows: [],
    errors: []
  };

  if (lines.length === 0) {
    result.errors.push('CSV file is empty');
    return result;
  }

  // Parse headers if present
  if (hasHeader) {
    result.headers = parseCSVLine(lines[0], delimiter);
    lines.shift(); // Remove header line
  }

  // Parse data rows
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (skipEmptyLines && !line) {
      continue;
    }

    try {
      const row = parseCSVLine(line, delimiter);
      result.rows.push(row);
    } catch (error) {
      result.errors.push(`Error parsing line ${i + (hasHeader ? 2 : 1)}: ${error}`);
    }
  }

  return result;
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i += 2;
        continue;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      // Field separator
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }

    i++;
  }

  // Add the last field
  result.push(current.trim());

  return result;
}

export function csvToJSON(csvContent: string, options: CSVParseOptions = {}): any[] {
  const parsed = parseCSV(csvContent, options);
  
  if (parsed.errors.length > 0) {
    throw new Error(`CSV parsing errors: ${parsed.errors.join(', ')}`);
  }

  const result: any[] = [];
  
  for (const row of parsed.rows) {
    const obj: any = {};
    
    for (let i = 0; i < parsed.headers.length; i++) {
      const header = parsed.headers[i].trim();
      const value = row[i] || '';
      
      // Convert string values to appropriate types
      if (value === '') {
        obj[header] = null;
      } else if (value === 'true' || value === 'Yes') {
        obj[header] = true;
      } else if (value === 'false' || value === 'No') {
        obj[header] = false;
      } else if (!isNaN(Number(value)) && value !== '') {
        obj[header] = Number(value);
      } else {
        obj[header] = value;
      }
    }
    
    result.push(obj);
  }
  
  return result;
}

// Category-specific CSV mapping
export const categoryCSVHeaders = [
  'ID',
  'Name',
  'Slug',
  'Description',
  'Parent Category',
  'Level',
  'Is Active',
  'Sort Order',
  'Image',
  'Icon',
  'Meta Title',
  'Meta Description',
  'Keywords',
  'Created At',
  'Updated At'
];

export function mapCategoryCSVToJSON(csvData: any[]): any[] {
  return csvData.map(row => ({
    _id: row.ID || undefined,
    name: row.Name,
    slug: row.Slug,
    description: row.Description,
    parentCategory: row['Parent Category'],
    level: row.Level,
    isActive: row['Is Active'],
    sortOrder: row['Sort Order'],
    image: row.Image,
    icon: row.Icon,
    metaTitle: row['Meta Title'],
    metaDescription: row['Meta Description'],
    keywords: row.Keywords ? row.Keywords.split(',').map((k: string) => k.trim()) : [],
    createdAt: row['Created At'],
    updatedAt: row['Updated At']
  }));
}

