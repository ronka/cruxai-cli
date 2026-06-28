'use client';

import { useState } from "react";
import { Send, Plus, Trash2, ChevronDown, Copy, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { asEnum } from "@/lib/typeGuards";

interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  description: string;
  enabled: boolean;
}

interface ApiResponse {
  status: number;
  statusText: string;
  time: number;
  size: string;
  body: string;
}

const sampleResponse: ApiResponse = {
  status: 200,
  statusText: "OK",
  time: 964,
  size: "1.63 KB",
  body: JSON.stringify(
    [
      {
        id: 6452,
        is_active: true,
        name: "JMJ Construction",
      },
    ],
    null,
    2
  ),
};

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const satisfies readonly HttpMethod[];
type ResponseViewMode = "pretty" | "raw" | "preview";

const methodColors: Record<HttpMethod, string> = {
  GET: "text-green-500",
  POST: "text-yellow-500",
  PUT: "text-blue-500",
  PATCH: "text-purple-500",
  DELETE: "text-red-500",
};

export function ApiTestingPanel() {
  const [method, setMethod] = useState<HttpMethod>("GET");
  const [url, setUrl] = useState("https://api.example.com/rest/v1.0/companies");
  const [activeTab, setActiveTab] = useState("params");
  const [responseTab, setResponseTab] = useState("body");
  const [responseViewMode, setResponseViewMode] = useState<ResponseViewMode>("pretty");
  const [response, setResponse] = useState<ApiResponse | null>(sampleResponse);
  const [isLoading, setIsLoading] = useState(false);

  const [queryParams, setQueryParams] = useState<KeyValuePair[]>([
    { id: "1", key: "", value: "", description: "", enabled: true },
  ]);

  const [headers, setHeaders] = useState<KeyValuePair[]>([
    { id: "1", key: "Content-Type", value: "application/json", description: "", enabled: true },
    { id: "2", key: "Authorization", value: "Bearer token", description: "", enabled: true },
    { id: "3", key: "", value: "", description: "", enabled: true },
  ]);

  const [bodyContent, setBodyContent] = useState(`{
  "name": "New Company",
  "is_active": true
}`);

  const handleSend = () => {
    setIsLoading(true);
    setTimeout(() => {
      setResponse(sampleResponse);
      setIsLoading(false);
    }, 500);
  };

  const addRow = (
    setter: React.Dispatch<React.SetStateAction<KeyValuePair[]>>
  ) => {
    setter((prev) => [
      ...prev,
      { id: crypto.randomUUID(), key: "", value: "", description: "", enabled: true },
    ]);
  };

  const removeRow = (
    id: string,
    setter: React.Dispatch<React.SetStateAction<KeyValuePair[]>>
  ) => {
    setter((prev) => prev.filter((row) => row.id !== id));
  };

  const updateRow = (
    id: string,
    field: keyof KeyValuePair,
    value: string | boolean,
    setter: React.Dispatch<React.SetStateAction<KeyValuePair[]>>
  ) => {
    setter((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const renderKeyValueTable = (
    items: KeyValuePair[],
    setter: React.Dispatch<React.SetStateAction<KeyValuePair[]>>
  ) => (
    <div className="border-b border-border">
      <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-px bg-border text-xs font-medium text-muted-foreground">
        <div className="bg-muted/50 px-3 py-2">KEY</div>
        <div className="bg-muted/50 px-3 py-2">VALUE</div>
        <div className="bg-muted/50 px-3 py-2">DESCRIPTION</div>
        <div className="bg-muted/50 px-3 py-2 w-20 text-right">
          <button
            onClick={() => {}}
            className="text-primary hover:underline text-xs"
          >
            Bulk Edit
          </button>
        </div>
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          className="grid grid-cols-[1fr_1fr_1fr_auto] gap-px bg-border"
        >
          <div className="bg-background">
            <Input
              value={item.key}
              onChange={(e) => updateRow(item.id, "key", e.target.value, setter)}
              placeholder="Key"
              className="border-0 rounded-none h-9 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <div className="bg-background">
            <Input
              value={item.value}
              onChange={(e) => updateRow(item.id, "value", e.target.value, setter)}
              placeholder="Value"
              className="border-0 rounded-none h-9 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <div className="bg-background">
            <Input
              value={item.description}
              onChange={(e) => updateRow(item.id, "description", e.target.value, setter)}
              placeholder="Description"
              className="border-0 rounded-none h-9 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <div className="bg-background w-20 flex items-center justify-center">
            <button
              onClick={() => removeRow(item.id, setter)}
              className="p-1 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
      <button
        onClick={() => addRow(setter)}
        className="flex items-center gap-1 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Plus className="h-3 w-3" />
        Add row
      </button>
    </div>
  );

  const getEnabledCount = (items: KeyValuePair[]) =>
    items.filter((item) => item.key.trim()).length;

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Request Name Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-2">
        <div className="flex items-center gap-2">
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">List Companies</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Examples</span>
          <span className="bg-muted px-1.5 py-0.5 rounded">0</span>
        </div>
      </div>

      {/* URL Bar */}
      <div className="flex items-center gap-2 border-b border-border p-3">
        <Select value={method} onValueChange={(v) => { const m = asEnum(v, HTTP_METHODS); if (m) setMethod(m); }}>
          <SelectTrigger className={cn("w-24 font-medium", methodColors[method])}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HTTP_METHODS.map((m) => (
              <SelectItem key={m} value={m} className={methodColors[m]}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 font-mono text-sm"
          placeholder="Enter request URL"
        />
        <Button
          onClick={handleSend}
          disabled={isLoading}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6"
        >
          <Send className="h-4 w-4 mr-2" />
          Send
        </Button>
      </div>

      {/* Request Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent h-auto p-0">
          <TabsTrigger
            value="params"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-sm"
          >
            Params
          </TabsTrigger>
          <TabsTrigger
            value="authorization"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-sm"
          >
            Authorization
          </TabsTrigger>
          <TabsTrigger
            value="headers"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-sm"
          >
            Headers ({getEnabledCount(headers)})
          </TabsTrigger>
          <TabsTrigger
            value="body"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-sm"
          >
            Body
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-auto">
          <TabsContent value="params" className="m-0 h-full">
            <div className="text-xs text-muted-foreground px-3 py-2 border-b border-border">
              Query Params
            </div>
            {renderKeyValueTable(queryParams, setQueryParams)}
          </TabsContent>

          <TabsContent value="authorization" className="m-0 p-4">
            <div className="text-sm text-muted-foreground">
              This request is using Bearer Token from the collection.
            </div>
          </TabsContent>

          <TabsContent value="headers" className="m-0 h-full">
            {renderKeyValueTable(headers, setHeaders)}
          </TabsContent>

          <TabsContent value="body" className="m-0 h-full">
            <div className="p-3 h-full">
              <textarea
                value={bodyContent}
                onChange={(e) => setBodyContent(e.target.value)}
                className="w-full h-32 p-3 font-mono text-sm bg-card border border-border rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Request body (JSON)"
              />
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Response Section */}
      {response && (
        <div className="border-t border-border flex-1 flex flex-col max-h-[45%]">
          <Tabs value={responseTab} onValueChange={setResponseTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-3">
              <TabsList className="h-auto p-0 bg-transparent">
                <TabsTrigger
                  value="body"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-2 text-sm"
                >
                  Body
                </TabsTrigger>
                <TabsTrigger
                  value="cookies"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-2 text-sm"
                >
                  Cookies (5)
                </TabsTrigger>
                <TabsTrigger
                  value="response-headers"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-2 text-sm"
                >
                  Headers (26)
                </TabsTrigger>
                <TabsTrigger
                  value="test-results"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 py-2 text-sm"
                >
                  Test Results (0/1)
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-green-500 font-medium">
                  {response.status} {response.statusText}
                </span>
                <span className="text-muted-foreground">{response.time}ms</span>
                <span className="text-muted-foreground">{response.size}</span>
                <button className="text-primary hover:underline">Save Response</button>
              </div>
            </div>

            <TabsContent value="body" className="m-0 flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                <div className="flex rounded-md bg-muted">
                  {(["pretty", "raw", "preview"] as ResponseViewMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setResponseViewMode(mode)}
                      className={cn(
                        "px-3 py-1 text-xs font-medium capitalize transition-colors",
                        responseViewMode === mode
                          ? "bg-background text-foreground shadow-sm rounded-md"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                <Select defaultValue="json">
                  <SelectTrigger className="w-20 h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="xml">XML</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex-1" />
                <button className="p-1 text-muted-foreground hover:text-foreground">
                  <Copy className="h-4 w-4" />
                </button>
                <button className="p-1 text-muted-foreground hover:text-foreground">
                  <Search className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-3 bg-card">
                <pre className="text-xs font-mono leading-relaxed">
                  {response.body.split("\n").map((line, i) => (
                    <div key={i} className="flex">
                      <span className="mr-4 inline-block w-4 select-none text-right text-muted-foreground/50">
                        {i + 1}
                      </span>
                      <span className="text-foreground">{highlightJson(line)}</span>
                    </div>
                  ))}
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="cookies" className="m-0 p-4">
              <div className="text-sm text-muted-foreground">5 cookies received</div>
            </TabsContent>

            <TabsContent value="response-headers" className="m-0 p-4">
              <div className="text-sm text-muted-foreground">26 headers received</div>
            </TabsContent>

            <TabsContent value="test-results" className="m-0 p-4">
              <div className="text-sm text-muted-foreground">0 of 1 tests passed</div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

function highlightJson(line: string): React.ReactNode {
  // Highlight JSON keys
  const keyMatch = line.match(/^(\s*)("[\w_]+")(:)/);
  if (keyMatch) {
    const [, indent, key, colon] = keyMatch;
    const rest = line.slice(keyMatch[0].length);
    return (
      <>
        {indent}
        <span className="text-purple-500 dark:text-purple-400">{key}</span>
        {colon}
        {highlightValue(rest)}
      </>
    );
  }
  return highlightValue(line);
}

function highlightValue(text: string): React.ReactNode {
  // Highlight strings
  if (text.match(/^\s*"[^"]*"/)) {
    return <span className="text-green-600 dark:text-green-400">{text}</span>;
  }
  // Highlight booleans
  if (text.match(/^\s*(true|false)/)) {
    return <span className="text-blue-500 dark:text-blue-400">{text}</span>;
  }
  // Highlight numbers
  if (text.match(/^\s*\d+/)) {
    return <span className="text-orange-500 dark:text-orange-400">{text}</span>;
  }
  return text;
}
