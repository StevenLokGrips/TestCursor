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
  | "⌫";

function safeEvaluate(expression: string): number | null {
  try {
    // Remove any invalid characters
    const cleaned = expression.replace(/[^0-9+\-*/.() ]/g, "");
    
    // Check for empty or invalid expressions
    if (!cleaned || /^[\+\-\*\/]/.test(cleaned) || /[\+\-\*\/]$/.test(cleaned)) {
      return null;
    }

    // Replace multiple operators with the last one
    let normalized = cleaned.replace(/[\+\-\*\/]+/g, (match) => {
      const last = match[match.length - 1];
      return last;
    });

    // Handle negative numbers at the start
    if (normalized.startsWith("-")) {
      normalized = "0" + normalized;
    }

    // Use Function constructor as a safer alternative to eval
    // This still evaluates code, but is slightly safer than eval
    const result = Function(`"use strict"; return (${normalized})`)();
    
    if (typeof result !== "number" || !isFinite(result)) {
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
  
  // Limit to 10 decimal places
  const rounded = Math.round(num * 10000000000) / 10000000000;
  return rounded.toString();
}

export default function Calculator() {
  const [expression, setExpression] = useState<string>("");
  const [result, setResult] = useState<string>("0");
  const [hasError, setHasError] = useState<boolean>(false);
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

    const evaluated = safeEvaluate(expr);
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
      // Clear error state when user starts typing after error
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
      
      const evaluated = safeEvaluate(currentExpression);
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

    // Prevent multiple operators in a row
    if (["+", "-", "*", "/"].includes(value)) {
      const lastChar = currentExpression[currentExpression.length - 1];
      if (["+", "-", "*", "/"].includes(lastChar)) {
        // Replace the last operator
        const newExpression = currentExpression.slice(0, -1) + value;
        setExpression(newExpression);
        updateResult(newExpression);
        return;
      }
    }

    // Prevent multiple decimal points in the same number
    if (value === ".") {
      const parts = currentExpression.split(/[\+\-\*\/]/);
      const lastPart = parts[parts.length - 1];
      if (lastPart.includes(".")) {
        return; // Don't add another decimal point
      }
    }

    const newExpression = currentExpression + value;
    setExpression(newExpression);
    updateResult(newExpression);
  }, []);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const key = event.key;

      // Prevent default for calculator keys
      if (
        /[0-9+\-*/.=]/.test(key) ||
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
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleButtonClick]);

  const buttons: Array<{ value: ButtonValue; label: string; className?: string }> = [
    { value: "C", label: "C", className: styles.clear },
    { value: "⌫", label: "⌫", className: styles.backspace },
    { value: "/", label: "÷", className: styles.operator },
    { value: "*", label: "×", className: styles.operator },
    { value: "7", label: "7" },
    { value: "8", label: "8" },
    { value: "9", label: "9" },
    { value: "-", label: "−", className: styles.operator },
    { value: "4", label: "4" },
    { value: "5", label: "5" },
    { value: "6", label: "6" },
    { value: "+", label: "+", className: styles.operator },
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "=", label: "=", className: styles.equals },
    { value: "0", label: "0" },
    { value: ".", label: "." },
  ];

  return (
    <div className={styles.wrapper}>
      <div className={styles.calculator}>
        <div className={`${styles.display} ${hasError ? styles.error : ""}`}>
          <div className={styles.expression}>{expression || "0"}</div>
          <div className={styles.result}>{result}</div>
        </div>
        <div className={styles.buttonGrid}>
          {buttons.map((button) => (
            <button
              key={button.value}
              className={`${styles.button} ${button.className || ""}`}
              onClick={() => handleButtonClick(button.value)}
              type="button"
            >
              {button.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
