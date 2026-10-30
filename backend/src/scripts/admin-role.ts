import { loadEnv } from '../config/env.js';
import { connectDatabase } from '../modules/auth/db.js';
import { setUserRoleByEmailFromCli } from '../modules/admin/admin-service.js';

const [operation, rawEmail] = process.argv.slice(2);

if (!['promote', 'demote'].includes(operation ?? '') || !rawEmail) {
  console.error('Uso: admin-role <promote|demote> <email>');
  process.exit(2);
}

const env = loadEnv();
if (!env.DATABASE_URL) {
  console.error('DATABASE_URL não está configurada.');
  process.exit(2);
}

const pool = await connectDatabase(env.DATABASE_URL);

try {
  const role = operation === 'promote' ? 'ADMIN' : 'USER';
  const result = await setUserRoleByEmailFromCli(pool, rawEmail, role);
  if (!result.changed) {
    console.log(`Nenhuma alteração: ${result.email} já possui role ${result.role}.`);
  } else {
    console.log(`Role atualizada: ${result.email} -> ${result.role}.`);
  }
} catch (error) {
  const code = error instanceof Error ? error.message : 'unknown_error';
  if (code === 'user_not_found') {
    console.error('Conta não encontrada para o e-mail informado.');
  } else if (code === 'invalid_email') {
    console.error('E-mail inválido.');
  } else if (code === 'last_admin') {
    console.error('Operação recusada: não é permitido remover o último administrador ativo.');
  } else {
    console.error('Não foi possível alterar a role da conta.');
  }
  process.exitCode = 1;
} finally {
  await pool.end();
}
