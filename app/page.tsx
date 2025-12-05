"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import styles from "./Calculator.module.css";

type ButtonValue =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "."
  | "+"
  | "-"
  | "*"
  | "/"
  | "="
  | "C"
  | "⌫"
  | "("
  | ")"
  | "sin"
  | "cos"
  | "tan"
  | "asin"
  | "acos"
  | "atan"
  | "sinh"
  | "cosh"
  | "tanh"
  | "log"
  | "ln"
  | "exp"
  | "sqrt"
  | "cbrt"
  | "pow"
  | "pi"
  | "e"
  | "!"
  | "1/x"
  | "x²"
  | "^";

type AngleMode = "deg" | "rad";

function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) return NaN;
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

function safeEvaluate(expression: string, angleMode: AngleMode = "deg"): number | null {
  try {
    if (!expression || expression.trim() === "") {
      return null;
    }

    // Check for incomplete function calls (like "sin(" or "sin(30" without closing paren)
    // Count opening and closing parentheses
    const openParens = (expression.match(/\(/g) || []).length;
    const closeParens = (expression.match(/\)/g) || []).length;
    if (openParens > closeParens) {
      // Incomplete function call - don't evaluate yet
      return null;
    }

    // Check if expression ends with a function name followed by opening paren (incomplete)
    if (/[a-z]+\s*\($/.test(expression)) {
      return null;
    }

    // Replace constants first
    let processed = expression
      .replace(/π/g, Math.PI.toString())
      .replace(/\be\b/g, Math.E.toString());

    // Handle factorial before other operations
    processed = processed.replace(/(\d+(?:\.\d+)?)\s*!/g, (match, num) => {
      const n = parseFloat(num);
      const fact = factorial(n);
      return isNaN(fact) ? "NaN" : fact.toString();
    });

    // Handle x² (square) - must be before power operator
    processed = processed.replace(/(\d+(?:\.\d+)?)\s*²/g, "Math.pow($1,2)");
    
    // Handle 1/x - match pattern like "51/x" or "5.21/x"
    processed = processed.replace(/(\d+(?:\.\d+)?)1\/x/g, "(1/$1)");

    // Helper function to extract and replace function calls with proper argument handling
    // Handles balanced parentheses for nested function calls
    const replaceFunctionCall = (expr: string, funcName: string, jsFunc: string, needsDegConversion: boolean): string => {
      const funcPattern = new RegExp(`\\b${funcName}\\s*\\(`, "g");
      let result = expr;
      let match;
      
      // Find all function calls and replace them from right to left to preserve indices
      const matches: Array<{ start: number; end: number; arg: string }> = [];
      let searchIndex = 0;
      
      while ((match = funcPattern.exec(expr)) !== null) {
        const funcStart = match.index;
        const parenStart = funcStart + match[0].length;
        let parenCount = 1;
        let i = parenStart;
        
        // Find the matching closing parenthesis
        while (i < expr.length && parenCount > 0) {
          if (expr[i] === '(') parenCount++;
          else if (expr[i] === ')') parenCount--;
          i++;
        }
        
        if (parenCount === 0) {
          const arg = expr.substring(parenStart, i - 1);
          matches.push({ start: funcStart, end: i, arg });
        }
      }
      
      // Replace from right to left to preserve indices
      for (let j = matches.length - 1; j >= 0; j--) {
        const { start, end, arg } = matches[j];
        let replacement;
        if (needsDegConversion && angleMode === "deg") {
          replacement = `Math.${jsFunc}(Math.PI/180*(${arg}))`;
        } else {
          replacement = `Math.${jsFunc}(${arg})`;
        }
        result = result.substring(0, start) + replacement + result.substring(end);
      }
      
      return result;
    };

    // Replace function calls - handle each function type
    const functionsToReplace = [
      { name: "asin", js: "asin", deg: true },
      { name: "acos", js: "acos", deg: true },
      { name: "atan", js: "atan", deg: true },
      { name: "sinh", js: "sinh", deg: false },
      { name: "cosh", js: "cosh", deg: false },
      { name: "tanh", js: "tanh", deg: false },
      { name: "sqrt", js: "sqrt", deg: false },
      { name: "cbrt", js: "cbrt", deg: false },
      { name: "sin", js: "sin", deg: true },
      { name: "cos", js: "cos", deg: true },
      { name: "tan", js: "tan", deg: true },
      { name: "log", js: "log10", deg: false },
      { name: "ln", js: "log", deg: false },
      { name: "exp", js: "exp", deg: false },
    ];

    // Process longer names first to avoid partial matches
    functionsToReplace.sort((a, b) => b.name.length - a.name.length);
    
    for (const func of functionsToReplace) {
      processed = replaceFunctionCall(processed, func.name, func.js, func.deg);
    }

    // Handle power operator (^) - must be after function replacements
    processed = processed.replace(/(\d+(?:\.\d+)?)\s*\^\s*(\d+(?:\.\d+)?)/g, "Math.pow($1,$2)");

    // Check for empty or invalid expressions
    if (!processed || processed.trim() === "") {
      return null;
    }

    // Check for trailing operators (but allow closing parentheses)
    if (/[\+\-\*\/]$/.test(processed.trim())) {
      return null;
    }

    // Replace multiple consecutive operators with the last one
    let normalized = processed.replace(/[\+\-\*\/]+/g, (match) => {
      const last = match[match.length - 1];
      return last;
    });

    // Handle negative numbers at the start
    if (normalized.trim().startsWith("-")) {
      normalized = "0" + normalized;
    }

    // Use Function constructor to evaluate
    const result = Function(`"use strict"; return (${normalized})`)();
    
    if (typeof result !== "number" || !isFinite(result) || isNaN(result)) {
      return null;
    }

    return result;
  } catch (error) {
    // Log error for debugging (can be removed in production)
    console.error("Evaluation error:", error, "Expression:", expression);
    return null;
  }
}

function formatNumber(num: number): string {
  // Format to avoid scientific notation and limit decimal places
  if (num % 1 === 0) {
    return num.toString();
  }
  
  // Limit to 12 decimal places
  const rounded = Math.round(num * 1000000000000) / 1000000000000;
  return rounded.toString();
}

export default function Calculator() {
  const [expression, setExpression] = useState<string>("");
  const [result, setResult] = useState<string>("0");
  const [hasError, setHasError] = useState<boolean>(false);
  const [angleMode, setAngleMode] = useState<AngleMode>("deg");
  const expressionRef = useRef(expression);
  const hasErrorRef = useRef(hasError);

  useEffect(() => {
    expressionRef.current = expression;
  }, [expression]);

  useEffect(() => {
    hasErrorRef.current = hasError;
  }, [hasError]);

  const updateResult = (expr: string) => {
    if (expr === "") {
      setResult("0");
      setHasError(false);
      return;
    }

    // Check for incomplete function calls - don't evaluate if parentheses don't match
    const openParens = (expr.match(/\(/g) || []).length;
    const closeParens = (expr.match(/\)/g) || []).length;
    if (openParens > closeParens) {
      // Incomplete - try to evaluate what we have so far, or show previous result
      // Try to evaluate the part before the incomplete function call
      const lastOpenParen = expr.lastIndexOf("(");
      if (lastOpenParen > 0) {
        const beforeIncomplete = expr.substring(0, lastOpenParen);
        if (beforeIncomplete) {
          const evaluated = safeEvaluate(beforeIncomplete, angleMode);
          if (evaluated !== null) {
            setResult(formatNumber(evaluated));
            setHasError(false);
            return;
          }
        }
      }
      // If we can't evaluate, just show 0 or keep previous result
      setResult("0");
      setHasError(false);
      return;
    }

    // If expression ends with an operator, evaluate without it
    if (/[\+\-\*\/]$/.test(expr)) {
      const exprWithoutOperator = expr.slice(0, -1);
      if (exprWithoutOperator === "") {
        setResult("0");
        setHasError(false);
        return;
      }
      const evaluated = safeEvaluate(exprWithoutOperator, angleMode);
      if (evaluated === null) {
        setResult("Error");
        setHasError(true);
      } else {
        setResult(formatNumber(evaluated));
        setHasError(false);
      }
      return;
    }

    // If expression ends with a function name (like "sin" without opening paren), don't evaluate
    if (/[a-z]+\s*$/.test(expr) && !expr.endsWith(")")) {
      // Remove the trailing function name and evaluate what's before it
      const exprWithoutFunction = expr.replace(/[a-z]+\s*$/, "");
      if (exprWithoutFunction === "") {
        setResult("0");
        setHasError(false);
        return;
      }
      const evaluated = safeEvaluate(exprWithoutFunction, angleMode);
      if (evaluated === null) {
        setResult("Error");
        setHasError(true);
      } else {
        setResult(formatNumber(evaluated));
        setHasError(false);
      }
      return;
    }

    const evaluated = safeEvaluate(expr, angleMode);
    if (evaluated === null) {
      setResult("Error");
      setHasError(true);
    } else {
      setResult(formatNumber(evaluated));
      setHasError(false);
    }
  };

  const handleButtonClick = useCallback((value: ButtonValue) => {
    const currentExpression = expressionRef.current;
    const currentHasError = hasErrorRef.current;

    if (currentHasError && value !== "C") {
      setHasError(false);
      setExpression("");
      setResult("0");
      if (value !== "=" && value !== "⌫") {
        setExpression(value);
        updateResult(value);
      }
      return;
    }

    if (value === "C") {
      setExpression("");
      setResult("0");
      setHasError(false);
      return;
    }

    if (value === "⌫") {
      const newExpression = currentExpression.slice(0, -1);
      setExpression(newExpression);
      updateResult(newExpression);
      return;
    }

    if (value === "=") {
      if (currentExpression === "") return;
      
      const evaluated = safeEvaluate(currentExpression, angleMode);
      if (evaluated === null) {
        setResult("Error");
        setHasError(true);
      } else {
        const formatted = formatNumber(evaluated);
        setExpression(formatted);
        setResult(formatted);
        setHasError(false);
      }
      return;
    }

    // Handle special functions that need parentheses
    if (["sin", "cos", "tan", "asin", "acos", "atan", "sinh", "cosh", "tanh", "log", "ln", "exp", "sqrt", "cbrt"].includes(value)) {
      const newExpression = currentExpression + value + "(";
      setExpression(newExpression);
      updateResult(newExpression);
      return;
    }

    // Handle constants
    if (value === "pi") {
      const newExpression = currentExpression + "π";
      setExpression(newExpression);
      updateResult(newExpression);
      return;
    }

    if (value === "e") {
      const newExpression = currentExpression + "e";
      setExpression(newExpression);
      updateResult(newExpression);
      return;
    }

    // Handle x² (square) - add ² after the current number
    if (value === "x²") {
      // Get the last number in the expression
      const match = currentExpression.match(/(\d+(?:\.\d+)?)$/);
      if (match) {
        const newExpression = currentExpression + "²";
        setExpression(newExpression);
        updateResult(newExpression);
      }
      return;
    }

    // Handle 1/x - wrap the last number
    if (value === "1/x") {
      const match = currentExpression.match(/(\d+(?:\.\d+)?)$/);
      if (match) {
        const num = match[1];
        const before = currentExpression.slice(0, -num.length);
        const newExpression = before + num + "1/x";
        setExpression(newExpression);
        updateResult(newExpression);
      }
      return;
    }

    // Handle factorial
    if (value === "!") {
      const newExpression = currentExpression + "!";
      setExpression(newExpression);
      updateResult(newExpression);
      return;
    }

    // Handle power
    if (value === "^" || value === "pow") {
      const newExpression = currentExpression + "^";
      setExpression(newExpression);
      updateResult(newExpression);
      return;
    }

    // Prevent multiple operators in a row
    if (["+", "-", "*", "/"].includes(value)) {
      if (currentExpression === "") {
        return;
      }
      
      const lastChar = currentExpression[currentExpression.length - 1];
      if (["+", "-", "*", "/"].includes(lastChar)) {
        const newExpression = currentExpression.slice(0, -1) + value;
        setExpression(newExpression);
        updateResult(newExpression);
        return;
      }
    }

    // Prevent multiple decimal points in the same number
    if (value === ".") {
      const parts = currentExpression.split(/[\+\-\*\/\(\)]/);
      const lastPart = parts[parts.length - 1];
      if (lastPart.includes(".")) {
        return;
      }
    }

    const newExpression = currentExpression + value;
    setExpression(newExpression);
    updateResult(newExpression);
  }, [angleMode]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const key = event.key;

      if (
        /[0-9+\-*/.=()]/.test(key) ||
        key === "Enter" ||
        key === "Escape" ||
        key === "Backspace"
      ) {
        event.preventDefault();
      }

      if (key >= "0" && key <= "9") {
        handleButtonClick(key as ButtonValue);
      } else if (key === ".") {
        handleButtonClick(".");
      } else if (key === "+") {
        handleButtonClick("+");
      } else if (key === "-") {
        handleButtonClick("-");
      } else if (key === "*") {
        handleButtonClick("*");
      } else if (key === "/") {
        handleButtonClick("/");
      } else if (key === "Enter" || key === "=") {
        handleButtonClick("=");
      } else if (key === "Escape") {
        handleButtonClick("C");
      } else if (key === "Backspace") {
        handleButtonClick("⌫");
      } else if (key === "(") {
        handleButtonClick("(");
      } else if (key === ")") {
        handleButtonClick(")");
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleButtonClick]);

  const buttons: Array<{ value: ButtonValue; label: string; className?: string; span?: number }> = [
    // Row 1: Mode toggle and basic functions
    { value: "C", label: "C", className: styles.clear },
    { value: "⌫", label: "⌫", className: styles.backspace },
    { value: "(" as ButtonValue, label: "(", className: styles.function },
    { value: ")" as ButtonValue, label: ")", className: styles.function },
    { value: "/", label: "÷", className: styles.operator },
    
    // Row 2: Trigonometric functions
    { value: "sin" as ButtonValue, label: "sin", className: styles.function },
    { value: "cos" as ButtonValue, label: "cos", className: styles.function },
    { value: "tan" as ButtonValue, label: "tan", className: styles.function },
    { value: "asin" as ButtonValue, label: "sin⁻¹", className: styles.function },
    { value: "*", label: "×", className: styles.operator },
    
    // Row 3: More trig and hyperbolic
    { value: "acos" as ButtonValue, label: "cos⁻¹", className: styles.function },
    { value: "atan" as ButtonValue, label: "tan⁻¹", className: styles.function },
    { value: "sinh" as ButtonValue, label: "sinh", className: styles.function },
    { value: "cosh" as ButtonValue, label: "cosh", className: styles.function },
    { value: "-", label: "−", className: styles.operator },
    
    // Row 4: Logarithms and exponentials
    { value: "tanh" as ButtonValue, label: "tanh", className: styles.function },
    { value: "log" as ButtonValue, label: "log", className: styles.function },
    { value: "ln" as ButtonValue, label: "ln", className: styles.function },
    { value: "exp" as ButtonValue, label: "eˣ", className: styles.function },
    { value: "+", label: "+", className: styles.operator },
    
    // Row 5: Powers and roots
    { value: "sqrt" as ButtonValue, label: "√", className: styles.function },
    { value: "cbrt" as ButtonValue, label: "∛", className: styles.function },
    { value: "^" as ButtonValue, label: "xʸ", className: styles.function },
    { value: "x²" as ButtonValue, label: "x²", className: styles.function },
    { value: "=", label: "=", className: styles.equals },
    
    // Row 6: Constants and special functions
    { value: "pi" as ButtonValue, label: "π", className: styles.constant },
    { value: "e" as ButtonValue, label: "e", className: styles.constant },
    { value: "!" as ButtonValue, label: "n!", className: styles.function },
    { value: "1/x" as ButtonValue, label: "1/x", className: styles.function },
    
    // Row 7: Numbers
    { value: "7", label: "7" },
    { value: "8", label: "8" },
    { value: "9", label: "9" },
    
    // Row 8: Numbers
    { value: "4", label: "4" },
    { value: "5", label: "5" },
    { value: "6", label: "6" },
    
    // Row 9: Numbers
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    
    // Row 10: Zero and decimal
    { value: "0", label: "0", span: 2 },
    { value: ".", label: "." },
  ];

  return (
    <div className={styles.wrapper}>
      <div className={styles.calculator}>
        <div className={styles.modeToggle}>
          <button
            className={`${styles.modeButton} ${angleMode === "deg" ? styles.active : ""}`}
            onClick={() => setAngleMode("deg")}
            type="button"
          >
            DEG
          </button>
          <button
            className={`${styles.modeButton} ${angleMode === "rad" ? styles.active : ""}`}
            onClick={() => setAngleMode("rad")}
            type="button"
          >
            RAD
          </button>
        </div>
        <div className={`${styles.display} ${hasError ? styles.error : ""}`}>
          <div className={styles.expression}>{expression || "0"}</div>
          <div className={styles.result}>{result}</div>
        </div>
        <div className={styles.buttonGrid}>
          {buttons.map((button, index) => (
            <button
              key={`${button.value}-${index}`}
              className={`${styles.button} ${button.className || ""}`}
              onClick={() => handleButtonClick(button.value)}
              type="button"
              style={button.span ? { gridColumn: `span ${button.span}` } : {}}
            >
              {button.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
