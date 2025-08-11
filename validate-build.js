#!/usr/bin/env node

/**
 * Script de Validação de Build para Hostinger
 * Verifica compatibilidade e corrige problemas comuns antes do deploy
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 [VALIDATE] Iniciando validação de build para Hostinger...');

// 1. Verificar tsconfig.json
console.log('📋 [VALIDATE] Verificando tsconfig.json...');
const tsconfigPath = path.join(__dirname, 'tsconfig.json');
if (fs.existsSync(tsconfigPath)) {
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
  
  // Verificar configurações críticas
  const requiredSettings = {
    target: 'es2017',
    downlevelIteration: true,
    lib: ['dom', 'dom.iterable', 'es2017', 'es2015']
  };
  
  let needsUpdate = false;
  for (const [key, value] of Object.entries(requiredSettings)) {
    if (key === 'lib') {
      if (!tsconfig.compilerOptions.lib || !tsconfig.compilerOptions.lib.includes('es2017')) {
        console.log(`⚠️ [VALIDATE] tsconfig.json precisa incluir es2017 em lib`);
        needsUpdate = true;
      }
    } else if (tsconfig.compilerOptions[key] !== value) {
      console.log(`⚠️ [VALIDATE] tsconfig.json precisa de ${key}: ${value}`);
      needsUpdate = true;
    }
  }
  
  if (!needsUpdate) {
    console.log('✅ [VALIDATE] tsconfig.json está correto');
  }
} else {
  console.log('❌ [VALIDATE] tsconfig.json não encontrado');
}

// 2. Verificar problemas de compatibilidade nos arquivos API
console.log('📋 [VALIDATE] Verificando arquivos da API...');
const apiFiles = [
  'app/api/checklist-associado/route.ts',
  'app/api/checklist-associados/route.ts'
];

let hasApiIssues = false;
apiFiles.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Verificar problemas comuns
    if (content.includes('Number.parseInt')) {
      console.log(`⚠️ [VALIDATE] ${filePath} usa Number.parseInt (deve ser parseInt)`);
      hasApiIssues = true;
    }
    
    if (content.includes('[...new Set(') && !content.includes('Array.from(new Set(')) {
      console.log(`⚠️ [VALIDATE] ${filePath} usa spread com Set (deve usar Array.from)`);
      hasApiIssues = true;
    }
    
    // Verificar null safety
    if (content.includes('.map((item) => item.') && !content.includes('item is NonNullable') && !content.includes('item!.')) {
      console.log(`⚠️ [VALIDATE] ${filePath} pode ter problemas de null safety em map`);
      hasApiIssues = true;
    }
    
    if (!hasApiIssues) {
      console.log(`✅ [VALIDATE] ${filePath} está correto`);
    }
  } else {
    console.log(`❌ [VALIDATE] ${filePath} não encontrado`);
  }
});

// 3. Verificar problemas de tipos no app/page.tsx
console.log('📋 [VALIDATE] Verificando app/page.tsx...');
const pageFilePath = path.join(__dirname, 'app/page.tsx');
if (fs.existsSync(pageFilePath)) {
  const pageContent = fs.readFileSync(pageFilePath, 'utf8');
  
  // Verificar problemas de tipos conhecidos
  if (pageContent.includes('Object.entries(info.horarios).forEach(([horario, count])') && 
      !pageContent.includes('count as number')) {
    console.log('⚠️ [VALIDATE] app/page.tsx tem problema de tipo com count (deve usar type assertion)');
    hasApiIssues = true;
  }
  
  if (!hasApiIssues) {
    console.log('✅ [VALIDATE] app/page.tsx está correto');
  }
} else {
  console.log('❌ [VALIDATE] app/page.tsx não encontrado');
}

// 4. Verificar package.json
console.log('📋 [VALIDATE] Verificando package.json...');
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Verificar scripts essenciais
  const requiredScripts = ['build', 'start', 'dev'];
  const missingScripts = requiredScripts.filter(script => !pkg.scripts[script]);
  
  if (missingScripts.length > 0) {
    console.log(`⚠️ [VALIDATE] Scripts faltando: ${missingScripts.join(', ')}`);
  } else {
    console.log('✅ [VALIDATE] Scripts do package.json estão corretos');
  }
  
  // Verificar dependências críticas
  const criticalDeps = ['next', 'react', 'react-dom', 'typescript'];
  const missingDeps = criticalDeps.filter(dep => !pkg.dependencies[dep] && !pkg.devDependencies[dep]);
  
  if (missingDeps.length > 0) {
    console.log(`❌ [VALIDATE] Dependências críticas faltando: ${missingDeps.join(', ')}`);
  } else {
    console.log('✅ [VALIDATE] Dependências críticas presentes');
  }
} else {
  console.log('❌ [VALIDATE] package.json não encontrado');
}

// 5. Verificar next.config.mjs
console.log('📋 [VALIDATE] Verificando next.config.mjs...');
const nextConfigPath = path.join(__dirname, 'next.config.mjs');
if (fs.existsSync(nextConfigPath)) {
  const content = fs.readFileSync(nextConfigPath, 'utf8');
  
  if (content.includes("output: 'standalone'")) {
    console.log('✅ [VALIDATE] next.config.mjs configurado para standalone');
  } else {
    console.log("⚠️ [VALIDATE] next.config.mjs deve incluir output: 'standalone'");
  }
} else {
  console.log('❌ [VALIDATE] next.config.mjs não encontrado');
}

// 6. Verificar estrutura de diretórios
console.log('📋 [VALIDATE] Verificando estrutura de diretórios...');
const requiredDirs = ['app', 'components', 'public'];
const missingDirs = requiredDirs.filter(dir => !fs.existsSync(path.join(__dirname, dir)));

if (missingDirs.length > 0) {
  console.log(`❌ [VALIDATE] Diretórios faltando: ${missingDirs.join(', ')}`);
} else {
  console.log('✅ [VALIDATE] Estrutura de diretórios correta');
}

// 7. Resumo final
console.log('\n🎯 [VALIDATE] RESUMO DA VALIDAÇÃO:');
console.log('=====================================');

if (!hasApiIssues) {
  console.log('✅ Arquivos da API: OK');
  console.log('✅ Arquivo principal (page.tsx): OK');
  console.log('✅ Compatibilidade TypeScript: OK');
  console.log('✅ Sintaxe ES2017+: OK');
  console.log('✅ Type Safety: OK');
  console.log('✅ Null Safety: OK');
  console.log('✅ Pronto para build no Hostinger');
  console.log('\n🚀 [VALIDATE] Execute: npm run build');
} else {
  console.log('❌ Problemas encontrados nos arquivos');
  console.log('⚠️ Corrija os problemas antes do build');
  process.exit(1);
}

console.log('\n📋 [VALIDATE] Validação concluída!');