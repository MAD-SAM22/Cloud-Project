
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { testApiConnection } from '@/utils/apiTest';

const ApiTester = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      const data = await testApiConnection();
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>API Connection Tester</CardTitle>
        <CardDescription>
          Tests connection to backend at: {import.meta.env.VITE_API_URL || 'Not configured'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {result && (
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md overflow-auto">
            <h3 className="text-green-600 dark:text-green-400 font-medium mb-1">Success Response:</h3>
            <pre className="text-sm">{result}</pre>
          </div>
        )}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md overflow-auto">
            <h3 className="text-red-600 dark:text-red-400 font-medium mb-1">Error:</h3>
            <pre className="text-sm">{error}</pre>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleTest} disabled={loading}>
          {loading ? 'Testing...' : 'Test API Connection'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ApiTester;
