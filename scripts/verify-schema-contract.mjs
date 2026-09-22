import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = dirname(scriptDirectory);

const enumSources = {
  UserRole: join(projectDirectory, 'src/common/enums/role.enum.ts'),
  AppResource: join(projectDirectory, 'src/access/enums/resource.enum.ts'),
  PermissionAction: join(
    projectDirectory,
    'src/access/enums/permission-action.enum.ts',
  ),
};

const enumMembers = (source, enumName) => {
  const match = source.match(
    new RegExp(`enum\\s+${enumName}\\s*\\{([\\s\\S]*?)\\n\\}`),
  );
  if (!match) throw new Error(`Could not find ${enumName} in source`);

  return [...match[1].matchAll(/^\s*([A-Z][A-Z0-9_]*)\s*=/gm)].map(
    ([, member]) => member,
  );
};

const enumBlock = (schema, enumName) => {
  const match = schema.match(
    new RegExp(`enum\\s+${enumName}\\s*\\{([\\s\\S]*?)\\n\\}`),
  );
  return match?.[1] || null;
};

const schema = await readFile(join(projectDirectory, 'schema.gql'), 'utf8');
const failures = [];

for (const [enumName, sourcePath] of Object.entries(enumSources)) {
  const source = await readFile(sourcePath, 'utf8');
  const expected = enumMembers(source, enumName);
  const block = enumBlock(schema, enumName);

  if (!block) {
    failures.push(`${enumName}: missing from schema.gql`);
    continue;
  }

  const actual = [...block.matchAll(/^\s*([A-Z][A-Z0-9_]*)\s*$/gm)].map(
    ([, member]) => member,
  );
  const missing = expected.filter((member) => !actual.includes(member));
  const unexpected = actual.filter((member) => !expected.includes(member));

  if (missing.length > 0) {
    failures.push(`${enumName}: missing ${missing.join(', ')}`);
  }
  if (unexpected.length > 0) {
    failures.push(`${enumName}: unexpected ${unexpected.join(', ')}`);
  }
}

if (failures.length > 0) {
  console.error('GraphQL schema contract drift detected:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  console.error(
    'Regenerate schema.gql through the backend application schema-generation workflow.',
  );
  process.exit(1);
}

console.log('GraphQL schema contract matches backend authorization enums.');
