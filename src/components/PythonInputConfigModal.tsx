'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Play, Lightbulb } from 'lucide-react';
import { InputRequirement } from '@/types/artifacts';

interface PythonInputConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteWithInputs: (inputs: string[]) => void;
  detectedInputs: InputRequirement[];
}

export function PythonInputConfigModal({
  isOpen,
  onClose,
  onExecuteWithInputs,
  detectedInputs,
}: PythonInputConfigModalProps) {
  const [inputValues, setInputValues] = useState<string[]>([]);
  const [customInputs, setCustomInputs] = useState<string[]>([]);

  // Initialize input values when modal opens or detected inputs change
  useEffect(() => {
    if (isOpen) {
      // Start with suggestions from detected inputs
      const initialValues = detectedInputs.map((req) => req.suggestion);
      setInputValues(initialValues);

      // If no detected inputs, start with one empty custom input
      if (detectedInputs.length === 0) {
        setCustomInputs(['']);
      } else {
        setCustomInputs([]);
      }
    }
  }, [isOpen, detectedInputs]);

  const updateInputValue = (index: number, value: string) => {
    const newValues = [...inputValues];
    newValues[index] = value;
    setInputValues(newValues);
  };

  const updateCustomInput = (index: number, value: string) => {
    const newCustom = [...customInputs];
    newCustom[index] = value;
    setCustomInputs(newCustom);
  };

  const addCustomInput = () => {
    setCustomInputs([...customInputs, '']);
  };

  const removeCustomInput = (index: number) => {
    const newCustom = customInputs.filter((_, i) => i !== index);
    setCustomInputs(newCustom);
  };

  const handleExecute = () => {
    // Combine detected inputs and custom inputs
    const allInputs = [
      ...inputValues.filter((v) => v.trim() !== ''),
      ...customInputs.filter((v) => v.trim() !== ''),
    ];

    onExecuteWithInputs(allInputs);
    onClose();
  };

  const handleExecuteWithDefaults = () => {
    // Execute with just the fallback behavior (no preset inputs)
    onExecuteWithInputs([]);
    onClose();
  };

  const totalInputs =
    inputValues.filter((v) => v.trim() !== '').length +
    customInputs.filter((v) => v.trim() !== '').length;

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Configure Python Inputs
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info Card */}
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-4">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                This Python code uses <code>input()</code> functions that
                require user interaction. Pre-configure the input values here to
                run the code smoothly.
              </p>
            </CardContent>
          </Card>

          {/* Detected Inputs */}
          {detectedInputs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">Detected Input Prompts</h3>
                <Badge variant="secondary">{detectedInputs.length}</Badge>
              </div>

              <div className="space-y-3">
                {detectedInputs.map((req, index) => (
                  <div key={index} className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">
                      {req.prompt || `Input #${index + 1}`}
                    </Label>
                    <Input
                      value={inputValues[index] || ''}
                      onChange={(e) => updateInputValue(index, e.target.value)}
                      placeholder={req.suggestion}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Additional Inputs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">Additional Inputs</h3>
                {customInputs.length > 0 && (
                  <Badge variant="outline">{customInputs.length}</Badge>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCustomInput}
                className="flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Input
              </Button>
            </div>

            {customInputs.length > 0 && (
              <div className="space-y-2">
                {customInputs.map((input, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => updateCustomInput(index, e.target.value)}
                      placeholder={`Additional input #${index + 1}`}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeCustomInput(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          {totalInputs > 0 && (
            <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <CardContent className="pt-4">
                <p className="text-sm text-green-700 dark:text-green-300">
                  ✓ Ready to execute with {totalInputs} preset input value
                  {totalInputs !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleExecuteWithDefaults}
            className="flex-1 sm:flex-none"
          >
            Use Defaults
          </Button>

          <Button
            type="button"
            onClick={handleExecute}
            className="flex-1 sm:flex-none flex items-center gap-1"
          >
            <Play className="w-4 h-4" />
            Execute
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
