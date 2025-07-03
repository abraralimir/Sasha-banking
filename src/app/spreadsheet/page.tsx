import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LanguageToggle } from '@/components/language-toggle';

export default function SpreadsheetPage() {
  return (
    <div className="flex flex-col h-screen">
      <header className="grid grid-cols-3 items-center p-4 border-b shrink-0 bg-background">
          <div className="justify-self-start"></div>
          <h1 className="text-xl font-semibold tracking-tight justify-self-center">Spreadsheet</h1>
          <div className="justify-self-end">
            <LanguageToggle />
          </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Spreadsheet View</CardTitle>
            <CardDescription>
              This is a placeholder for the spreadsheet functionality. You can ask me to build it out.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-lg bg-muted/50">
                <p className="text-muted-foreground">Spreadsheet content will go here.</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
