/**
 * Conflict Resolution Utilities - Conflict Handling for ReportEdit UX Redesign
 * 
 * This module provides utilities for detecting and resolving conflicts that may occur
 * during collaborative editing or concurrent data updates.
 * 
 * Features:
 * - Conflict detection between local and server data
 * - Multiple resolution strategies (overwrite, merge, prompt)
 * - Intelligent merging for different data types
 * - Conflict history tracking
 * - User-friendly conflict resolution UI support
 * 
 * Created: 2025-06-24
 * Engineer: B (Logic/Components)
 */

import type { ConflictData, ConflictResolutionStrategy } from '@/types/reportManagement';

// ============================================================================
// CONFLICT DETECTION
// ============================================================================

/**
 * Detect conflicts between local and server data
 * @param localData - Local version of the data
 * @param serverData - Server version of the data
 * @param lastSynced - Last synchronization timestamp
 * @returns ConflictData[] - Array of detected conflicts
 */
export const detectConflicts = (
  localData: any,
  serverData: any,
  lastSynced: Date
): ConflictData[] => {
  const conflicts: ConflictData[] = [];
  
  // Check if server data was modified after last sync
  if (serverData.updatedAt) {
    const serverUpdated = new Date(serverData.updatedAt);
    if (serverUpdated <= lastSynced) {
      // No server changes since last sync, no conflicts possible
      return conflicts;
    }
  }

  // Compare field by field
  Object.keys(localData).forEach(key => {
    if (shouldCheckField(key)) {
      const localValue = localData[key];
      const serverValue = serverData[key];
      
      if (!isEqual(localValue, serverValue)) {
        conflicts.push({
          field: key,
          localValue,
          serverValue,
          timestamp: new Date(),
          resolved: false,
        });
      }
    }
  });

  // Check for fields that exist only on server
  Object.keys(serverData).forEach(key => {
    if (shouldCheckField(key) && !(key in localData)) {
      conflicts.push({
        field: key,
        localValue: undefined,
        serverValue: serverData[key],
        timestamp: new Date(),
        resolved: false,
      });
    }
  });

  return conflicts;
};

/**
 * Detect conflicts specifically for report data
 * @param localReport - Local report data
 * @param serverReport - Server report data
 * @param lastSynced - Last synchronization timestamp
 * @returns ConflictData[] - Report-specific conflicts
 */
export const detectReportConflicts = (
  localReport: any,
  serverReport: any,
  lastSynced: Date
): ConflictData[] => {
  const conflicts: ConflictData[] = [];
  
  // Check basic report fields
  const reportFields = ['title', 'description', 'cycle', 'state'];
  reportFields.forEach(field => {
    if (localReport[field] !== serverReport[field]) {
      conflicts.push({
        field,
        localValue: localReport[field],
        serverValue: serverReport[field],
        timestamp: new Date(),
        resolved: false,
      });
    }
  });

  // Check section-level conflicts
  if (localReport.sections && serverReport.sections) {
    const sectionConflicts = detectSectionConflicts(
      localReport.sections,
      serverReport.sections,
      lastSynced
    );
    conflicts.push(...sectionConflicts);
  }

  return conflicts;
};

/**
 * Detect conflicts in section data
 * @param localSections - Local section data
 * @param serverSections - Server section data
 * @param lastSynced - Last synchronization timestamp
 * @returns ConflictData[] - Section-specific conflicts
 */
export const detectSectionConflicts = (
  localSections: any[],
  serverSections: any[],
  lastSynced: Date
): ConflictData[] => {
  const conflicts: ConflictData[] = [];
  const serverSectionMap = new Map(serverSections.map(s => [s.id, s]));
  
  localSections.forEach(localSection => {
    const serverSection = serverSectionMap.get(localSection.id);
    if (!serverSection) return;
    
    // Check if section was modified on server after last sync
    const serverUpdated = new Date(serverSection.updatedAt);
    if (serverUpdated <= lastSynced) return;
    
    // Check section fields that can conflict
    const sectionFields = ['contentMarkdown', 'isActive', 'displayOrder'];
    sectionFields.forEach(field => {
      if (localSection[field] !== serverSection[field]) {
        conflicts.push({
          field: `section.${localSection.id}.${field}`,
          localValue: localSection[field],
          serverValue: serverSection[field],
          timestamp: new Date(),
          resolved: false,
        });
      }
    });
  });

  return conflicts;
};

// ============================================================================
// CONFLICT RESOLUTION
// ============================================================================

/**
 * Resolve conflicts using specified strategy
 * @param conflicts - Array of conflicts to resolve
 * @param strategy - Resolution strategy
 * @returns ConflictData[] - Resolved conflicts
 */
export const resolveConflicts = (
  conflicts: ConflictData[],
  strategy: ConflictResolutionStrategy
): ConflictData[] => {
  return conflicts.map(conflict => {
    switch (strategy.type) {
      case 'overwrite':
        return resolveWithOverwrite(conflict);
      
      case 'merge':
        return resolveWithMerge(conflict, strategy.mergeFunction);
      
      case 'prompt':
        // UI will handle this - mark as unresolved
        return conflict;
      
      default:
        return conflict;
    }
  });
};

/**
 * Resolve conflict by overwriting with local value
 * @param conflict - Conflict to resolve
 * @returns ConflictData - Resolved conflict
 */
export const resolveWithOverwrite = (conflict: ConflictData): ConflictData => {
  return {
    ...conflict,
    resolved: true,
    resolution: 'local',
  };
};

/**
 * Resolve conflict by keeping server value
 * @param conflict - Conflict to resolve
 * @returns ConflictData - Resolved conflict
 */
export const resolveWithServerValue = (conflict: ConflictData): ConflictData => {
  return {
    ...conflict,
    resolved: true,
    resolution: 'server',
  };
};

/**
 * Resolve conflict by merging values
 * @param conflict - Conflict to resolve
 * @param mergeFunction - Custom merge function
 * @returns ConflictData - Resolved conflict
 */
export const resolveWithMerge = (
  conflict: ConflictData,
  mergeFunction?: (local: any, server: any) => any
): ConflictData => {
  if (mergeFunction) {
    const mergedValue = mergeFunction(conflict.localValue, conflict.serverValue);
    return {
      ...conflict,
      resolved: true,
      resolution: 'merged',
      localValue: mergedValue,
    };
  }

  // Default merge strategies based on data type
  const mergedValue = defaultMerge(conflict.localValue, conflict.serverValue, conflict.field);
  
  return {
    ...conflict,
    resolved: true,
    resolution: 'merged',
    localValue: mergedValue,
  };
};

// ============================================================================
// MERGE STRATEGIES
// ============================================================================

/**
 * Default merge logic based on field type and data
 * @param localValue - Local value
 * @param serverValue - Server value
 * @param field - Field name for context
 * @returns any - Merged value
 */
export const defaultMerge = (localValue: any, serverValue: any, field: string): any => {
  // String concatenation for text fields
  if (typeof localValue === 'string' && typeof serverValue === 'string') {
    return mergeStrings(localValue, serverValue, field);
  }
  
  // Array merging
  if (Array.isArray(localValue) && Array.isArray(serverValue)) {
    return mergeArrays(localValue, serverValue);
  }
  
  // Object merging
  if (typeof localValue === 'object' && typeof serverValue === 'object') {
    return mergeObjects(localValue, serverValue);
  }
  
  // For primitive values, prefer local unless it's empty/null
  if (localValue === null || localValue === undefined || localValue === '') {
    return serverValue;
  }
  
  return localValue;
};

/**
 * Merge string values intelligently
 * @param local - Local string value
 * @param server - Server string value
 * @param field - Field name for context
 * @returns string - Merged string
 */
export const mergeStrings = (local: string, server: string, field: string): string => {
  // For markdown content, try to merge paragraphs
  if (field.includes('content') || field.includes('markdown')) {
    return mergeMarkdownContent(local, server);
  }
  
  // For titles and short text, prefer the longer one if both exist
  if (field.includes('title') || field.includes('name')) {
    if (local.length === 0) return server;
    if (server.length === 0) return local;
    return local.length >= server.length ? local : server;
  }
  
  // Default: prefer local
  return local || server;
};

/**
 * Merge markdown content by combining paragraphs
 * @param local - Local markdown
 * @param server - Server markdown
 * @returns string - Merged markdown
 */
export const mergeMarkdownContent = (local: string, server: string): string => {
  if (!local) return server;
  if (!server) return local;
  
  // Split by double newlines (paragraphs)
  const localParagraphs = local.split(/\n\s*\n/);
  const serverParagraphs = server.split(/\n\s*\n/);
  
  // Use local as base, append server paragraphs that don't exist in local
  const allParagraphs = [...localParagraphs];
  
  serverParagraphs.forEach(serverPara => {
    const exists = localParagraphs.some(localPara => 
      similarity(localPara.trim(), serverPara.trim()) > 0.8
    );
    
    if (!exists) {
      allParagraphs.push(serverPara);
    }
  });
  
  return allParagraphs.join('\n\n');
};

/**
 * Merge arrays by combining unique elements
 * @param local - Local array
 * @param server - Server array
 * @returns any[] - Merged array
 */
export const mergeArrays = (local: any[], server: any[]): any[] => {
  const merged = [...local];
  
  server.forEach(serverItem => {
    const exists = local.some(localItem => isEqual(localItem, serverItem));
    if (!exists) {
      merged.push(serverItem);
    }
  });
  
  return merged;
};

/**
 * Merge objects by combining properties
 * @param local - Local object
 * @param server - Server object
 * @returns any - Merged object
 */
export const mergeObjects = (local: any, server: any): any => {
  if (!local) return server;
  if (!server) return local;
  
  const merged = { ...local };
  
  Object.keys(server).forEach(key => {
    if (!(key in merged)) {
      merged[key] = server[key];
    } else if (typeof merged[key] === 'object' && typeof server[key] === 'object') {
      merged[key] = mergeObjects(merged[key], server[key]);
    }
    // Keep local value for existing keys
  });
  
  return merged;
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a field should be included in conflict detection
 * @param field - Field name
 * @returns boolean - Whether to check this field
 */
export const shouldCheckField = (field: string): boolean => {
  const ignoredFields = [
    'id',
    'createdAt',
    'updatedAt',
    'createdBy',
    'updatedBy',
    '_count',
    '__typename'
  ];
  
  return !ignoredFields.includes(field) && !field.startsWith('_');
};

/**
 * Deep equality check
 * @param a - First value
 * @param b - Second value
 * @returns boolean - Whether values are equal
 */
export const isEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  
  if (a == null || b == null) return a === b;
  
  if (typeof a !== typeof b) return false;
  
  if (typeof a === 'object') {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    
    if (aKeys.length !== bKeys.length) return false;
    
    return aKeys.every(key => isEqual(a[key], b[key]));
  }
  
  return false;
};

/**
 * Calculate similarity between two strings (0-1)
 * @param a - First string
 * @param b - Second string
 * @returns number - Similarity score
 */
export const similarity = (a: string, b: string): number => {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  
  // Simple Levenshtein distance based similarity
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  
  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + cost
      );
    }
  }
  
  const maxLen = Math.max(a.length, b.length);
  return (maxLen - matrix[b.length][a.length]) / maxLen;
};

/**
 * Generate a human-readable description of a conflict
 * @param conflict - Conflict data
 * @returns string - Human-readable description
 */
export const describeConflict = (conflict: ConflictData): string => {
  const fieldName = conflict.field.split('.').pop() || conflict.field;
  
  const descriptions: Record<string, string> = {
    title: 'Report title',
    description: 'Report description',
    cycle: 'Report cycle',
    contentMarkdown: 'Section content',
    isActive: 'Section status',
    displayOrder: 'Section order',
  };
  
  const description = descriptions[fieldName] || fieldName;
  
  return `${description} was modified both locally and on the server`;
};

/**
 * Get recommended resolution for a conflict
 * @param conflict - Conflict data
 * @returns 'local' | 'server' | 'merge' - Recommended resolution
 */
export const getRecommendedResolution = (conflict: ConflictData): 'local' | 'server' | 'merge' => {
  // For content fields, try merging
  if (conflict.field.includes('content') || conflict.field.includes('markdown')) {
    return 'merge';
  }
  
  // For status changes, prefer server (administrative actions)
  if (conflict.field.includes('state') || conflict.field.includes('isActive')) {
    return 'server';
  }
  
  // For user-entered content, prefer local
  if (conflict.field.includes('title') || conflict.field.includes('description')) {
    return 'local';
  }
  
  // Default to prompting user
  return 'local';
};