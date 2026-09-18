const EXPLICIT_RESOURCE_MANAGEMENT = /\b(?:await\s+)?using\s+[A-Za-z_$][\w$]*\s*=/;

/** Test whether emitted JavaScript retains an Explicit Resource Management declaration. */
export function hasExplicitResourceManagementSyntax(source: string) {
  return EXPLICIT_RESOURCE_MANAGEMENT.test(source);
}
