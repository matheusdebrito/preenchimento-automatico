import { randomUUID } from 'node:crypto';
import type { Database } from '../auth/db.js';
import type { UserRole, UserStatus } from '../auth/auth-service.js';

export interface AdminUserSummary {
  id: string;
  email: string;
  fullName: string | null;
  cellphone: string | null;
  status: UserStatus;
  role: UserRole;
  createdAt: Date;
  balance: number;
  creditsUsed: number;
  lastCreditAt: Date | null;
}

export interface AdminDashboard {
  users: {
    total: number;
    active: number;
    blocked: number;
    pending: number;
  };
  credits: {
    usedToday: number;
    usedWeek: number;
    usedMonth: number;
    grantedMonth: number;
    totalBalance: number;
  };
}


export type AdminUsagePeriod = 'today' | '7d' | 'month' | 'year';

export interface AdminUsagePoint {
  bucket: string;
  label: string;
  creditsUsed: number;
  inputTokens: number;
  outputTokens: number;
}

export interface AdminUsageMetrics {
  period: AdminUsagePeriod;
  creditsUsed: number;
  inputTokens: number;
  outputTokens: number;
  points: readonly AdminUsagePoint[];
}

function usagePeriodSql(period: AdminUsagePeriod): {
  start: string;
  end: string;
  step: string;
  trunc: 'hour' | 'day' | 'month';
  label: string;
} {
  if (period === 'today') {
    return {
      start: "date_trunc('day', timezone('America/Sao_Paulo', now()))",
      end: "date_trunc('day', timezone('America/Sao_Paulo', now())) + interval '1 day'",
      step: "interval '1 hour'",
      trunc: 'hour',
      label: "to_char(bucket, 'HH24\"h\"')",
    };
  }
  if (period === '7d') {
    return {
      start: "date_trunc('day', timezone('America/Sao_Paulo', now())) - interval '6 days'",
      end: "date_trunc('day', timezone('America/Sao_Paulo', now())) + interval '1 day'",
      step: "interval '1 day'",
      trunc: 'day',
      label: "to_char(bucket, 'DD/MM')",
    };
  }
  if (period === 'month') {
    return {
      start: "date_trunc('month', timezone('America/Sao_Paulo', now()))",
      end: "date_trunc('month', timezone('America/Sao_Paulo', now())) + interval '1 month'",
      step: "interval '1 day'",
      trunc: 'day',
      label: "to_char(bucket, 'DD/MM')",
    };
  }
  return {
    start: "date_trunc('year', timezone('America/Sao_Paulo', now()))",
    end: "date_trunc('year', timezone('America/Sao_Paulo', now())) + interval '1 year'",
    step: "interval '1 month'",
    trunc: 'month',
    label: "to_char(bucket, 'MM/YYYY')",
  };
}

export async function adminUsage(
  pool: Database,
  period: AdminUsagePeriod,
): Promise<AdminUsageMetrics> {
  const config = usagePeriodSql(period);
  const result = await pool.query<{
    bucket: string;
    label: string;
    credits_used: string;
    input_tokens: string;
    output_tokens: string;
  }>(`
    WITH bounds AS (
      SELECT ${config.start} AS start_at, ${config.end} AS end_at
    ),
    buckets AS (
      SELECT generate_series(start_at, end_at - ${config.step}, ${config.step}) AS bucket
      FROM bounds
    ),
    credit_usage AS (
      SELECT
        date_trunc('${config.trunc}', timezone('America/Sao_Paulo', created_at)) AS bucket,
        SUM(-amount)::bigint AS credits_used
      FROM credit_ledger, bounds
      WHERE reason='consume'
        AND created_at >= start_at AT TIME ZONE 'America/Sao_Paulo'
        AND created_at < end_at AT TIME ZONE 'America/Sao_Paulo'
      GROUP BY 1
    ),
    token_usage AS (
      SELECT
        date_trunc('${config.trunc}', timezone('America/Sao_Paulo', created_at)) AS bucket,
        SUM(input_tokens)::bigint AS input_tokens,
        SUM(output_tokens)::bigint AS output_tokens
      FROM openai_usage, bounds
      WHERE created_at >= start_at AT TIME ZONE 'America/Sao_Paulo'
        AND created_at < end_at AT TIME ZONE 'America/Sao_Paulo'
      GROUP BY 1
    )
    SELECT
      buckets.bucket::text,
      ${config.label} AS label,
      COALESCE(credit_usage.credits_used,0)::text AS credits_used,
      COALESCE(token_usage.input_tokens,0)::text AS input_tokens,
      COALESCE(token_usage.output_tokens,0)::text AS output_tokens
    FROM buckets
    LEFT JOIN credit_usage USING(bucket)
    LEFT JOIN token_usage USING(bucket)
    ORDER BY buckets.bucket
  `);

  const points = result.rows.map((row) => ({
    bucket: row.bucket,
    label: row.label,
    creditsUsed: toNumber(row.credits_used),
    inputTokens: toNumber(row.input_tokens),
    outputTokens: toNumber(row.output_tokens),
  }));

  return {
    period,
    creditsUsed: points.reduce((total, item) => total + item.creditsUsed, 0),
    inputTokens: points.reduce((total, item) => total + item.inputTokens, 0),
    outputTokens: points.reduce((total, item) => total + item.outputTokens, 0),
    points,
  };
}

function toNumber(value: string | number | null | undefined): number {
  return Number(value ?? 0);
}

export async function adminDashboard(pool: Database): Promise<AdminDashboard> {
  const users = await pool.query<{
    total: string; active: string; blocked: string; pending: string;
  }>(`
    SELECT
      COUNT(*)::text AS total,
      COUNT(*) FILTER (WHERE status='ACTIVE')::text AS active,
      COUNT(*) FILTER (WHERE status='BLOCKED')::text AS blocked,
      COUNT(*) FILTER (WHERE status='PENDING')::text AS pending
    FROM app_users
  `);

  const credits = await pool.query<{
    used_today: string;
    used_week: string;
    used_month: string;
    granted_month: string;
    total_balance: string;
  }>(`
    WITH boundaries AS (
      SELECT
        date_trunc('day', timezone('America/Sao_Paulo', now())) AT TIME ZONE 'America/Sao_Paulo' AS day_start,
        date_trunc('week', timezone('America/Sao_Paulo', now())) AT TIME ZONE 'America/Sao_Paulo' AS week_start,
        date_trunc('month', timezone('America/Sao_Paulo', now())) AT TIME ZONE 'America/Sao_Paulo' AS month_start
    )
    SELECT
      COALESCE(SUM(-amount) FILTER (WHERE reason='consume' AND created_at >= day_start),0)::text AS used_today,
      COALESCE(SUM(-amount) FILTER (WHERE reason='consume' AND created_at >= week_start),0)::text AS used_week,
      COALESCE(SUM(-amount) FILTER (WHERE reason='consume' AND created_at >= month_start),0)::text AS used_month,
      COALESCE(SUM(amount) FILTER (WHERE reason='admin_grant' AND created_at >= month_start),0)::text AS granted_month,
      COALESCE(SUM(amount),0)::text AS total_balance
    FROM credit_ledger, boundaries
  `);

  const u = users.rows[0]!;
  const c = credits.rows[0]!;
  return {
    users: {
      total: toNumber(u.total),
      active: toNumber(u.active),
      blocked: toNumber(u.blocked),
      pending: toNumber(u.pending),
    },
    credits: {
      usedToday: toNumber(c.used_today),
      usedWeek: toNumber(c.used_week),
      usedMonth: toNumber(c.used_month),
      grantedMonth: toNumber(c.granted_month),
      totalBalance: toNumber(c.total_balance),
    },
  };
}

interface ListUsersInput {
  page: number;
  pageSize: number;
  query?: string;
  status?: UserStatus;
  role?: UserRole;
}

export async function listAdminUsers(
  pool: Database,
  input: ListUsersInput,
): Promise<{ users: readonly AdminUserSummary[]; total: number; page: number; pageSize: number }> {
  const where: string[] = [];
  const values: unknown[] = [];
  const add = (value: unknown): string => {
    values.push(value);
    return '$' + values.length;
  };
  if (input.query) {
    const normalized = input.query.trim().toLowerCase();
    const textPattern = add('%' + normalized + '%');
    const digits = normalized.replace(/\D/g, '');
    const digitClause = digits
      ? ` OR COALESCE(u.cellphone,'') LIKE ${add('%' + digits + '%')}`
      : '';
    where.push(`(
      lower(COALESCE(u.full_name,'')) LIKE ${textPattern}
      OR lower(u.email) LIKE ${textPattern}
      ${digitClause}
    )`);
  }
  if (input.status) where.push('u.status=' + add(input.status));
  if (input.role) where.push('u.role=' + add(input.role));
  const clause = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const count = await pool.query<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM app_users u ${clause}`,
    values,
  );

  const limit = add(input.pageSize);
  const offset = add((input.page - 1) * input.pageSize);
  const result = await pool.query<{
    id: string; email: string; full_name: string | null; cellphone: string | null;
    status: UserStatus; role: UserRole; created_at: Date;
    balance: string; credits_used: string; last_credit_at: Date | null;
  }>(`
    SELECT
      u.id,u.email,u.full_name,u.cellphone,u.status,u.role,u.created_at,
      COALESCE(c.balance,0)::text AS balance,
      COALESCE(c.credits_used,0)::text AS credits_used,
      c.last_credit_at
    FROM app_users u
    LEFT JOIN LATERAL (
      SELECT
        COALESCE(SUM(amount),0) AS balance,
        COUNT(*) FILTER (WHERE reason='consume') AS credits_used,
        MAX(created_at) AS last_credit_at
      FROM credit_ledger
      WHERE user_id=u.id
    ) c ON true
    ${clause}
    ORDER BY u.created_at DESC, u.id
    LIMIT ${limit} OFFSET ${offset}
  `, values);

  return {
    users: result.rows.map((row) => ({
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      cellphone: row.cellphone,
      status: row.status,
      role: row.role,
      createdAt: row.created_at,
      balance: toNumber(row.balance),
      creditsUsed: toNumber(row.credits_used),
      lastCreditAt: row.last_credit_at,
    })),
    total: toNumber(count.rows[0]?.total),
    page: input.page,
    pageSize: input.pageSize,
  };
}

export async function getAdminUser(pool: Database, userId: string) {
  const users = await pool.query<{
    id:string; email:string; full_name:string|null; cellphone:string|null;
    status:UserStatus; role:UserRole; created_at:Date; balance:string; credits_used:string;
  }>(`
    SELECT u.id,u.email,u.full_name,u.cellphone,u.status,u.role,u.created_at,
      COALESCE(SUM(c.amount),0)::text AS balance,
      COUNT(c.id) FILTER (WHERE c.reason='consume')::text AS credits_used
    FROM app_users u
    LEFT JOIN credit_ledger c ON c.user_id=u.id
    WHERE u.id=$1
    GROUP BY u.id
  `, [userId]);
  const row = users.rows[0];
  if (!row) return null;

  const history = await pool.query<{
    id:string; reason:string; amount:number; created_at:Date;
  }>(`
    SELECT id,reason,amount,created_at
    FROM credit_ledger
    WHERE user_id=$1
    ORDER BY created_at DESC
    LIMIT 100
  `, [userId]);

  return {
    user: {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      cellphone: row.cellphone,
      status: row.status,
      role: row.role,
      createdAt: row.created_at,
      balance: toNumber(row.balance),
      creditsUsed: toNumber(row.credits_used),
    },
    movements: history.rows.map((item) => ({
      id: item.id,
      reason: item.reason,
      amount: item.amount,
      createdAt: item.created_at,
    })),
  };
}

async function writeAudit(
  pool: Pick<Database, 'query'>,
  adminUserId: string | null,
  targetUserId: string | null,
  action: 'CREDIT_GRANT' | 'STATUS_CHANGE' | 'ROLE_CHANGE',
  metadata: Record<string, unknown>,
  actorLabel?: string,
): Promise<void> {
  await pool.query(
    `INSERT INTO admin_audit_log(
       id,admin_user_id,target_user_id,action,metadata,actor_label
     ) VALUES($1,$2,$3,$4,$5::jsonb,$6)`,
    [randomUUID(), adminUserId, targetUserId, action, JSON.stringify(metadata), actorLabel ?? null],
  );
}


export async function setUserRoleByEmailFromCli(
  pool: Database,
  rawEmail: string,
  role: UserRole,
): Promise<{ id: string; email: string; role: UserRole; changed: boolean }> {
  const email = rawEmail.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) {
    throw new Error('invalid_email');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(145902, 2)');
    const target = await client.query<{ id:string; email:string; role:UserRole; status:UserStatus }>(
      'SELECT id,email,role,status FROM app_users WHERE email=$1 FOR UPDATE',
      [email],
    );
    const user = target.rows[0];
    if (!user) throw new Error('user_not_found');

    if (user.role === 'ADMIN' && role === 'USER' && user.status === 'ACTIVE') {
      const activeAdmins = await client.query<{ count:string }>(
        "SELECT COUNT(*)::text AS count FROM app_users WHERE role='ADMIN' AND status='ACTIVE'",
      );
      if (Number(activeAdmins.rows[0]?.count ?? 0) <= 1) throw new Error('last_admin');
    }

    const changed = user.role !== role;
    if (changed) {
      await client.query('UPDATE app_users SET role=$1 WHERE id=$2', [role, user.id]);
      await writeAudit(
        client as unknown as Database,
        null,
        user.id,
        'ROLE_CHANGE',
        { from: user.role, to: role, source: 'cli' },
        'CLI',
      );
    }

    await client.query('COMMIT');
    return { id: user.id, email: user.email, role, changed };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function changeUserStatus(
  pool: Database,
  adminUserId: string,
  targetUserId: string,
  status: UserStatus,
): Promise<void> {
  if (adminUserId === targetUserId) throw new Error('admin_self_protection');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(145902, 2)');
    const target = await client.query<{ status: UserStatus; role: UserRole }>(
      'SELECT status,role FROM app_users WHERE id=$1 FOR UPDATE', [targetUserId]);
    if (!target.rows[0]) throw new Error('user_not_found');
    const previous = target.rows[0].status;
    if (target.rows[0].role === 'ADMIN' && previous === 'ACTIVE' && status !== 'ACTIVE') {
      const activeAdmins = await client.query<{ count: string }>(
        "SELECT COUNT(*)::text AS count FROM app_users WHERE role='ADMIN' AND status='ACTIVE'");
      if (Number(activeAdmins.rows[0]?.count ?? 0) <= 1) throw new Error('last_admin');
    }
    if (previous !== status) {
      await client.query('UPDATE app_users SET status=$1 WHERE id=$2', [status, targetUserId]);
      if (status !== 'ACTIVE') {
        await client.query('DELETE FROM app_sessions WHERE user_id=$1', [targetUserId]);
      }
      await writeAudit(client as unknown as Database, adminUserId, targetUserId, 'STATUS_CHANGE', {
        from: previous, to: status,
      });
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function changeUserRole(
  pool: Database,
  adminUserId: string,
  targetUserId: string,
  role: UserRole,
): Promise<void> {
  if (adminUserId === targetUserId) throw new Error('admin_self_protection');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(145902, 2)');
    const target = await client.query<{ role: UserRole; status: UserStatus }>(
      'SELECT role,status FROM app_users WHERE id=$1 FOR UPDATE', [targetUserId]);
    if (!target.rows[0]) throw new Error('user_not_found');
    const previous = target.rows[0].role;
    if (previous === 'ADMIN' && target.rows[0].status === 'ACTIVE' && role !== 'ADMIN') {
      const admins = await client.query<{ count: string }>(
        "SELECT COUNT(*)::text AS count FROM app_users WHERE role='ADMIN' AND status='ACTIVE'");
      if (Number(admins.rows[0]?.count ?? 0) <= 1) throw new Error('last_admin');
    }
    if (previous !== role) {
      await client.query('UPDATE app_users SET role=$1 WHERE id=$2', [role, targetUserId]);
      await writeAudit(client as unknown as Database, adminUserId, targetUserId, 'ROLE_CHANGE', {
        from: previous, to: role,
      });
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function grantAdminCredits(
  pool: Database,
  adminUserId: string,
  targetUserId: string,
  amount: number,
  idempotencyKey: string,
): Promise<{ balance: number; applied: boolean }> {
  if (!Number.isInteger(amount) || amount < 1 || amount > 1000 ||
      !/^[A-Za-z0-9:_-]{4,128}$/.test(idempotencyKey)) {
    throw new Error('invalid_credit_grant');
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const target = await client.query('SELECT id FROM app_users WHERE id=$1 FOR UPDATE', [targetUserId]);
    if (target.rowCount !== 1) throw new Error('user_not_found');

    const existing = await client.query<{ amount:number; reason:string }>(
      'SELECT amount,reason FROM credit_ledger WHERE user_id=$1 AND idempotency_key=$2',
      [targetUserId, idempotencyKey],
    );
    if (existing.rows[0]) {
      if (existing.rows[0].amount !== amount || existing.rows[0].reason !== 'admin_grant') {
        throw new Error('idempotency_conflict');
      }
      const balance = await client.query<{ balance:string }>(
        'SELECT COALESCE(SUM(amount),0)::text AS balance FROM credit_ledger WHERE user_id=$1',
        [targetUserId],
      );
      await client.query('COMMIT');
      return { balance: toNumber(balance.rows[0]?.balance), applied: false };
    }

    await client.query(
      `INSERT INTO credit_ledger(id,user_id,amount,reason,idempotency_key)
       VALUES($1,$2,$3,'admin_grant',$4)`,
      [randomUUID(), targetUserId, amount, idempotencyKey],
    );
    await writeAudit(client as unknown as Database, adminUserId, targetUserId, 'CREDIT_GRANT', {
      amount,
    });
    const balance = await client.query<{ balance:string }>(
      'SELECT COALESCE(SUM(amount),0)::text AS balance FROM credit_ledger WHERE user_id=$1',
      [targetUserId],
    );
    await client.query('COMMIT');
    return { balance: toNumber(balance.rows[0]?.balance), applied: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function listAdminAudit(pool: Database, limit = 100) {
  const result = await pool.query<{
    id:string; action:string; metadata:Record<string,unknown>; created_at:Date;
    admin_user_id:string|null; admin_name:string|null; admin_email:string|null;
    actor_label:string|null;
    target_user_id:string|null; target_name:string|null; target_email:string|null;
  }>(`
    SELECT a.id,a.action,a.metadata,a.created_at,a.admin_user_id,a.actor_label,
      admin.full_name AS admin_name,admin.email AS admin_email,
      a.target_user_id,target.full_name AS target_name,target.email AS target_email
    FROM admin_audit_log a
    LEFT JOIN app_users admin ON admin.id=a.admin_user_id
    LEFT JOIN app_users target ON target.id=a.target_user_id
    ORDER BY a.created_at DESC
    LIMIT $1
  `, [Math.min(Math.max(limit, 1), 200)]);
  return result.rows.map((row) => ({
    id: row.id,
    action: row.action,
    metadata: row.metadata,
    createdAt: row.created_at,
    admin: row.admin_user_id
      ? { id: row.admin_user_id, name: row.admin_name, email: row.admin_email ?? '' }
      : { id: 'cli', name: row.actor_label ?? 'CLI', email: '' },
    target: row.target_user_id
      ? { id: row.target_user_id, name: row.target_name, email: row.target_email }
      : null,
  }));
}
