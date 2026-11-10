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
        const [row] = await tx`insert into reports (ticket_number,user_id,description_raw,image_url,is_public,lat,lng,address)
          values (${input.ticket_number},${input.user_id},${input.description_raw},${input.image_url},${input.is_public},${input.lat},${input.lng},${input.address}) returning *`;
        await tx`insert into report_status_history (report_id,to_status,actor_id,actor_type,note,progress_percent)
          values (${row.id},'submitted',${input.user_id},'user','Laporan diterima oleh sistem.',0)`;
        return row;
      });
    },
    async list() { return sql`select r.*, d.name as dinas_name from reports r left join dinas d on d.id=r.dinas_id order by r.submitted_at desc`; },
    async get(id) { return (await sql`select r.*,d.name as dinas_name from reports r left join dinas d on d.id=r.dinas_id where r.id=${id}`)[0]; },
    async ticket(ticket) { return (await sql`select r.*,d.name as dinas_name from reports r left join dinas d on d.id=r.dinas_id where r.ticket_number=${ticket}`)[0]; },
    async history(id) { return sql`select id,from_status,to_status,note,progress_percent,created_at from report_status_history where report_id=${id} order by created_at`; },
    async feedbacks(reportId, userId) {
      return sql`select id,message,sender_name,sender_role,created_at,(sender_id = ${userId}) as mine
        from report_feedbacks where report_id=${reportId} order by created_at`;
    },
    async addFeedback(reportId, user, message) {
      return (await sql`insert into report_feedbacks (report_id,sender_id,sender_name,sender_role,message)
        values (${reportId},${user.id},${user.full_name ?? null},${user.role},${message})
        returning id,message,sender_name,sender_role,created_at,true as mine`)[0];
    },
    async dinas() { return sql`select id,slug,name from dinas where is_active=true order by name`; },
    async kategori() { return sql`select id,slug,name from kategori where is_active=true`; },
    async kategoriDinasMapping() {
      const rows = await sql`select k.slug as kategori, d.slug as dinas
        from kategori_dinas kd join kategori k on k.id=kd.kategori_id
        join dinas d on d.id=kd.dinas_id where k.is_active and d.is_active`;
      const mapping = {};
      for (const r of rows) (mapping[r.kategori] ??= []).push(r.dinas);
      for (const key of Object.keys(mapping)) mapping[key] = [...new Set(mapping[key])];
      return mapping;
    },
    async activeModelConfig() {
      return (await sql`select * from ai.model_configs where is_active=true order by created_at desc limit 1`)[0];
    },
    // Fallback saat AI gagal 2x: tandai perlu ditinjau tanpa hasil klasifikasi.
    async markNeedsReview(id, note) {
      return sql.begin(async tx => {
        const [before] = await tx`select * from reports where id=${id} for update`;
        if (!before || before.status !== "submitted") return null;
        await tx`update reports set status='needs_review',updated_at=now() where id=${id}`;
        await tx`insert into report_status_history (report_id,from_status,to_status,actor_type,note,progress_percent)
          values (${id},'submitted','needs_review','system',${note},0)`;
        return true;
      });
    },
    // Penetapan dinas oleh admin lintas status; needs_review yang diberi dinas -> routed.
    async assignDinas(id, dinasId, adminId) {
      return sql.begin(async tx => {
        const [before] = await tx`select * from reports where id=${id} for update`;
        if (!before) return null;
        const newStatus = before.status === "needs_review" && dinasId ? "routed" : before.status;
        const [after] = await tx`update reports set dinas_id=${dinasId},status=${newStatus},updated_at=now() where id=${id} returning *`;
        await tx`insert into report_status_history (report_id,from_status,to_status,actor_id,actor_type,note,progress_percent)
          values (${id},${before.status},${newStatus},${adminId},'admin',
          ${dinasId ? `Admin menetapkan dinas tujuan${before.status === "needs_review" ? "; laporan dirutekan" : ""}.` : "Dinas tujuan dikosongkan oleh admin."},0)`;
        return after;
      });
    },
    // Hasil AI: update lintasan + simpan classification. Hanya jalan dari status `submitted`.
    async routeReport(id, input) {
      return sql.begin(async tx => {
        const [before] = await tx`select * from reports where id=${id} for update`;
        if (!before || before.status !== "submitted") return null;
        const routed = input.status === "routed";
        const [after] = await tx`update reports set status=${input.status},dinas_id=${input.dinas_id},
          category_id=${input.category_id},urgency=${input.urgency},description_redacted=${input.description_redacted},
          updated_at=now(),routed_at=${routed ? new Date() : null} where id=${id} returning *`;
        await tx`insert into report_status_history (report_id,from_status,to_status,actor_type,note,progress_percent)
          values (${id},${before.status},${input.status},'system',
          ${routed ? "Laporan dirutekan otomatis ke dinas terkait." : "Laporan di bawah ambang keyakinan; menunggu tinjauan admin."},0)`;
        await tx`insert into ai.classifications (report_id,model_config_id,input_redacted,input_sent,output_json,
          dinas_id,category_id,urgency,confidence,category_confidence,dinas_confidence,urgency_confidence,
          pii_types,latency_ms,token_usage)
          values (${id},${input.model_config_id},${input.input_redacted},${input.input_sent},${input.output_json},
          ${input.dinas_id},${input.category_id},${input.urgency},${input.confidence},
          ${input.category_confidence},${input.dinas_confidence},${input.urgency_confidence},
          ${input.pii_types ?? null},${input.latency_ms},${input.token_usage ?? null})`;
        await tx`insert into audit_logs (actor_type,action,entity_type,entity_id)
          values ('system',${routed ? "jev_route" : "jev_needs_review"},'report',${id})`;
        return after;
      });
    },
    async update(id, input, actor, expected) {
      return sql.begin(async tx => {
        const [before] = await tx`select * from reports where id=${id} for update`;
        if (!before || new Date(before.updated_at).toISOString() !== new Date(expected).toISOString()) return null;
        const resolved = input.status === "resolved";
        const [after] = await tx`update reports set status=${input.status},progress_percent=${input.progress_percent},
          dinas_id=${input.dinas_id},moderation_status=${input.moderation_status},
          public_title=${input.public_title},public_location=${input.public_location},
          description_redacted=${input.description_redacted},updated_at=now(),
          resolved_at=${resolved ? new Date() : null},
          resolution_requested_at=${resolved ? new Date() : null},
          resolution_request_note=${resolved ? input.note : null}
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
    async respondResolution(id, action, userId) {
      return sql.begin(async tx => {
        const [row] = await tx`select * from reports where id=${id} for update`;
        if (!row || row.user_id !== userId) return null;
        if (!row.resolution_requested_at) return { error: "no_request" };
        if (action === "approve") {
          const [after] = await tx`update reports set resolution_requested_at=null,resolution_request_note=null,updated_at=now()
            where id=${id} returning *`;
          await tx`insert into report_status_history (report_id,from_status,to_status,actor_id,actor_type,note,progress_percent)
            values (${id},'resolved','resolved',${userId},'user','Pelapor menyetujui status selesai.',100)`;
          return { report: after };
        }
        if (action !== "reject") return { error: "invalid_action" };
        const [prev] = await tx`select progress_percent from report_status_history
          where report_id=${id} and progress_percent < 100 order by created_at desc limit 1`;
        const progress = prev ? prev.progress_percent : 0;
        const [after] = await tx`update reports set status='in_progress',progress_percent=${progress},resolved_at=null,
          resolution_requested_at=null,resolution_request_note=null,updated_at=now()
          where id=${id} returning *`;
        await tx`insert into report_status_history (report_id,from_status,to_status,actor_id,actor_type,note,progress_percent)
          values (${id},'resolved','in_progress',${userId},'user','Pelapor menolak status selesai; laporan dikembalikan untuk ditangani kembali.',${progress})`;
        if (row.dinas_id) await tx`insert into notifications (user_id,report_id,type,payload)
          select id,${id},'resolution_rejected',${JSON.stringify({ progress_percent: progress })}
          from users where role='pemerintah' and dinas_id=${row.dinas_id}`;
        return { report: after };
      });
    },
  };
}
