import React, { useState } from 'react';
import { awsApiClient } from '@/services/awsApiClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle, RefreshCw, Search, AlertTriangle, Code } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const SAMPLE_PAYLOAD = {
  name: "Jane Doe",
  dateOfBirth: "1990-01-01",
  email: "jane@example.com",
  phone: "123-456-7890",
  address: "123 Main St",
  city: "Minneapolis",
  state: "MN",
  zipcode: "55401",
  accessibilityNeeds: ["Wheelchair"],
  insuranceType: "Medicaid",
  medicalNotes: "Asthma",
  urgency: "high",
  culturalNeeds: ["Halal meals"], // Corrected to always be an array
  languagePreferences: ["Somali", "English"]
  // serviceId and caseManagerId left out for now
};

export function ApiTester() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [result, setResult] = useState<{ success: boolean; data?: any; error?: string } | null>(null);
  const [payload, setPayload] = useState(JSON.stringify(SAMPLE_PAYLOAD, null, 2));
  const [clientId, setClientId] = useState('');
  const [clientData, setClientData] = useState<any>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [connectionState, setConnectionState] = useState<'unchecked' | 'success' | 'error'>('unchecked');
  
  // Get API URL from environment variable
  const apiUrl = import.meta.env.VITE_AWS_API_URL || "https://nndjr3excb.execute-api.us-east-2.amazonaws.com/dev";
  
  // Check API connection
  const checkConnection = async () => {
    setIsCheckingConnection(true);
    setConnectionState('unchecked');
    
    try {
      console.log("Testing API connection...");
      const response = await awsApiClient.testConnection();
      console.log("Connection response:", response);
      
      if (response.success) {
        setConnectionState('success');
        toast({
          title: "API Connection Successful",
          description: "Successfully connected to the API endpoint",
          variant: "default",
        });
      } else {
        setConnectionState('error');
        toast({
          title: "API Connection Failed",
          description: `Error: ${response.error}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Connection test failed:", error);
      setConnectionState('error');
      toast({
        title: "API Connection Failed",
        description: `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
        variant: "destructive",
      });
    } finally {
      setIsCheckingConnection(false);
    }
  };
  
  const testApi = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      console.log("Testing API endpoint...");
      let parsedPayload;
      
      try {
        parsedPayload = JSON.parse(payload);
        
        // Ensure culturalNeeds is an array
        if (parsedPayload.culturalNeeds && !Array.isArray(parsedPayload.culturalNeeds)) {
          parsedPayload.culturalNeeds = [parsedPayload.culturalNeeds];
        }
        
      } catch (e) {
        toast({
          title: "Invalid JSON",
          description: "Please check your payload format",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      const response = await awsApiClient.testApiEndpoint(parsedPayload);
      console.log("API response:", response);
      setResult(response);
      
      // If successful and we got a client ID back, store it for easy retrieval
      if (response.success && response.data?.clientId) {
        setClientId(response.data.clientId);
        toast({
          title: "API Test Successful",
          description: "The API request was successful and returned a client ID.",
          variant: "default",
        });
      } else if (response.success) {
        toast({
          title: "API Request Processed",
          description: "The request was processed, but no client ID was returned.",
          variant: "default",
        });
      } else {
        toast({
          title: "API Test Failed",
          description: `Error: ${response.error}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Test failed:", error);
      setResult({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      });
      
      toast({
        title: "API Test Failed",
        description: `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClient = async () => {
    if (!clientId.trim()) {
      toast({
        title: "Client ID Required",
        description: "Please enter a client ID to fetch",
        variant: "destructive",
      });
      return;
    }
    
    setIsFetching(true);
    setClientData(null);
    
    try {
      const response = await awsApiClient.getTestClient(clientId);
      
      if (response.success && response.data) {
        setClientData(response.data);
        toast({
          title: "Client Data Retrieved",
          description: "Successfully fetched client data",
          variant: "default",
        });
      } else {
        toast({
          title: "Error Fetching Client",
          description: response.error || "Failed to retrieve client data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching client:", error);
      toast({
        title: "Error Fetching Client",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  };
  
  const handlePayloadChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPayload(e.target.value);
  };
  
  const formatClientDataForDisplay = (data: any) => {
    if (!data) return null;
    
    // Format arrays for better display
    const formattedData = { ...data };
    Object.keys(formattedData).forEach(key => {
      if (Array.isArray(formattedData[key])) {
        formattedData[key] = formattedData[key].join(", ");
      }
    });
    
    return formattedData;
  };
  
  // Determine if we're dealing with a Lambda proxy integration response
  const isLambdaProxyResponse = (data: any) => {
    return data && 
           typeof data === 'object' && 
           'statusCode' in data && 
           'headers' in data && 
           'body' in data;
  };
  
  // Format Lambda proxy response for better display
  const formatLambdaProxyResponse = (data: any) => {
    let formattedResponse = { ...data };
    
    if (isLambdaProxyResponse(data)) {
      try {
        // Try to parse the body as JSON
        if (typeof data.body === 'string') {
          formattedResponse.parsedBody = JSON.parse(data.body);
        }
      } catch (e) {
        formattedResponse.parsedBody = { error: "Could not parse body as JSON" };
      }
    }
    
    return formattedResponse;
  };
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>API Client Data Tester</CardTitle>
        <CardDescription>
          Test your AWS API Gateway endpoints to insert and retrieve client data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <Button 
            variant={connectionState === 'success' ? "outline" : "default"}
            className={connectionState === 'success' ? "bg-green-50 border-green-200 text-green-700" : ""}
            onClick={checkConnection}
            disabled={isCheckingConnection}
          >
            {isCheckingConnection ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Checking Connection...
              </>
            ) : connectionState === 'success' ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                Connection Verified
              </>
            ) : connectionState === 'error' ? (
              <>
                <AlertCircle className="mr-2 h-4 w-4" />
                Connection Failed - Try Again
              </>
            ) : (
              <>
                <Code className="mr-2 h-4 w-4" />
                Check API Connection
              </>
            )}
          </Button>
          
          {connectionState === 'error' && (
            <Alert variant="destructive" className="mt-3">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Connection Error</AlertTitle>
              <AlertDescription>
                Could not connect to the API endpoint. Check your AWS configuration and make sure your API is deployed and accessible.
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        <Tabs defaultValue="insert" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="insert">Insert Client</TabsTrigger>
            <TabsTrigger value="retrieve">Retrieve Client</TabsTrigger>
          </TabsList>
          
          <TabsContent value="insert">
            <div className="space-y-4">
              <div className="p-4 bg-gray-100 rounded-md">
                <h3 className="font-semibold mb-2">Endpoint:</h3>
                <p className="break-all text-sm">{apiUrl}/insertClientData</p>
                
                <h3 className="font-semibold mt-4 mb-2">Test Payload:</h3>
                <textarea 
                  className="font-mono w-full h-40 p-4 bg-gray-800 text-green-400 rounded text-sm"
                  value={payload}
                  onChange={handlePayloadChange}
                />
              </div>

              {result && (
                <div className={`p-4 rounded-md ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-center mb-2">
                    {result.success ? 
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" /> : 
                      <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                    }
                    <h3 className="font-semibold">Response:</h3>
                  </div>
                  
                  {result.data && isLambdaProxyResponse(result.data) && (
                    <div className="mb-3">
                      <Alert variant={result.data.statusCode >= 400 ? "destructive" : "default"} className="mb-2">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Lambda Proxy Response Detected</AlertTitle>
                        <AlertDescription>
                          Status: {result.data.statusCode} - 
                          {result.data.statusCode >= 400 
                            ? " Error in Lambda function" 
                            : " Lambda function executed successfully but returned proxy format"}
                        </AlertDescription>
                      </Alert>
                      
                      {result.data.statusCode === 500 && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm mb-3">
                          <p className="font-medium text-yellow-800">Troubleshooting Tips:</p>
                          <ul className="list-disc pl-5 mt-1 text-yellow-700 space-y-1">
                            <li>Check your Lambda function logs in AWS CloudWatch</li>
                            <li>Verify your Lambda function handler is properly exporting the handler function</li>
                            <li>Make sure no unhandled exceptions are occurring in your Lambda code</li>
                          </ul>
                        </div>
                      )}
                      
                      <div className="mb-2">
                        <h4 className="text-sm font-medium mb-1">Response Body:</h4>
                        <pre className="p-3 bg-gray-800 text-gray-200 rounded text-xs overflow-auto">
                          {typeof result.data.body === 'string' 
                            ? result.data.body 
                            : JSON.stringify(result.data.body, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                  
                  <pre className={`p-4 rounded text-sm overflow-auto ${result.success ? 'bg-green-800 text-green-100' : 'bg-red-800 text-red-100'}`}>
                    {JSON.stringify(formatLambdaProxyResponse(result.data), null, 2)}
                  </pre>
                  
                  {result.success && result.data?.clientId && (
                    <div className="mt-4">
                      <p className="text-green-700 font-semibold">Client ID: {result.data.clientId}</p>
                      <p className="text-sm text-gray-600 mt-1">Use this ID to retrieve the client data in the "Retrieve Client" tab.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="mt-4">
              <Button 
                onClick={testApi} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Inserting...
                  </>
                ) : "Insert Client Data"}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="retrieve">
            <div className="space-y-4">
              <div className="p-4 bg-gray-100 rounded-md">
                <h3 className="font-semibold mb-2">Fetch Client by ID:</h3>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Enter client ID" 
                    value={clientId} 
                    onChange={(e) => setClientId(e.target.value)}
                    className="flex-grow"
                  />
                  <Button 
                    onClick={fetchClient} 
                    disabled={isFetching}
                  >
                    {isFetching ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {clientData && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">Client Details:</h3>
                    <div className="bg-white border rounded-md p-4">
                      <table className="w-full">
                        <tbody>
                          {Object.entries(formatClientDataForDisplay(clientData) || {}).map(([key, value]) => (
                            <tr key={key} className="border-b last:border-0">
                              <td className="py-2 px-3 font-medium text-gray-700">{key}</td>
                              <td className="py-2 px-3 break-words">{String(value || '-')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-4">
              <Button 
                onClick={fetchClient} 
                disabled={isFetching}
                className="w-full"
              >
                {isFetching ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Fetching...
                  </>
                ) : "Fetch Client Data"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
