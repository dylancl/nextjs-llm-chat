'use client';

import { memo, useState, useRef, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { useTheme } from 'next-themes';
import {
  duotoneDark,
  duotoneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Artifact,
  ExecutionResult,
  PythonInputRequest,
  InputRequirement,
} from '@/types/artifacts';
import { CodeSandbox } from '@/lib/execution/sandbox';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, Square, Lightbulb } from 'lucide-react';
import { PythonInputModal } from '@/components/PythonInputModal';
import { PythonInputConfigModal } from '@/components/PythonInputConfigModal';

interface CodeRendererProps {
  artifact: Artifact;
}

export const CodeRenderer = memo(function CodeRenderer({
  artifact,
}: CodeRendererProps) {
  const { theme } = useTheme();
  const [isExecuting, setIsExecuting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [executionResult, setExecutionResult] =
    useState<ExecutionResult | null>(null);

  // Input modal state
  const [inputModalOpen, setInputModalOpen] = useState(false);
  const [inputPrompt, setInputPrompt] = useState('');
  const [inputRequestRef, setInputRequestRef] =
    useState<PythonInputRequest | null>(null);

  // Input configuration modal state
  const [inputConfigModalOpen, setInputConfigModalOpen] = useState(false);
  const [detectedInputs, setDetectedInputs] = useState<InputRequirement[]>([]);

  // Create a ref to hold the sandbox instance for this specific artifact
  const sandboxRef = useRef<CodeSandbox | null>(null);

  // Create sandbox instance when component mounts
  useEffect(() => {
    if (artifact.isExecutable && !sandboxRef.current) {
      // Create input request handler
      const handleInputRequest = (request: PythonInputRequest) => {
        setInputPrompt(request.prompt);
        setInputRequestRef(request);
        setInputModalOpen(true);
      };

      sandboxRef.current = CodeSandbox.createInstance({
        onInputRequest: handleInputRequest,
      });
    }

    // Cleanup when component unmounts
    return () => {
      if (sandboxRef.current) {
        sandboxRef.current.dispose();
        sandboxRef.current = null;
      }
    };
  }, [artifact.isExecutable]);

  const handleExecute = async () => {
    if (!artifact.isExecutable || !sandboxRef.current) return;

    // Show initialization state for Python
    const isPython =
      artifact.language === 'python' || artifact.language === 'py';
    if (isPython) {
      setIsInitializing(true);
    }

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      const result = await sandboxRef.current.executeCode(
        artifact.content,
        artifact.language || 'javascript'
      );
      setExecutionResult(result);
    } catch (error) {
      setExecutionResult({
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsExecuting(false);
      setIsInitializing(false);
    }
  };

  const handleConfigureInputs = () => {
    if (!sandboxRef.current) return;

    // Analyze the code for input requirements
    const requirements = sandboxRef.current.analyzeInputRequirements(
      artifact.content
    );
    setDetectedInputs(requirements);
    setInputConfigModalOpen(true);
  };

  const handleExecuteWithInputs = async (presetInputs: string[]) => {
    if (!artifact.isExecutable || !sandboxRef.current) return;

    // Set the preset inputs
    sandboxRef.current.setInputValues(presetInputs);

    // Execute the code
    await handleExecute();
  };

  const handleStop = () => {
    setIsExecuting(false);
    setIsInitializing(false);
    setExecutionResult(null);
  };

  const handleClear = () => {
    setExecutionResult(null);
    // Reset the sandbox to clear any previous execution state
    if (sandboxRef.current) {
      sandboxRef.current.dispose();

      // Create new sandbox with input handler
      const handleInputRequest = (request: PythonInputRequest) => {
        setInputPrompt(request.prompt);
        setInputRequestRef(request);
        setInputModalOpen(true);
      };

      sandboxRef.current = CodeSandbox.createInstance({
        onInputRequest: handleInputRequest,
      });
    }
  };

  // Handle input modal submission
  const handleInputSubmit = (value: string) => {
    if (inputRequestRef) {
      inputRequestRef.resolve(value);
      setInputRequestRef(null);
    }
    setInputModalOpen(false);
    setInputPrompt('');
  };

  // Handle input modal cancellation
  const handleInputCancel = () => {
    if (inputRequestRef) {
      inputRequestRef.reject(new Error('Input cancelled by user'));
      setInputRequestRef(null);
    }
    setInputModalOpen(false);
    setInputPrompt('');
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Code Display - Takes up main space */}
      <div className="relative flex-1 min-h-0">
        <div className="h-full overflow-auto">
          <SyntaxHighlighter
            language={artifact.language || 'text'}
            style={
              theme === 'dark' || theme === 'system'
                ? duotoneDark
                : duotoneLight
            }
            customStyle={{
              margin: 0,
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              lineHeight: '1.5',
              height: '100%',
            }}
            showLineNumbers={artifact.content.split('\n').length > 10}
            wrapLongLines
          >
            {artifact.content}
          </SyntaxHighlighter>
        </div>

        {/* Execute button overlay for executable code */}
        {artifact.isExecutable && (
          <div className="absolute top-3 right-3 flex gap-2">
            {/* Configure Inputs button for Python */}
            {(artifact.language === 'python' || artifact.language === 'py') &&
              !isExecuting &&
              !isInitializing && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleConfigureInputs}
                  className="h-8 px-3 text-xs"
                  title="Configure input values for input() calls"
                >
                  <Lightbulb className="h-3 w-3 mr-1" />
                  Configure Inputs
                </Button>
              )}

            {/* Main execution button */}
            {isInitializing ? (
              <Button
                size="sm"
                variant="secondary"
                disabled
                className="h-8 px-3 text-xs"
              >
                <div className="h-3 w-3 mr-1 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                Initializing Python...
              </Button>
            ) : isExecuting ? (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleStop}
                className="h-8 px-3 text-xs"
              >
                <Square className="h-3 w-3 mr-1" />
                Stop
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleExecute}
                className="h-8 px-3 text-xs"
              >
                <Play className="h-3 w-3 mr-1" />
                Run
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Execution Result */}
      {executionResult && (
        <div className="space-y-2 shrink-0 max-h-64 overflow-auto">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">Output:</h4>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClear}
              className="h-6 px-2 text-xs"
            >
              Clear
            </Button>
          </div>

          {executionResult.success ? (
            <div className="space-y-2">
              {/* Show output if available */}
              {executionResult.output !== undefined && (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="text-sm text-green-800 dark:text-green-200">
                    Result:{' '}
                    {typeof executionResult.output === 'object'
                      ? JSON.stringify(executionResult.output, null, 2)
                      : String(executionResult.output)}
                  </div>
                </div>
              )}

              {/* Show console logs */}
              {executionResult.logs && executionResult.logs.length > 0 && (
                <div className="p-3 bg-muted/50 rounded-lg border border-border">
                  <div className="text-xs text-muted-foreground mb-2">
                    Console Output:
                  </div>
                  {executionResult.logs.map((log, index) => (
                    <div
                      key={index}
                      className="text-sm font-mono text-foreground"
                    >
                      {typeof log === 'string' ? log : JSON.stringify(log)}
                    </div>
                  ))}
                </div>
              )}

              {/* Show execution time */}
              {executionResult.executionTime && (
                <div className="text-xs text-muted-foreground">
                  Executed in {executionResult.executionTime.toFixed(2)}ms
                </div>
              )}
            </div>
          ) : (
            <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <AlertDescription className="text-red-800 dark:text-red-200">
                <strong>Error:</strong> {executionResult.error}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Dependencies */}
      {artifact.dependencies && artifact.dependencies.length > 0 && (
        <div className="text-xs text-muted-foreground shrink-0">
          <div className="font-medium mb-1">Dependencies:</div>
          <div className="flex flex-wrap gap-1">
            {artifact.dependencies.map((dep, index) => (
              <span key={index} className="px-2 py-1 bg-muted rounded text-xs">
                {dep}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Python Input Modal */}
      <PythonInputModal
        isOpen={inputModalOpen}
        prompt={inputPrompt}
        onSubmit={handleInputSubmit}
        onCancel={handleInputCancel}
      />

      {/* Python Input Configuration Modal */}
      <PythonInputConfigModal
        isOpen={inputConfigModalOpen}
        onClose={() => setInputConfigModalOpen(false)}
        onExecuteWithInputs={handleExecuteWithInputs}
        detectedInputs={detectedInputs}
      />
    </div>
  );
});
