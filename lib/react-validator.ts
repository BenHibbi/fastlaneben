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
  // TypeScript-specific - REMOVED because esbuild handles TypeScript fine
  // We'll just let esbuild deal with it
  typescript: [],
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
            fixable: ['import', 'export', 'directive', 'markdown'].includes(category),
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

  // Remove import statements
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
  fixedCode = fixedCode.replace(/^export\s+default\s+/gm, '')
  if (code !== fixedCode && !fixesApplied.includes('Removed export default')) {
    const beforeLen = code.length
    if (fixedCode.length !== beforeLen) {
      fixesApplied.push('Removed export default')
    }
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
    const arrowPattern = new RegExp(`const\\s+${name}\\s*=\\s*\\(\\s*\\)\\s*=>`, 'g')
    const classPattern = new RegExp(`class\\s+${name}\\s+extends`, 'g')

    if (funcPattern.test(fixedCode) || arrowPattern.test(fixedCode) || classPattern.test(fixedCode)) {
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
  const cleaned = code
    .replace(/`[^`]*`/g, '') // template literals
    .replace(/"[^"]*"/g, '') // double quotes
    .replace(/'[^']*'/g, '') // single quotes
    .replace(/\/\/.*$/gm, '') // single line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // multi-line comments

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
