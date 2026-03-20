/**
 * AniMaker - Common Shader Utilities
 *
 * This module provides utility functions for shader management,
 * including language conversion, validation, and code generation.
 */

import type { ShaderLanguage, ShaderStage } from '../../resources/ShaderManager';

/**
 * Shader language detection result
 */
export interface ShaderLanguageDetection {
  language: ShaderLanguage;
  confidence: 'high' | 'medium' | 'low';
  stage?: ShaderStage;
}

/**
 * Detect shader language from source code
 *
 * @param source - Shader source code
 * @returns Detected language information
 */
export function detectShaderLanguage(source: string): ShaderLanguageDetection {
  const trimmed = source.trim();

  // Check for WGSL indicators
  if (
    trimmed.includes('@vertex') ||
    trimmed.includes('@fragment') ||
    trimmed.includes('@compute') ||
    trimmed.includes('@group') ||
    trimmed.includes('@binding') ||
    trimmed.includes('@builtin') ||
    trimmed.includes('@location') ||
    trimmed.includes('fn ') ||
    trimmed.includes('var<uniform>')
  ) {
    return {
      language: ShaderLanguage.WGSL,
      confidence: 'high',
    };
  }

  // Check for GLSL indicators
  if (
    trimmed.includes('#version') ||
    trimmed.includes('attribute ') ||
    trimmed.includes('varying ') ||
    trimmed.includes('uniform sampler2D') ||
    trimmed.includes('layout(') ||
    trimmed.includes('in vec') ||
    trimmed.includes('out vec') ||
    trimmed.includes('gl_Position')
  ) {
    return {
      language: ShaderLanguage.GLSL,
      confidence: 'high',
    };
  }

  // Check for common GLSL types
  if (
    trimmed.includes('vec2') ||
    trimmed.includes('vec3') ||
    trimmed.includes('vec4') ||
    trimmed.includes('mat4')
  ) {
    return {
      language: ShaderLanguage.GLSL,
      confidence: 'medium',
    };
  }

  // Default to WGSL for WebGPU
  return {
    language: ShaderLanguage.WGSL,
    confidence: 'low',
  };
}

/**
 * Detect shader stage from source code
 *
 * @param source - Shader source code
 * @returns Detected shader stage
 */
export function detectShaderStage(source: string): ShaderStage {
  const trimmed = source.toLowerCase();

  // WGSL stage indicators
  if (trimmed.includes('@vertex')) {
    return ShaderStage.Vertex;
  }
  if (trimmed.includes('@fragment')) {
    return ShaderStage.Fragment;
  }
  if (trimmed.includes('@compute')) {
    return ShaderStage.Compute;
  }

  // GLSL stage indicators
  if (trimmed.includes('layout(') && trimmed.includes(') in')) {
    return ShaderStage.Vertex;
  }
  if (trimmed.includes('layout(') && trimmed.includes(') out')) {
    return ShaderStage.Fragment;
  }

  // Check for common keywords
  if (trimmed.includes('gl_Position')) {
    return ShaderStage.Vertex;
  }
  if (trimmed.includes('gl_FragColor')) {
    return ShaderStage.Fragment;
  }

  // Default to vertex
  return ShaderStage.Vertex;
}

/**
 * Get shader file extension for language
 *
 * @param language - Shader language
 * @param stage - Shader stage (optional)
 * @returns File extension
 */
export function getShaderExtension(language: ShaderLanguage, stage?: ShaderStage): string {
  switch (language) {
    case ShaderLanguage.WGSL:
      return '.wgsl';

    case ShaderLanguage.GLSL:
      switch (stage) {
        case ShaderStage.Vertex:
          return '.vert';
        case ShaderStage.Fragment:
          return '.frag';
        case ShaderStage.Compute:
          return '.comp';
        default:
          return '.glsl';
      }

    default:
      return '.txt';
  }
}

/**
 * Validate shader source code
 *
 * @param source - Shader source code
 * @param language - Expected language
 * @returns Validation result
 */
export function validateShaderSource(
  source: string,
  language: ShaderLanguage
): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  const detection = detectShaderLanguage(source);

  // Check language match
  if (detection.language !== language && detection.confidence === 'high') {
    errors.push(
      `Language mismatch: expected ${language} but detected ${detection.language}`
    );
  }

  // Language-specific validation
  if (language === ShaderLanguage.WGSL) {
    // WGSL validation
    if (!source.includes('fn ')) {
      warnings.push('WGSL shader does not contain any function definitions');
    }
  } else if (language === ShaderLanguage.GLSL) {
    // GLSL validation
    if (!source.includes('#version')) {
      warnings.push('GLSL shader does not specify version (#version directive missing)');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Preprocess shader source (handle includes, defines, etc.)
 *
 * @param source - Shader source code
 * @param defines - Preprocessor defines
 * @returns Preprocessed source code
 */
export function preprocessShader(
  source: string,
  defines: Record<string, string | number | boolean> = {}
): string {
  let processed = source;

  // Handle #include directives (basic implementation)
  processed = processed.replace(
    /#include\s+"([^"]+)"/g,
    (_match, path) => `// Included: ${path}\n`
  );

  // Inject defines at the beginning
  if (Object.keys(defines).length > 0) {
    const defineLines = Object.entries(defines).map(([key, value]) => {
      if (typeof value === 'boolean') {
        return value ? `#define ${key}` : `// #define ${key} (disabled)`;
      } else {
        return `#define ${key} ${value}`;
      }
    });

    const versionMatch = processed.match(/#version\s+\d+/);
    if (versionMatch) {
      // Insert after #version directive
      const insertIndex = processed.indexOf(versionMatch[0]) + versionMatch[0].length;
      processed =
        processed.substring(0, insertIndex) +
        '\n' +
        defineLines.join('\n') +
        '\n' +
        processed.substring(insertIndex);
    } else {
      // No version directive, insert at beginning
      processed = defineLines.join('\n') + '\n' + processed;
    }
  }

  return processed;
}

/**
 * Extract metadata from shader comments
 *
 * @param source - Shader source code
 * @returns Extracted metadata
 */
export function extractShaderMetadata(source: string): {
  name?: string;
  description?: string;
  author?: string;
  version?: string;
  tags: string[];
} {
  const metadata = {
    name: undefined as string | undefined,
    description: undefined as string | undefined,
    author: undefined as string | undefined,
    version: undefined as string | undefined,
    tags: [] as string[],
  };

  // Match comment blocks
  const commentRegex = /\/\*\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+\//g;
  const comments = source.match(commentRegex) || [];

  for (const comment of comments) {
    // Extract @name
    const nameMatch = comment.match(/@name\s+([^\n\r]+)/);
    if (nameMatch) {
      metadata.name = nameMatch[1].trim();
    }

    // Extract @description
    const descMatch = comment.match(/@description\s+([^\n\r]+)/);
    if (descMatch) {
      metadata.description = descMatch[1].trim();
    }

    // Extract @author
    const authorMatch = comment.match(/@author\s+([^\n\r]+)/);
    if (authorMatch) {
      metadata.author = authorMatch[1].trim();
    }

    // Extract @version
    const versionMatch = comment.match(/@version\s+([^\n\r]+)/);
    if (versionMatch) {
      metadata.version = versionMatch[1].trim();
    }

    // Extract @tags
    const tagMatches = comment.matchAll(/@tag\s+([^\n\r]+)/g);
    for (const match of tagMatches) {
      metadata.tags.push(match[1].trim());
    }
  }

  return metadata;
}

/**
 * Generate shader hash for caching
 *
 * @param source - Shader source code
 * @param defines - Preprocessor defines
 * @returns Hash string
 */
export function generateShaderHash(
  source: string,
  defines: Record<string, string | number | boolean> = {}
): string {
  // Simple hash implementation (for production, use a proper hash function)
  const combined = source + JSON.stringify(defines);
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Format shader error message
 *
 * @param error - Error message from shader compilation
 * @param source - Shader source code
 * @returns Formatted error message
 */
export function formatShaderError(error: string, source: string): string {
  const lines = source.split('\n');
  const errorRegex = /(\d+):(\d+):\s*(.+)/;
  const match = error.match(errorRegex);

  if (match) {
    const lineNum = parseInt(match[1], 10);
    const colNum = parseInt(match[2], 10);
    const message = match[3];

    const line = lines[lineNum - 1] || '';
    const pointer = ' '.repeat(colNum - 1) + '^';

    return [
      `Shader Error (line ${lineNum}, column ${colNum}):`,
      message,
      '',
      line,
      pointer,
    ].join('\n');
  }

  return error;
}

// Re-export types
export type {
  ShaderLanguageDetection,
};
