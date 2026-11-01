import postgres from "postgres";

export function createPostgresStore() {
  const sql = postgres(process.env.DATABASE_URL ?? "postgres://laporkuy:laporkuy@localhost:5432/laporkuy");
  return {
    async userByEmail(email) { return (await sql`select * from users where email = ${email}`)[0]; },
    async register(email, password_hash, full_name) {
      return (await sql`insert into users (email, password_hash, full_name) values (${email}, ${password_hash}, ${full_name}) returning *`)[0];
    },
    async session(token) {
      return (await sql`select u.* from sessions s join users u on u.id = s.user_id
        where s.token = ${token} and s.expires_at > now() and u.is_active = true`)[0];
    },
    async login(token, user_id) { await sql`insert into sessions (token,user_id,expires_at) values (${token},${user_id},now() + interval '7 days')`; },
    async logout(token) { await sql`delete from sessions where token = ${token}`; },
    async createReport(input) {
      return sql.begin(async tx => {
        const [row] = await tx`insert into reports (ticket_number,user_id,description_raw,image_url,is_public)
          values (${input.ticket_number},${input.user_id},${input.description_raw},${input.image_url},${input.is_public}) returning *`;
        await tx`insert into report_status_history (report_id,to_status,actor_id,actor_type,note,progress_percent)
          values (${row.id},'submitted',${input.user_id},'user','Laporan diterima oleh sistem.',0)`;
        return row;
      });
    },
    async list() { return sql`select r.*, d.name as dinas_name from reports r left join dinas d on d.id=r.dinas_id order by r.submitted_at desc`; },
    async get(id) { return (await sql`select r.*,d.name as dinas_name from reports r left join dinas d on d.id=r.dinas_id where r.id=${id}`)[0]; },
    async ticket(ticket) { return (await sql`select r.*,d.name as dinas_name from reports r left join dinas d on d.id=r.dinas_id where r.ticket_number=${ticket}`)[0]; },
    async history(id) { return sql`select id,from_status,to_status,note,progress_percent,created_at from report_status_history where report_id=${id} order by created_at`; },
    async dinas() { return sql`select id,slug,name from dinas where is_active=true order by name`; },
    async update(id, input, actor, expected) {
      return sql.begin(async tx => {
        const [before] = await tx`select * from reports where id=${id} for update`;
        if (!before || new Date(before.updated_at).toISOString() !== new Date(expected).toISOString()) return null;
        const [after] = await tx`update reports set status=${input.status},progress_percent=${input.progress_percent},
          dinas_id=${input.dinas_id},moderation_status=${input.moderation_status},
          public_title=${input.public_title},public_location=${input.public_location},
          description_redacted=${input.description_redacted},updated_at=now(),
          resolved_at=${input.status === "resolved" ? new Date() : null}
          where id=${id} returning *`;
        await tx`insert into report_status_history (report_id,from_status,to_status,actor_id,actor_type,note,progress_percent)
          values (${id},${before.status},${input.status},${actor.id},${actor.role},${input.note},${input.progress_percent})`;
        if (before.user_id) await tx`insert into notifications (user_id,report_id,type,payload)
          values (${before.user_id},${id},'report_update',${JSON.stringify({ status: input.status, progress_percent: input.progress_percent })})`;
        await tx`insert into audit_logs (actor_id,actor_type,action,entity_type,entity_id)
          values (${actor.id},${actor.role},'report_update','report',${id})`;
        return after;
      });
    },
  };
}
