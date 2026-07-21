require('dotenv').config();
const { DataSource } = require('typeorm');
const { ResultSheet } = require('./dist/results/entities/result-sheet.entity.js');
const { StudentResult } = require('./dist/results/entities/student-result.entity.js');
const { SubjectScore } = require('./dist/results/entities/subject-score.entity.js');
const { calculateGrade } = require('./dist/results/utils/grading.util.js');

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.SUPABASE_DB_HOST,
  port: parseInt(process.env.SUPABASE_DB_PORT || '6543', 10),
  username: process.env.SUPABASE_DB_USER,
  password: process.env.SUPABASE_DB_PASSWORD,
  database: process.env.SUPABASE_DB_NAME,
  entities: ['./dist/**/*.entity.js'],
  synchronize: false,
  ssl: { rejectUnauthorized: false }
});

dataSource.initialize()
  .then(async () => {
    console.log('Data Source initialized. Recalculating grades across all result sheets...');
    const resultSheetRepo = dataSource.getRepository(ResultSheet);
    const studentResultRepo = dataSource.getRepository(StudentResult);
    const subjectScoreRepo = dataSource.getRepository(SubjectScore);

    const sheets = await resultSheetRepo.find();
    let totalScoresUpdated = 0;
    let totalStudentResultsUpdated = 0;

    for (const sheet of sheets) {
      if (!sheet.scoreComponents || !Array.isArray(sheet.scoreComponents) || sheet.scoreComponents.length === 0) {
        continue;
      }
      const totalMaxScore = sheet.scoreComponents.reduce((sum, sc) => sum + Number(sc.maxScore || 0), 0);
      if (totalMaxScore <= 0 || !sheet.gradingSystem) {
        continue;
      }

      // 1. Update all SubjectScores for this sheet
      const scores = await subjectScoreRepo.find({ where: { resultSheetId: sheet.id } });
      let updatedScores = [];
      for (const ss of scores) {
        if (ss.totalScore !== null && ss.totalScore !== undefined) {
          const newGrade = calculateGrade(Number(ss.totalScore), totalMaxScore, sheet.gradingSystem);
          if (ss.grade !== newGrade) {
            ss.grade = newGrade;
            updatedScores.push(ss);
          }
        }
      }
      if (updatedScores.length > 0) {
        await subjectScoreRepo.save(updatedScores);
        totalScoresUpdated += updatedScores.length;
      }

      // 2. Update all StudentResults for this sheet
      const studentResults = await studentResultRepo.find({
        where: { resultSheetId: sheet.id },
        relations: ['subjectScores']
      });

      for (const sr of studentResults) {
        const subjectTotal = (sr.subjectScores || []).reduce((sum, ss) => sum + Number(ss.totalScore || 0), 0);
        sr.totalScore = subjectTotal;
        const subjectCount = (sr.subjectScores || []).length || 1;
        const overallMaxScore = totalMaxScore * subjectCount;
        sr.grade = calculateGrade(subjectTotal, overallMaxScore, sheet.gradingSystem);
        const obtainable = totalMaxScore * ((sr.subjectScores || []).length || 0);
        if (obtainable > 0 && (sr.subjectScores || []).length > 0) {
          sr.percentage = Number(((subjectTotal / obtainable) * 100).toFixed(2));
        } else {
          sr.percentage = null;
        }
      }

      studentResults.sort((a, b) => (b.percentage ?? -1) - (a.percentage ?? -1));

      studentResults.forEach((sr, index) => {
        if (index > 0 && sr.percentage === studentResults[index - 1].percentage) {
          sr.position = studentResults[index - 1].position;
        } else {
          sr.position = index + 1;
        }
      });

      if (studentResults.length > 0) {
        await studentResultRepo.save(studentResults);
        totalStudentResultsUpdated += studentResults.length;
      }
    }

    console.log(`Recalculation complete! Updated ${totalScoresUpdated} subject scores and ${totalStudentResultsUpdated} student results.`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error during grade recalculation:', err);
    process.exit(1);
  });
