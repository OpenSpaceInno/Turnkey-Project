#!/usr/bin/env python3
"""
Script to fix all .returning() calls in TypeScript route files.
MySQL doesn't support .returning(), so we need to query after insert/update.
"""

import re
import os
from pathlib import Path

# Route files directory
ROUTES_DIR = Path(r"c:\Users\Hari\Downloads\Turnkey Project\TurnKey Project\artifacts\api-server\src\routes")

def fix_insert_returning(content):
    """Fix insert().values().returning() pattern"""
    # Pattern: const [var] = await db.insert(table).values({...}).returning();
    pattern = r'(const\s+\[(\w+)\]\s+=\s+await\s+db\s*\n?\s*\.insert\((\w+)\)\s*\n?\s*\.values\([^)]+\))\s*\.returning\(\);'
    
    def replace_insert(match):
        full_statement = match.group(1)
        var_name = match.group(2)
        table_name = match.group(3)
        
        # Remove the const declaration and returning
        insert_stmt = full_statement.replace(f'const [{var_name}] = ', '')
        
        # Create new version
        return f'''{insert_stmt};
  
  // MySQL doesn't support .returning() - query after insert
  const [{var_name}] = await db
    .select()
    .from({table_name})
    .orderBy(sql`${{table_name}}.id DESC`)
    .limit(1);'''
    
    return re.sub(pattern, replace_insert, content, flags=re.MULTILINE | re.DOTALL)

def fix_update_returning(content):
    """Fix update().set().where().returning() pattern"""
    # Pattern: const [var] = await db.update(table).set({...}).where(...).returning();
    pattern = r'(const\s+\[(\w+)\]\s+=\s+await\s+db\s*\n?\s*\.update\((\w+)\)\s*\n?\s*\.set\([^)]+\)\s*\n?\s*\.where\([^)]+\))\s*\.returning\(\);'
    
    def replace_update(match):
        full_statement = match.group(1)
        var_name = match.group(2)
        table_name = match.group(3)
        
        # Extract the where clause
        where_match = re.search(r'\.where\(([^)]+)\)', full_statement)
        where_clause = where_match.group(1) if where_match else ''
        
        # Remove the const declaration and returning
        update_stmt = full_statement.replace(f'const [{var_name}] = ', '')
        
        # Create new version
        return f'''{update_stmt};
  
  // MySQL doesn't support .returning() - query after update
  const [{var_name}] = await db
    .select()
    .from({table_name})
    .where({where_clause})
    .limit(1);'''
    
    return re.sub(pattern, replace_update, content, flags=re.MULTILINE | re.DOTALL)

def fix_delete_returning(content):
    """Fix delete().where().returning() pattern"""
    # Pattern: const [var] = await db.delete(table).where(...).returning();
    pattern = r'const\s+\[(\w+)\]\s+=\s+await\s+db\s*\n?\s*\.delete\((\w+)\)\s*\n?\s*\.where\(([^)]+)\)\s*\.returning\(\);'
    
    def replace_delete(match):
        var_name = match.group(1)
        table_name = match.group(2)
        where_clause = match.group(3)
        
        # Create new version - check if exists first, then delete
        return f'''// MySQL doesn't support .returning() - check if exists first
  const [{var_name}] = await db
    .select()
    .from({table_name})
    .where({where_clause})
    .limit(1);
  
  if ({var_name}) {{
    await db.delete({table_name}).where({where_clause});
  }}'''
    
    return re.sub(pattern, replace_delete, content, flags=re.MULTILINE | re.DOTALL)

def add_sql_import(content):
    """Add sql import from drizzle-orm if not present"""
    if 'import { sql }' not in content and 'from "drizzle-orm"' in content:
        # Find the drizzle-orm import line and add sql to it
        content = re.sub(
            r'(import\s+{)([^}]+)(}\s+from\s+"drizzle-orm")',
            r'\1\2, sql\3',
            content
        )
    elif 'import {' in content and 'sql' not in content:
        # Add new import line
        first_import = content.find('import {')
        if first_import != -1:
            content = 'import { sql } from "drizzle-orm";\n' + content
    
    return content

def process_file(filepath):
    """Process a single route file"""
    print(f"Processing {filepath.name}...")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Apply fixes
    content = fix_insert_returning(content)
    content = fix_update_returning(content)
    content = fix_delete_returning(content)
    
    # Add sql import if we made changes
    if content != original_content:
        content = add_sql_import(content)
    
    # Write back if changed
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  ✓ Fixed {filepath.name}")
        return True
    else:
        print(f"  - No changes needed for {filepath.name}")
        return False

def main():
    """Main function"""
    if not ROUTES_DIR.exists():
        print(f"Error: Routes directory not found: {ROUTES_DIR}")
        return
    
    # Skip certain files
    skip_files = {'index.ts', 'health.ts', 'dashboard.ts'}
    
    # Process all .ts files
    files_processed = 0
    files_changed = 0
    
    for filepath in ROUTES_DIR.glob('*.ts'):
        if filepath.name in skip_files:
            print(f"Skipping {filepath.name}")
            continue
        
        files_processed += 1
        if process_file(filepath):
            files_changed += 1
    
    print(f"\n✓ Done! Processed {files_processed} files, changed {files_changed} files.")

if __name__ == '__main__':
    main()
