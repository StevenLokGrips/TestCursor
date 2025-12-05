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

    // Replace function names with JavaScript equivalents
    const functionReplacements: { [key: string]: string } = {
      sin: angleMode === "deg" ? "Math.sin(Math.PI/180*" : "Math.sin(",
      cos: angleMode === "deg" ? "Math.cos(Math.PI/180*" : "Math.cos(",
      tan: angleMode === "deg" ? "Math.tan(Math.PI/180*" : "Math.tan(",
      asin: angleMode === "deg" ? "180/Math.PI*Math.asin(" : "Math.asin(",
      acos: angleMode === "deg" ? "180/Math.PI*Math.acos(" : "Math.acos(",
      atan: angleMode === "deg" ? "180/Math.PI*Math.atan(" : "Math.atan(",
      sinh: "Math.sinh(",
      cosh: "Math.cosh(",
      tanh: "Math.tanh(",
      log: "Math.log10(",
      ln: "Math.log(",
      exp: "Math.exp(",
      sqrt: "Math.sqrt(",
      cbrt: "Math.cbrt(",
    };

    // Replace functions (handle function calls) - process longer names first
    const sortedFunctions = Object.keys(functionReplacements).sort((a, b) => b.length - a.length);
    for (const func of sortedFunctions) {
      const replacement = functionReplacements[func];
      const regex = new RegExp(`\\b${func}\\s*\\(`, "g");
      processed = processed.replace(regex, replacement);
    }

    // Handle power operator (^) - must be after function replacements
    // Match numbers or function results
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
    // The expression should now be valid JavaScript
    const result = Function(`"use strict"; return (${normalized})`)();
    
    if (typeof result !== "number" || !isFinite(result) || isNaN(result)) {
      return null;
    }

    return result;
  } catch {
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
    if (/[a-z]+$/.test(expr) && !expr.endsWith(")")) {
      const exprWithoutFunction = expr.replace(/[a-z]+$/, "");
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
