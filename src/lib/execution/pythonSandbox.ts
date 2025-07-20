import {
  ExecutionResult,
  PythonInputRequest,
  InputRequirement,
} from '@/types/artifacts';

// Pyodide types
interface PyodideInterface {
  runPython: (code: string) => unknown;
  loadPackage: (
    packages: string[],
    options?: { messageCallback?: (msg: string) => void }
  ) => Promise<void>;
  globals: {
    get: (name: string) => unknown;
    set: (name: string, value: unknown) => void;
  };
}

declare global {
  interface Window {
    loadPyodide: (config: {
      indexURL: string;
      stdout?: (text: string) => void;
      stderr?: (text: string) => void;
    }) => Promise<PyodideInterface>;
  }
}

export class PythonSandbox {
  private pyodide: PyodideInterface | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private id: string;
  private onInputRequest?: (request: PythonInputRequest) => void;
  private presetInputs: string[] = [];
  private inputIndex = 0;

  constructor(onInputRequest?: (request: PythonInputRequest) => void) {
    this.id = `python-sandbox-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    this.onInputRequest = onInputRequest;
  }

  static createInstance(
    onInputRequest?: (request: PythonInputRequest) => void
  ): PythonSandbox {
    return new PythonSandbox(onInputRequest);
  }

  private async initializePyodide(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        // Load Pyodide from CDN
        const pyodideScript = document.createElement('script');
        pyodideScript.src =
          'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';

        await new Promise((resolve, reject) => {
          pyodideScript.onload = resolve;
          pyodideScript.onerror = reject;
          document.head.appendChild(pyodideScript);
        });

        // Initialize Pyodide
        this.pyodide = await window.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
          stdout: (text: string) => {
            this.captureOutput('stdout', text);
          },
          stderr: (text: string) => {
            this.captureOutput('stderr', text);
          },
        });

        // Set up input function that uses preset values and browser prompt fallback
        if (this.pyodide) {
          // Make sandbox instance available to Python
          this.pyodide.globals.set('_sandbox_instance', this);

          this.pyodide.runPython(`
import sys
import io
import builtins
import js

# Input management from JavaScript
class InputManager:
    def __init__(self, sandbox_instance):
        self.preset_inputs = []
        self.input_index = 0
        self.sandbox_instance = sandbox_instance
    
    def set_inputs(self, inputs):
        self.preset_inputs = inputs
        self.input_index = 0
    
    def get_next_input(self, prompt=""):
        if prompt:
            print(prompt, end="")
        
        if self.input_index < len(self.preset_inputs):
            value = str(self.preset_inputs[self.input_index])
            self.input_index += 1
            print(value)  # Echo the input
            return value
        
        # Use browser prompt for runtime input requests
        try:
            # Call browser prompt through JavaScript
            result = js.prompt(prompt if prompt else "Enter input:")
            if result is None:  # User cancelled
                result = ""
            result = str(result)
            print(result)  # Echo the input
            return result
        except Exception as e:
            # Fallback to smart default values if prompt fails
            prompt_lower = prompt.lower() if prompt else ""
            
            # Numeric inputs
            if any(word in prompt_lower for word in ["number", "guess", "age", "count", "score", "value", "int", "float"]):
                print("42")  # Echo default
                return "42"
            
            # Yes/No questions
            elif any(word in prompt_lower for word in ["yes", "no", "y/n", "true", "false"]):
                print("yes")  # Echo default
                return "yes"
            
            # Name inputs
            elif any(word in prompt_lower for word in ["name", "username", "user"]):
                print("User")  # Echo default
                return "User"
            
            # Email inputs
            elif "email" in prompt_lower:
                print("user@example.com")  # Echo default
                return "user@example.com"
            
            # Operation/choice inputs
            elif any(word in prompt_lower for word in ["operation", "choice", "select", "option"]):
                if any(op in prompt_lower for op in ["+", "-", "*", "/"]):
                    print("+")  # Echo default
                    return "+"
                print("1")  # Echo default
                return "1"
            
            # Generic fallback
            else:
                print("1")  # Echo default
                return "1"

# Create global input manager with sandbox reference
_input_manager = InputManager(_sandbox_instance)

# Replace built-in input
builtins.input = _input_manager.get_next_input

# Utility function to set input values
def set_input_values(*values):
    """Set preset input values for input() calls. Call this before running code that uses input()."""
    _input_manager.set_inputs(list(values))
    print(f"✓ Set {len(values)} input values: {list(values)}")

# Make it available globally
builtins.set_input_values = set_input_values

# Store original open function
_original_open = builtins.open

def safe_open(filename, mode='r', **kwargs):
    if isinstance(filename, (str, bytes)) and not filename.startswith('/dev/'):
        raise OSError("File operations are restricted in this environment. Use StringIO for in-memory file operations.")
    return _original_open(filename, mode, **kwargs)

# Override open function
builtins.open = safe_open
          `);
        }

        // Don't preload packages - load them on demand instead
        // This prevents initialization failures due to network issues
        this.isInitialized = true;
      } catch (error) {
        console.error('Failed to initialize Pyodide:', error);
        throw new Error('Failed to initialize Python runtime');
      }
    })();

    return this.initPromise;
  }

  private outputBuffer: Array<{ type: 'stdout' | 'stderr'; content: string }> =
    [];

  private captureOutput(type: 'stdout' | 'stderr', content: string) {
    this.outputBuffer.push({ type, content });
  }

  private async autoLoadPackages(code: string): Promise<void> {
    if (!this.pyodide) return;

    // Map of import patterns to package names
    const packageMap: { [key: string]: string } = {
      'import numpy': 'numpy',
      'from numpy': 'numpy',
      'import pandas': 'pandas',
      'from pandas': 'pandas',
      'import matplotlib': 'matplotlib',
      'from matplotlib': 'matplotlib',
      'import scipy': 'scipy',
      'from scipy': 'scipy',
      'import requests': 'requests',
      'from requests': 'requests',
      'import sympy': 'sympy',
      'from sympy': 'sympy',
      'import pygame': 'pygame',
      'from pygame': 'pygame',
    };

    const packagesToLoad: string[] = [];

    for (const [pattern, packageName] of Object.entries(packageMap)) {
      if (code.includes(pattern) && !packagesToLoad.includes(packageName)) {
        packagesToLoad.push(packageName);
      }
    }

    if (packagesToLoad.length > 0) {
      try {
        console.log(`Auto-loading packages: ${packagesToLoad.join(', ')}`);
        await this.pyodide.loadPackage(packagesToLoad, {
          messageCallback: (message: string) => {
            console.log('Loading:', message);
          },
        });
      } catch (error) {
        console.warn('Failed to auto-load some packages:', error);
        // Continue execution even if package loading fails
      }
    }
  }

  async executeCode(code: string): Promise<ExecutionResult> {
    try {
      await this.initializePyodide();

      if (!this.pyodide) {
        throw new Error('Python runtime not initialized');
      }

      // Auto-load packages based on imports in the code
      await this.autoLoadPackages(code);

      // Clear previous output
      this.outputBuffer = [];

      // Reset input index for new execution
      this.inputIndex = 0;

      // Set preset inputs in Python if any are available
      if (this.presetInputs.length > 0) {
        this.pyodide.runPython(`
_input_manager.set_inputs(${JSON.stringify(this.presetInputs)})
        `);
      }

      const startTime = performance.now();

      // Execute the Python code
      let result;
      try {
        // Use runPython for execution
        result = this.pyodide.runPython(code);

        // If result is a Python object, convert it to JavaScript
        if (
          result &&
          typeof (result as { toJs?: () => unknown }).toJs === 'function'
        ) {
          result = (result as { toJs: () => unknown }).toJs();
        }
      } catch (pythonError: unknown) {
        const endTime = performance.now();
        let errorMessage =
          pythonError instanceof Error
            ? pythonError.message
            : String(pythonError);

        // Provide helpful error messages for common issues
        if (
          errorMessage.includes('OSError') &&
          errorMessage.includes('I/O error')
        ) {
          errorMessage +=
            '\n\nHint: This error often occurs when using input() or file operations. Try using set_input_values() before running code that needs user input, or use StringIO for in-memory file operations.';
        } else if (errorMessage.includes('input')) {
          errorMessage +=
            '\n\nHint: Use set_input_values("value1", "value2", ...) before running code that requires user input.';
        } else if (
          errorMessage.includes('open') &&
          errorMessage.includes('No such file')
        ) {
          errorMessage +=
            '\n\nHint: File operations are restricted. Use StringIO for in-memory file operations or create data directly in variables.';
        }

        return {
          success: false,
          error: errorMessage,
          logs: this.formatOutput(),
          executionTime: endTime - startTime,
        };
      }

      const endTime = performance.now();

      return {
        success: true,
        output: result,
        logs: this.formatOutput(),
        executionTime: endTime - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        logs: this.formatOutput(),
      };
    }
  }

  private formatOutput(): string[] {
    return this.outputBuffer.map(({ type, content }) => {
      if (type === 'stderr') {
        return `Error: ${content}`;
      }
      return content;
    });
  }

  async installPackage(packageName: string): Promise<boolean> {
    try {
      await this.initializePyodide();
      if (this.pyodide) {
        await this.pyodide.loadPackage([packageName]);
      }
      return true;
    } catch (error) {
      console.error(`Failed to install package ${packageName}:`, error);
      return false;
    }
  }

  async installPackages(packageNames: string[]): Promise<boolean> {
    try {
      await this.initializePyodide();
      if (this.pyodide) {
        await this.pyodide.loadPackage(packageNames);
      }
      return true;
    } catch (error) {
      console.error('Failed to install packages:', error);
      return false;
    }
  }

  isReady(): boolean {
    return this.isInitialized && this.pyodide !== null;
  }

  getAvailablePackages(): string[] {
    return [
      'numpy',
      'pandas',
      'matplotlib',
      'scipy',
      'scikit-learn',
      'requests',
      'beautifulsoup4',
      'pillow',
      'sympy',
      'plotly',
      'seaborn',
      'statsmodels',
    ];
  }

  async runCode(code: string): Promise<ExecutionResult> {
    return this.executeCode(code);
  }

  // Methods for managing input values
  setInputValues(inputs: string[]): void {
    this.presetInputs = inputs;
    this.inputIndex = 0;
  }

  addInputValue(input: string): void {
    this.presetInputs.push(input);
  }

  clearInputValues(): void {
    this.presetInputs = [];
    this.inputIndex = 0;
  }

  getInputValues(): string[] {
    return [...this.presetInputs];
  }

  getRemainingInputs(): string[] {
    return this.presetInputs.slice(this.inputIndex);
  }

  // Analyze code to predict input requirements
  analyzeInputRequirements(code: string): InputRequirement[] {
    const inputCalls: InputRequirement[] = [];

    // Find input() calls with regex
    const inputRegex = /input\s*\(\s*["']([^"']*?)["']\s*\)/g;
    let match;

    while ((match = inputRegex.exec(code)) !== null) {
      const prompt = match[1];
      let suggestion = '1'; // Default fallback

      const promptLower = prompt.toLowerCase();

      // Smart suggestions based on prompt content
      if (promptLower.includes('name')) {
        suggestion = 'User';
      } else if (promptLower.includes('age')) {
        suggestion = '25';
      } else if (promptLower.includes('email')) {
        suggestion = 'user@example.com';
      } else if (
        promptLower.includes('number') ||
        promptLower.includes('guess')
      ) {
        suggestion = '42';
      } else if (promptLower.includes('yes') || promptLower.includes('no')) {
        suggestion = 'yes';
      }

      inputCalls.push({ prompt, suggestion });
    }

    return inputCalls;
  }

  dispose(): void {
    // Pyodide doesn't have a built-in dispose method
    // We can clear references and let garbage collection handle it
    this.pyodide = null;
    this.isInitialized = false;
    this.initPromise = null;
    this.outputBuffer = [];
    this.presetInputs = [];
    this.inputIndex = 0;
  }
}
