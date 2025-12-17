// React preview code validator and auto-fixer
// Ensures sanitized code is safe and compilable before sending to esbuild

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: string[]
}

export interface ValidationError {
  type: 'import' | 'export' | 'directive' | 'typescript' | 'dangerous' | 'syntax' | 'markdown'
  message: string
  line?: number
  fixable: boolean
}

export interface AutoFixResult {
  code: string
  fixesApplied: string[]
  remainingErrors: ValidationError[]
}

// Patterns that should NOT be in sanitized code
const FORBIDDEN_PATTERNS = {
  // Import statements
  imports: [
    /^import\s+.*\s+from\s+['"].*['"];?\s*$/gm,
    /^import\s+['"].*['"];?\s*$/gm,
    /^import\s*\{[^}]*\}\s*from\s*['"].*['"];?\s*$/gm,
    /require\s*\(['"].*['"]\)/g,
  ],
  // Export statements
  exports: [
    /^export\s+default\s+/gm,
    /^export\s+\{[^}]*\};?\s*$/gm,
    /^export\s+(const|let|var|function|class)\s+/gm,
    /module\.exports\s*=/g,
  ],
  // Directives
  directives: [
    /^['"]use client['"];?\s*$/gm,
    /^['"]use server['"];?\s*$/gm,
  ],
  // TypeScript-specific - these are fixable by auto-fix, not blocking errors
  // esbuild handles most TS fine, we just flag them for cleaning
  typescript: [
    /^interface\s+\w+\s*\{/gm,
    /^type\s+\w+\s*=\s*/gm,
  ],
  // Dangerous code - only the really dangerous stuff
  dangerous: [
    /\beval\s*\(/g,
    /new\s+Function\s*\(/g,
    /document\.write\s*\(/g,
  ],
  // Markdown wrappers
  markdown: [
    /^```(jsx?|tsx?|javascript|typescript)?\s*$/gm,
    /^```\s*$/gm,
  ],
}

// Component name patterns to detect
const COMPONENT_NAME_PATTERNS = [
  /function\s+(\w+)\s*\(/,
  /const\s+(\w+)\s*=\s*\(\s*\)\s*=>/,
  /const\s+(\w+)\s*=\s*function/,
  /class\s+(\w+)\s+extends/,
]

/**
 * Validates sanitized React code for common issues
 */
export function validateSanitizedCode(code: string): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: string[] = []
  const lines = code.split('\n')

  // Check for forbidden patterns
  for (const [category, patterns] of Object.entries(FORBIDDEN_PATTERNS)) {
    for (const pattern of patterns) {
      const matches = code.match(pattern)
      if (matches) {
        for (const match of matches) {
          const lineNum = findLineNumber(code, match)
          errors.push({
            type: category as ValidationError['type'],
            message: `Found forbidden ${category}: "${match.substring(0, 50)}${match.length > 50 ? '...' : ''}"`,
            line: lineNum,
            fixable: ['import', 'export', 'directive', 'markdown', 'typescript'].includes(category),
          })
        }
      }
    }
  }

  // Check for balanced braces
  const braceBalance = checkBraceBalance(code)
  if (braceBalance.curly !== 0) {
    errors.push({
      type: 'syntax',
      message: `Unbalanced curly braces: ${braceBalance.curly > 0 ? 'missing ' + braceBalance.curly + ' closing' : 'extra ' + Math.abs(braceBalance.curly) + ' closing'} brace(s)`,
      fixable: false,
    })
  }
  if (braceBalance.paren !== 0) {
    errors.push({
      type: 'syntax',
      message: `Unbalanced parentheses: ${braceBalance.paren > 0 ? 'missing ' + braceBalance.paren + ' closing' : 'extra ' + Math.abs(braceBalance.paren) + ' closing'} paren(s)`,
      fixable: false,
    })
  }

  // Check for Preview component
  const hasPreviewComponent = /function\s+Preview\s*\(|const\s+Preview\s*=/.test(code)
  if (!hasPreviewComponent) {
    // Check what component name is used
    for (const pattern of COMPONENT_NAME_PATTERNS) {
      const match = code.match(pattern)
      if (match && match[1] && match[1] !== 'Preview') {
        warnings.push(`Component named "${match[1]}" instead of "Preview" - will need renaming`)
        break
      }
    }
  }

  // Check code is not empty
  const strippedCode = code.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim()
  if (strippedCode.length < 50) {
    errors.push({
      type: 'syntax',
      message: 'Code appears to be empty or too short',
      fixable: false,
    })
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Attempts to auto-fix common issues in sanitized code
 */
export function autoFixCode(code: string): AutoFixResult {
  const fixesApplied: string[] = []
  let fixedCode = code

  // Remove markdown wrappers
  const markdownStart = /^```(jsx?|tsx?|javascript|typescript)?\s*\n/
  const markdownEnd = /\n```\s*$/
  if (markdownStart.test(fixedCode) || markdownEnd.test(fixedCode)) {
    fixedCode = fixedCode.replace(markdownStart, '').replace(markdownEnd, '')
    fixesApplied.push('Removed markdown code blocks')
  }

  // Remove import statements (including multi-line imports)
  // First handle multi-line imports: import { ... } from '...'
  const multiLineImportPattern = /^import\s*\{[\s\S]*?\}\s*from\s*['"][^'"]+['"];?\s*$/gm
  const multiLineMatches = fixedCode.match(multiLineImportPattern)
  if (multiLineMatches && multiLineMatches.length > 0) {
    fixedCode = fixedCode.replace(multiLineImportPattern, '')
    fixesApplied.push(`Removed ${multiLineMatches.length} multi-line import(s)`)
  }

  // Then handle single-line imports
  const importPattern = /^import\s+.*(?:from\s+['"].*['"]|['"].*['"])?\s*;?\s*$/gm
  const importMatches = fixedCode.match(importPattern)
  if (importMatches && importMatches.length > 0) {
    fixedCode = fixedCode.replace(importPattern, '')
    fixesApplied.push(`Removed ${importMatches.length} import statement(s)`)
  }

  // Remove require statements
  const requirePattern = /(?:const|let|var)\s+.*=\s*require\s*\(['"].*['"]\)\s*;?\s*\n?/g
  const requireMatches = fixedCode.match(requirePattern)
  if (requireMatches && requireMatches.length > 0) {
    fixedCode = fixedCode.replace(requirePattern, '')
    fixesApplied.push(`Removed ${requireMatches.length} require statement(s)`)
  }

  // Remove export statements
  const beforeExportFix = fixedCode

  // Remove "export default ComponentName;" at end of file
  fixedCode = fixedCode.replace(/^export\s+default\s+\w+\s*;?\s*$/gm, '')

  // Remove "export default" prefix from function/const declarations
  fixedCode = fixedCode.replace(/^export\s+default\s+(?=function|const|class)/gm, '')

  if (fixedCode !== beforeExportFix) {
    fixesApplied.push('Removed export default')
  }

  // Remove named exports
  const namedExportPattern = /^export\s+\{[^}]*\}\s*;?\s*$/gm
  if (namedExportPattern.test(fixedCode)) {
    fixedCode = fixedCode.replace(namedExportPattern, '')
    fixesApplied.push('Removed named exports')
  }

  // Remove "use client" / "use server" directives
  const directivePattern = /^['"]use (client|server)['"];?\s*\n?/gm
  if (directivePattern.test(fixedCode)) {
    fixedCode = fixedCode.replace(directivePattern, '')
    fixesApplied.push('Removed directive')
  }

  // Remove module.exports
  const moduleExportsPattern = /module\.exports\s*=\s*\w+\s*;?\s*$/gm
  if (moduleExportsPattern.test(fixedCode)) {
    fixedCode = fixedCode.replace(moduleExportsPattern, '')
    fixesApplied.push('Removed module.exports')
  }

  // Rename main component to Preview if needed
  const componentNames = ['HomePage', 'Home', 'App', 'Main', 'Landing', 'Page', 'Website', 'Site', 'Component', 'Design']
  for (const name of componentNames) {
    const funcPattern = new RegExp(`function\\s+${name}\\s*\\(`, 'g')
    // More flexible arrow function pattern - handles () => { and (props) => { etc
    const arrowPattern = new RegExp(`const\\s+${name}\\s*=\\s*\\([^)]*\\)\\s*=>`, 'g')
    const classPattern = new RegExp(`class\\s+${name}\\s+extends`, 'g')

    const hasFuncMatch = funcPattern.test(fixedCode)
    const hasArrowMatch = arrowPattern.test(fixedCode)
    const hasClassMatch = classPattern.test(fixedCode)

    // Reset lastIndex after test() calls
    funcPattern.lastIndex = 0
    arrowPattern.lastIndex = 0
    classPattern.lastIndex = 0

    if (hasFuncMatch || hasArrowMatch || hasClassMatch) {
      fixedCode = fixedCode
        .replace(funcPattern, 'function Preview(')
        .replace(arrowPattern, 'const Preview = () =>')
        .replace(classPattern, 'class Preview extends')
      fixesApplied.push(`Renamed component from ${name} to Preview`)
      break
    }
  }

  // Remove simple TypeScript annotations (basic ones that are common)
  // : string, : number, : boolean, : any, : void
  const simpleTypePattern = /:\s*(string|number|boolean|any|void|null|undefined)\s*(?=[,)\]=;{])/g
  if (simpleTypePattern.test(fixedCode)) {
    fixedCode = fixedCode.replace(simpleTypePattern, '')
    fixesApplied.push('Removed simple TypeScript annotations')
  }

  // Remove React.FC / FC type annotations
  const fcPattern = /:\s*(?:React\.)?(?:FC|FunctionComponent)(?:<[^>]*>)?\s*=/g
  if (fcPattern.test(fixedCode)) {
    fixedCode = fixedCode.replace(fcPattern, ' =')
    fixesApplied.push('Removed FC type annotation')
  }

  // Remove interface declarations
  const interfacePattern = /^interface\s+\w+\s*\{[\s\S]*?\n\}\s*\n?/gm
  if (interfacePattern.test(fixedCode)) {
    fixedCode = fixedCode.replace(interfacePattern, '')
    fixesApplied.push('Removed interface declarations')
  }

  // Remove type declarations
  const typePattern = /^type\s+\w+\s*=\s*[^;]+;\s*\n?/gm
  if (typePattern.test(fixedCode)) {
    fixedCode = fixedCode.replace(typePattern, '')
    fixesApplied.push('Removed type declarations')
  }

  // Clean up empty lines (but keep some structure)
  fixedCode = fixedCode.replace(/\n{4,}/g, '\n\n\n')

  // Trim
  fixedCode = fixedCode.trim()

  // Re-validate to find remaining errors
  const validation = validateSanitizedCode(fixedCode)

  return {
    code: fixedCode,
    fixesApplied,
    remainingErrors: validation.errors,
  }
}

/**
 * Validates and auto-fixes code in one pass
 */
export function validateAndFix(code: string): {
  code: string
  valid: boolean
  fixesApplied: string[]
  errors: ValidationError[]
  warnings: string[]
} {
  // First validation
  const initialValidation = validateSanitizedCode(code)

  // If already valid, return as-is
  if (initialValidation.valid) {
    return {
      code,
      valid: true,
      fixesApplied: [],
      errors: [],
      warnings: initialValidation.warnings,
    }
  }

  // Try auto-fix
  const fixResult = autoFixCode(code)

  return {
    code: fixResult.code,
    valid: fixResult.remainingErrors.length === 0,
    fixesApplied: fixResult.fixesApplied,
    errors: fixResult.remainingErrors,
    warnings: initialValidation.warnings,
  }
}

// Helper functions

function findLineNumber(code: string, substring: string): number {
  const index = code.indexOf(substring)
  if (index === -1) return -1
  return code.substring(0, index).split('\n').length
}

function checkBraceBalance(code: string): { curly: number; paren: number; bracket: number } {
  // Remove strings and comments to avoid false positives
  // Process character by character to handle nested template literals correctly
  let cleaned = ''
  let i = 0

  while (i < code.length) {
    // Single line comment
    if (code[i] === '/' && code[i + 1] === '/') {
      while (i < code.length && code[i] !== '\n') i++
      continue
    }

    // Multi-line comment
    if (code[i] === '/' && code[i + 1] === '*') {
      i += 2
      while (i < code.length - 1 && !(code[i] === '*' && code[i + 1] === '/')) i++
      i += 2
      continue
    }

    // Template literal - skip entire thing including nested ${}
    if (code[i] === '`') {
      i++
      let depth = 0
      while (i < code.length) {
        if (code[i] === '\\') {
          i += 2 // skip escaped char
          continue
        }
        if (code[i] === '$' && code[i + 1] === '{') {
          depth++
          i += 2
          continue
        }
        if (code[i] === '}' && depth > 0) {
          depth--
          i++
          continue
        }
        if (code[i] === '`' && depth === 0) {
          i++
          break
        }
        i++
      }
      continue
    }

    // Double quote string
    if (code[i] === '"') {
      i++
      while (i < code.length && code[i] !== '"') {
        if (code[i] === '\\') i++
        i++
      }
      i++
      continue
    }

    // Single quote string
    if (code[i] === "'") {
      i++
      while (i < code.length && code[i] !== "'") {
        if (code[i] === '\\') i++
        i++
      }
      i++
      continue
    }

    cleaned += code[i]
    i++
  }

  let curly = 0
  let paren = 0
  let bracket = 0

  for (const char of cleaned) {
    if (char === '{') curly++
    else if (char === '}') curly--
    else if (char === '(') paren++
    else if (char === ')') paren--
    else if (char === '[') bracket++
    else if (char === ']') bracket--
  }

  return { curly, paren, bracket }
}

/**
 * Quick check if code looks like it might be valid React
 */
export function looksLikeReactCode(code: string): boolean {
  // Must have a function or const that returns JSX
  const hasComponent = /function\s+\w+\s*\(|const\s+\w+\s*=/.test(code)
  const hasJSX = /<[A-Za-z][^>]*>/.test(code)
  const hasReturn = /return\s*\(?\s*</.test(code)

  return hasComponent && hasJSX && hasReturn
}

/**
 * Minimal validation result for LLM output
 * Only checks for critical errors that would break compilation
 */
export interface MinimalValidationResult {
  valid: boolean
  hasCriticalErrors: boolean
  errors: string[]
  code: string // Cleaned code (markdown stripped)
}

/**
 * Minimal validation - only checks for critical errors
 * Trusts the LLM to do most of the work, only catches:
 * - Dangerous code (eval, new Function, document.write)
 * - Unbalanced braces
 * - Missing Preview component
 * - Empty code
 *
 * Does NOT block on:
 * - Residual imports/exports (esbuild handles them)
 * - TypeScript syntax (esbuild handles it)
 */
export function validateMinimal(code: string): MinimalValidationResult {
  const errors: string[] = []
  let cleanedCode = code

  // Strip markdown wrappers if present
  const markdownStart = /^```(?:jsx?|tsx?|javascript|typescript)?\s*\n?/
  const markdownEnd = /\n?```\s*$/
  if (markdownStart.test(cleanedCode) || markdownEnd.test(cleanedCode)) {
    cleanedCode = cleanedCode.replace(markdownStart, '').replace(markdownEnd, '').trim()
  }

  // Strip "// END OF CODE" marker if present
  cleanedCode = cleanedCode.replace(/\n?\/\/\s*END\s*OF\s*CODE\s*$/i, '').trim()

  // 1. Check for dangerous code
  if (/\beval\s*\(/.test(cleanedCode)) {
    errors.push('Contains eval() - dangerous code not allowed')
  }
  if (/new\s+Function\s*\(/.test(cleanedCode)) {
    errors.push('Contains new Function() - dangerous code not allowed')
  }
  if (/document\.write\s*\(/.test(cleanedCode)) {
    errors.push('Contains document.write() - dangerous code not allowed')
  }

  // 2. Check for balanced braces
  const balance = checkBraceBalance(cleanedCode)
  if (balance.curly !== 0) {
    const direction = balance.curly > 0 ? 'missing closing' : 'extra closing'
    errors.push(`Unbalanced curly braces: ${Math.abs(balance.curly)} ${direction}`)
  }
  if (balance.paren !== 0) {
    const direction = balance.paren > 0 ? 'missing closing' : 'extra closing'
    errors.push(`Unbalanced parentheses: ${Math.abs(balance.paren)} ${direction}`)
  }

  // 3. Check for Preview component
  const hasPreview = /function\s+Preview\s*\(|const\s+Preview\s*=/.test(cleanedCode)
  if (!hasPreview) {
    errors.push('No Preview component found - component must be named Preview')
  }

  // 4. Check code is not empty
  const strippedCode = cleanedCode.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim()
  if (strippedCode.length < 50) {
    errors.push('Code appears to be empty or too short')
  }

  return {
    valid: errors.length === 0,
    hasCriticalErrors: errors.length > 0,
    errors,
    code: cleanedCode
  }
}
