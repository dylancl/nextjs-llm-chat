import {
  ExecutionResult,
  SandboxOptions,
  PythonInputRequest,
  InputRequirement,
} from '@/types/artifacts';
import { PythonSandbox } from './pythonSandbox';

export class CodeSandbox {
  private iframe: HTMLIFrameElement | null = null;
  private pythonSandbox: PythonSandbox | null = null;
  private options: SandboxOptions;
  private id: string;
  private onInputRequest?: (request: PythonInputRequest) => void;

  constructor(options: SandboxOptions = {}) {
    this.options = {
      timeout: 20000,
      allowedApis: ['console', 'Math', 'JSON', 'Date'],
      restrictions: ['fetch', 'XMLHttpRequest', 'WebSocket'],
      ...options,
    };
    this.onInputRequest = options.onInputRequest;
    this.id = `sandbox-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    this.createSandbox();
  }

  // Remove singleton pattern - each artifact should have its own sandbox
  static createInstance(options?: SandboxOptions): CodeSandbox {
    return new CodeSandbox(options);
  }

  private createSandbox(): void {
    this.iframe = document.createElement('iframe');
    this.iframe.style.display = 'none';
    this.iframe.setAttribute('sandbox', 'allow-scripts');
    this.iframe.id = this.id; // Give each iframe a unique ID
    this.iframe.srcdoc = this.getSandboxHTML();
    document.body.appendChild(this.iframe);
  }

  private getSandboxHTML(): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { margin: 0; padding: 20px; font-family: system-ui, sans-serif; }
            .error { color: red; background: #fee; padding: 10px; border-radius: 4px; }
            .output { margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div id="output"></div>
          <script>
            const originalConsole = console;
            const logs = [];
            
            // Override console methods to capture output
            console = {
              log: (...args) => {
                logs.push({ type: 'log', args });
                originalConsole.log(...args);
                displayOutput('log', args);
              },
              error: (...args) => {
                logs.push({ type: 'error', args });
                originalConsole.error(...args);
                displayOutput('error', args);
              },
              warn: (...args) => {
                logs.push({ type: 'warn', args });
                originalConsole.warn(...args);
                displayOutput('warn', args);
              },
              info: (...args) => {
                logs.push({ type: 'info', args });
                originalConsole.info(...args);
                displayOutput('info', args);
              }
            };

            function displayOutput(type, args) {
              const output = document.getElementById('output');
              const div = document.createElement('div');
              div.className = 'output ' + type;
              div.textContent = args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
              ).join(' ');
              output.appendChild(div);
            }

            function executeCode(code) {
              const output = document.getElementById('output');
              output.innerHTML = '';
              logs.length = 0;
              
              try {
                const startTime = performance.now();
                const result = eval(code);
                const endTime = performance.now();
                
                return {
                  success: true,
                  output: result,
                  logs: logs,
                  executionTime: endTime - startTime
                };
              } catch (error) {
                displayOutput('error', [error.message]);
                return {
                  success: false,
                  error: error.message,
                  logs: logs
                };
              }
            }

            // Listen for messages from parent
            window.addEventListener('message', (event) => {
              if (event.data.type === 'execute') {
                const result = executeCode(event.data.code);
                event.source.postMessage({ type: 'result', result }, event.origin);
              }
            });
          </script>
        </body>
      </html>
    `;
  }

  async executeCode(code: string, language: string): Promise<ExecutionResult> {
    // Handle Python execution
    if (language === 'python' || language === 'py') {
      if (!this.pythonSandbox) {
        this.pythonSandbox = PythonSandbox.createInstance(this.onInputRequest);
      }
      return await this.pythonSandbox.executeCode(code);
    }

    // Handle JavaScript execution
    if (!this.iframe || !this.iframe.contentWindow) {
      throw new Error('Sandbox not initialized');
    }

    if (language !== 'javascript' && language !== 'js') {
      return {
        success: false,
        error: `Language ${language} is not supported for execution`,
      };
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Code execution timed out'));
      }, this.options.timeout);

      const messageHandler = (event: MessageEvent) => {
        if (event.data.type === 'result') {
          clearTimeout(timeout);
          window.removeEventListener('message', messageHandler);
          resolve(event.data.result);
        }
      };

      window.addEventListener('message', messageHandler);

      this.iframe!.contentWindow!.postMessage(
        {
          type: 'execute',
          code: this.sanitizeCode(code),
        },
        '*'
      );
    });
  }

  async executeHtml(html: string, css?: string, js?: string): Promise<void> {
    if (!this.iframe) {
      throw new Error('Sandbox not initialized');
    }

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { margin: 0; padding: 20px; font-family: system-ui, sans-serif; }
            ${css || ''}
          </style>
        </head>
        <body>
          ${html}
          <script>
            ${js || ''}
          </script>
        </body>
      </html>
    `;

    this.iframe.srcdoc = fullHtml;
  }

  async executeReact(componentCode: string): Promise<void> {
    // This would require a more sophisticated setup with Babel for JSX transformation
    // For now, we'll throw an error indicating this needs additional setup
    void componentCode; // Acknowledge the parameter to avoid lint warnings
    throw new Error(
      'React component execution requires additional setup with Babel transpilation'
    );
  }

  private sanitizeCode(code: string): string {
    // Remove potentially dangerous APIs
    let sanitized = code;

    this.options.restrictions?.forEach((restriction) => {
      const regex = new RegExp(`\\b${restriction}\\b`, 'g');
      sanitized = sanitized.replace(regex, '/* RESTRICTED */');
    });

    return sanitized;
  }

  // Python-specific input management methods
  analyzeInputRequirements(code: string): InputRequirement[] {
    if (!this.pythonSandbox) {
      this.pythonSandbox = PythonSandbox.createInstance(this.onInputRequest);
    }
    return this.pythonSandbox.analyzeInputRequirements(code);
  }

  setInputValues(inputs: string[]): void {
    if (!this.pythonSandbox) {
      this.pythonSandbox = PythonSandbox.createInstance(this.onInputRequest);
    }
    this.pythonSandbox.setInputValues(inputs);
  }

  clearInputValues(): void {
    if (this.pythonSandbox) {
      this.pythonSandbox.clearInputValues();
    }
  }

  getInputValues(): string[] {
    if (!this.pythonSandbox) {
      return [];
    }
    return this.pythonSandbox.getInputValues();
  }

  dispose(): void {
    if (this.iframe && this.iframe.parentNode) {
      this.iframe.parentNode.removeChild(this.iframe);
      this.iframe = null;
    }
    if (this.pythonSandbox) {
      this.pythonSandbox.dispose();
      this.pythonSandbox = null;
    }
  }
}
