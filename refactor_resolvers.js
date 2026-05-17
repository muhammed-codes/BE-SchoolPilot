const fs = require('fs');
const path = require('path');

const filesToProcess = [
  { file: 'src/students/students.resolver.ts', resource: 'STUDENTS' },
  { file: 'src/classes/classes.resolver.ts', resource: 'CLASSES' },
  { file: 'src/attendance/attendance.resolver.ts', resource: 'ATTENDANCE' },
  { file: 'src/subjects/subjects.resolver.ts', resource: 'SUBJECTS' },
  { file: 'src/users/users.resolver.ts', resource: 'USERS' },
  { file: 'src/results/results.resolver.ts', resource: 'RESULTS' },
  { file: 'src/id-cards/id-cards.resolver.ts', resource: 'ID_CARDS' },
];

for (const { file, resource } of filesToProcess) {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');

  // Add AppResource import
  if (!content.includes('AppResource')) {
    content = content.replace(/(import.*@nestjs\/graphql';)/, "$1\nimport { AppResource } from '../access/enums/resource.enum';");
  }
  
  // Update guards import
  if (!content.includes('PermissionGuard')) {
    content = content.replace(/import { (.*)JwtAuthGuard(.*) } from '\.\.\/common\/guards';/, "import { $1JwtAuthGuard$2, PermissionGuard } from '../common/guards';");
  }

  // Update decorators import
  if (!content.includes('RequirePermission')) {
    content = content.replace(/import { (.*)CurrentUser(.*) } from '\.\.\/common\/decorators';/, "import { $1CurrentUser$2, RequirePermission } from '../common/decorators';");
  }

  // Find methods and replace
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    let isQuery = line.includes('@Query(');
    let isMutation = line.includes('@Mutation(');
    
    if (isQuery || isMutation) {
      // Look ahead to find the method name to determine action
      let action = isQuery ? 'canRead' : 'canUpdate';
      let j = i + 1;
      let methodNameLine = '';
      while (j < lines.length && (lines[j].includes('@') || lines[j].trim() === '')) {
        j++;
      }
      if (j < lines.length) {
        methodNameLine = lines[j];
        if (isMutation) {
          if (methodNameLine.match(/(create|add|import|upload|generate)/i)) action = 'canCreate';
          if (methodNameLine.match(/(delete|remove)/i)) action = 'canDelete';
          if (methodNameLine.match(/(update|assign|promote|link|unlink)/i)) action = 'canUpdate';
        }
      }

      // Find the UseGuards line and add PermissionGuard, or insert it if missing
      let k = i + 1;
      let hasGuards = false;
      while (k < j) {
        if (lines[k].includes('@UseGuards(')) {
          hasGuards = true;
          if (!lines[k].includes('PermissionGuard')) {
             lines[k] = lines[k].replace(')', ', PermissionGuard)');
          }
          break;
        }
        k++;
      }
      
      // If no UseGuards found between @Query/@Mutation and method, add it right after @Query/@Mutation
      if (!hasGuards) {
        lines.splice(i + 1, 0, `  @UseGuards(JwtAuthGuard, PermissionGuard)`);
        j++; // Shift j down
        i++; // Skip the line we just added
      }

      // Add @RequirePermission
      lines.splice(i + 2, 0, `  @RequirePermission(AppResource.${resource}, '${action}')`);
      i++; // Skip the line we just added
    }
  }

  fs.writeFileSync(filePath, lines.join('\n'));
}

console.log('Resolvers updated successfully!');
