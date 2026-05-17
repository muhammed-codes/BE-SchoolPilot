const fs = require('fs');
const path = require('path');

const resolversPath = path.join(__dirname, 'src');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir(resolversPath, function(filePath) {
  if (filePath.endsWith('.resolver.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes('@RequirePermission(')) {
      // Remove @Roles(...) decorators
      content = content.replace(/@Roles\([^)]*\)\s*/g, '');
      
      // Remove Roles import
      content = content.replace(/,\s*Roles\s*,/, ',');
      content = content.replace(/Roles\s*,\s*/, '');
      content = content.replace(/import\s*{\s*Roles\s*}\s*from[^;]+;\s*/, '');
      
      // Remove unused LEADERSHIP_ROLES, SCHOOL_STAFF_ROLES etc if they are not used elsewhere
      if (!content.includes('LEADERSHIP_ROLES') && content.includes('LEADERSHIP_ROLES')) {
         // this is safe since we just removed @Roles
      }

      fs.writeFileSync(filePath, content);
      console.log('Removed @Roles from', filePath);
    }
  }
});
