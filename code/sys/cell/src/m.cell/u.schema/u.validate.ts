import { Schema, type t } from './common.ts';
import { DescriptorSchema } from './u.schema.descriptor.ts';

export function validateDescriptor(value: unknown): t.Cell.Schema.Validation {
  const errors: t.Cell.Schema.Issue[] = [];

  for (const error of Schema.Value.Errors(DescriptorSchema, value)) {
    errors.push({ kind: 'schema', path: error.path || '<root>', message: error.message });
  }

  if (errors.length === 0) {
    errors.push(...validateDescriptorSemantics(value as t.Cell.Descriptor));
  }

  return { ok: errors.length === 0, errors };
}

function validateDescriptorSemantics(descriptor: t.Cell.Descriptor): t.Cell.Schema.Issue[] {
  const errors: t.Cell.Schema.Issue[] = [];
  const serviceNames = new Set<string>();

  descriptor.runtime?.services.forEach((service, index) => {
    const servicePath = `/runtime/services/${index}`;

    if (serviceNames.has(service.name)) {
      errors.push({
        kind: 'semantic',
        path: `${servicePath}/name`,
        message: `Duplicate runtime service name: ${service.name}`,
      });
    }
    serviceNames.add(service.name);
  });

  return errors;
}
