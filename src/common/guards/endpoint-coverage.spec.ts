import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

// Public protocol endpoints and authenticated self-service are intentionally not
// module permissions. Everything else must declare authorization and its guard.
const exceptions = new Set([
  'app.controller.ts:checkHealth',
  'app.controller.ts:checkRootHealth',
  'auth/auth.resolver.ts:register',
  'auth/auth.resolver.ts:login',
  'auth/auth.resolver.ts:refreshTokens',
  'auth/auth.resolver.ts:forgotPassword',
  'auth/auth.resolver.ts:resetPassword',
  'auth/auth.resolver.ts:verifyEmail',
  'auth/auth.resolver.ts:resendVerificationEmail',
  'marketing/marketing.resolver.ts:marketingLandingPage',
  'schools/schools.resolver.ts:registerSchool',
]);
const selfService = new Set([
  'auth/auth.resolver.ts:logout',
  'auth/auth.resolver.ts:updateExpoPushToken',
  'schools/schools.resolver.ts:mySchool',
]);
const files = (dir: string): string[] =>
  fs.readdirSync(dir).flatMap((name) => {
    const file = path.join(dir, name);
    return fs.statSync(file).isDirectory() ? files(file) : [file];
  });

describe('endpoint authorization coverage', () => {
  it('pairs explicit metadata with authentication and authorization guards', () => {
    const root = path.join(__dirname, '../..');
    const issues: string[] = [];
    let checked = 0;
    for (const file of files(root).filter((f) =>
      /\.(resolver|controller)\.ts$/.test(f),
    )) {
      const source = ts.createSourceFile(
        file,
        fs.readFileSync(file, 'utf8'),
        ts.ScriptTarget.Latest,
        true,
      );
      const decorators = (node: ts.Node) =>
        ts.canHaveDecorators(node)
          ? (ts.getDecorators(node) || [])
              .map((d) => d.expression.getText(source))
              .join('\n')
          : '';
      for (const declaration of source.statements.filter(
        ts.isClassDeclaration,
      )) {
        for (const member of declaration.members) {
          const method = decorators(member);
          if (!/(Query|Mutation|Get|Post|Put|Delete|Patch)\(/.test(method))
            continue;
          checked++;
          const key = `${path.relative(root, file)}:${member.name?.getText(source)}`;
          if (exceptions.has(key)) continue;
          const metadata = decorators(declaration) + '\n' + method;
          if (!metadata.includes('JwtAuthGuard'))
            issues.push(`${key}: authentication missing`);
          if (selfService.has(key)) continue;
          if (!/RequirePermission\(|Roles\(/.test(metadata))
            issues.push(`${key}: authorization missing`);
          if (
            metadata.includes('RequirePermission(') &&
            !metadata.includes('PermissionGuard')
          )
            issues.push(`${key}: PermissionGuard missing`);
          if (metadata.includes('Roles(') && !metadata.includes('RolesGuard'))
            issues.push(`${key}: RolesGuard missing`);
        }
      }
    }
    expect(checked).toBeGreaterThan(250);
    expect(issues).toEqual([]);
  });
});
