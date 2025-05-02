
import React, { useEffect, useState } from 'react';
import { ping } from '@/services/dockerService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader, AlertCircle, CheckCircle, Wifi, WifiOff, Info } from 'lucide-react';
import { toast } from 'sonner';

const TestPage = () => {
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState<string>(import.meta.env.VITE_API_URL || 'http://localhost:3000');
  const [status, setStatus] = useState<'online' | 'offline'>('offline');
  const [rawResponse, setRawResponse] = useState<any>(null);

  const testPing = async () => {
    setLoading(true);
    setError(null);
    setRawResponse(null);
    try {
      console.log('Sending ping request to Docker daemon...');
      const result = await ping();
      console.log('Ping response raw:', result);
      
      // Store the raw response for debugging
      setRawResponse(result);
      
      // Check if the response is as expected
      if (result.data === "OK" || result.status === 200) {
        setResponse(typeof result.data === 'string' ? result.data : JSON.stringify(result.data));
        setStatus('online');
        toast.success('Connection successful!');
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (err: any) {
      console.error('Ping error:', JSON.stringify(err, null, 2));
      setStatus('offline');
      
      // Provide more specific error information
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setError(`Server responded with error ${err.response.status}: ${err.response.data}`);
      } else if (err.request) {
        // The request was made but no response was received
        setError('No response received from server. Request may have timed out or been blocked.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(err.message || 'An unknown error occurred');
      }
      toast.error('Connection failed!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('TestPage mounted, testing ping...');
    console.log('Current API URL:', apiUrl);
    testPing();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Docker API Test</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            Docker Daemon Ping Test
            <div className="ml-auto flex items-center gap-2">
              <div className="flex items-center mr-2">
                {status === 'online' ? (
                  <Wifi className="h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <WifiOff className="h-5 w-5 text-destructive mr-2" />
                )}
                <span className={status === 'online' ? 'text-green-500' : 'text-destructive'}>
                  {status === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
              
              <Button variant="outline" onClick={testPing} disabled={loading}>
                {loading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
                Test Connection
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-sm bg-muted p-4 rounded-md">
            <p className="font-medium">API Configuration:</p>
            <code className="block mt-1">BASE_URL: {apiUrl}</code>
            <code className="block mt-1">Endpoint: /_ping</code>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <Loader className="mr-2 h-6 w-6 animate-spin text-primary" />
              <span>Testing connection...</span>
            </div>
          ) : error ? (
            <div className="bg-destructive/10 text-destructive p-4 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Connection Failed</p>
                <p className="text-sm">{error}</p>
                <p className="text-sm mt-2">Check that the Docker daemon is running and accessible.</p>
                <div className="mt-4 p-3 bg-background/80 rounded-md text-xs">
                  <p className="font-semibold mb-1">Troubleshooting tips:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Verify Docker daemon is running on {apiUrl}</li>
                    <li>Check CORS settings on your backend</li>
                    <li>Verify network connectivity (no firewalls blocking requests)</li>
                    <li>Check that your backend is returning the expected response format</li>
                    <li>Try using a proxy in your Vite config if needed</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : response ? (
            <div className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 p-4 rounded-md flex items-start">
              <CheckCircle className="h-5 w-5 mr-2 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Connection Successful</p>
                <p className="text-sm mt-2">Response:</p>
                <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-xs overflow-auto mt-2 max-h-40">
                  {response}
                </pre>
              </div>
            </div>
          ) : null}
          
          {rawResponse && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <div className="flex items-center mb-2">
                <Info className="h-4 w-4 mr-2" />
                <p className="text-sm font-medium">Raw Response Data (Debug):</p>
              </div>
              <pre className="text-xs overflow-auto max-h-40">{JSON.stringify(rawResponse, null, 2)}</pre>
            </div>
          )}
          
          <div className="mt-4 text-sm text-muted-foreground">
            <p>Endpoint: <code>/_ping</code></p>
            <p>Expected response: <code>OK</code> (string)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestPage;
