import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

interface AnalyticsTableProps {
  headers: string[];
  rows: (string | number)[][];
}

export function AnalyticsTable({ headers, rows }: AnalyticsTableProps) {
  return (
    <div className="w-full overflow-auto" style={{maxHeight: '400px'}}>
        <Table>
        <TableHeader>
            <TableRow>
            {headers.map((header, index) => (
                <TableHead key={index}>{header}</TableHead>
            ))}
            </TableRow>
        </TableHeader>
        <TableBody>
            {rows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
                {row.map((cell, cellIndex) => (
                <TableCell key={cellIndex}>{cell}</TableCell>
                ))}
            </TableRow>
            ))}
        </TableBody>
        </Table>
    </div>
  );
}
