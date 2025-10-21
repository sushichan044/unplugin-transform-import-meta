/**
 * @fileoverview Utility functions for handling JavaScript identifiers.
 */

import { isIdentifierName } from "@babel/helper-validator-identifier";
import { isPlainObject as _isPlainObject } from "es-toolkit/predicate";

export function isJSIdentifier(name: string): boolean {
  return isIdentifierName(name);
}

/**
 * Checks if the given identifier is a class.
 *
 * @param identifier - The identifier to check.
 * @returns True if the identifier is a class, false otherwise.
 */
export function isClassLike(identifier: unknown): boolean {
  return (
    typeof identifier === "function" &&
    identifier.toString().startsWith("class")
  );
}

/**
 * Checks if the given value is an array.
 *
 * @param value
 * @returns
 */
export function isArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}

/**
 * Checks if the given value is a plain object.
 *
 * @param value - The value to check.
 * @returns True if the value is a plain object, false otherwise.
 */
export function isPlainObject(
  value: unknown,
): value is Record<PropertyKey, unknown> {
  return _isPlainObject(value);
}

console.log("isValid", isJSIdentifier("a-b"));
