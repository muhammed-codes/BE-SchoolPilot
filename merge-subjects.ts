import { Client } from 'pg';
import 'dotenv/config';

async function mergeDuplicates() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query('BEGIN');

    // Find all duplicate subject groups (by lowercase name and schoolId)
    const groupsRes = await client.query(`
      SELECT LOWER(TRIM(name)) as norm_name, "schoolId", array_agg(id) as ids, array_agg(name) as names
      FROM subjects
      GROUP BY LOWER(TRIM(name)), "schoolId"
      HAVING COUNT(*) > 1
    `);

    for (const group of groupsRes.rows) {
      const masterId = group.ids[0];
      const dupIds = group.ids.slice(1);
      
      console.log(`Merging ${dupIds.length} duplicates into master ${masterId} for subject: ${group.names[0]}`);

      for (const dupId of dupIds) {
        // Move class_subjects
        // 1. Find all class_subjects for this dupId
        const csRes = await client.query(`SELECT id, "classId" FROM class_subjects WHERE "subjectId" = $1`, [dupId]);
        for (const cs of csRes.rows) {
          // Check if master already has this class assigned
          const exists = await client.query(`SELECT id FROM class_subjects WHERE "subjectId" = $1 AND "classId" = $2`, [masterId, cs.classId]);
          if (exists.rows.length > 0) {
            // Already exists, so we delete the duplicate class_subject
            await client.query(`DELETE FROM class_subjects WHERE id = $1`, [cs.id]);
          } else {
            // Update to point to master
            await client.query(`UPDATE class_subjects SET "subjectId" = $1 WHERE id = $2`, [masterId, cs.id]);
          }
        }

        // Move subject_scores
        // 1. Find all subject_scores for this dupId
        const scRes = await client.query(`SELECT id, "resultSheetId" FROM subject_scores WHERE "subjectId" = $1`, [dupId]);
        for (const sc of scRes.rows) {
          // Check if master already has a score for this resultSheet
          const exists = await client.query(`SELECT id FROM subject_scores WHERE "subjectId" = $1 AND "resultSheetId" = $2`, [masterId, sc.resultSheetId]);
          if (exists.rows.length > 0) {
            // Already exists, delete duplicate score
            await client.query(`DELETE FROM subject_scores WHERE id = $1`, [sc.id]);
          } else {
            // Update to point to master
            await client.query(`UPDATE subject_scores SET "subjectId" = $1 WHERE id = $2`, [masterId, sc.id]);
          }
        }

        // Delete the duplicate subject itself
        await client.query(`DELETE FROM subjects WHERE id = $1`, [dupId]);
      }
    }

    await client.query('COMMIT');
    console.log('Successfully merged all duplicates!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error merging subjects:', error);
  } finally {
    await client.end();
  }
}

mergeDuplicates();
