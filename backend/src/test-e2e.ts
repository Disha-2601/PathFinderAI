import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:5001'; // testing against active port or 5000/5001

async function runTests() {
  console.log('🧪 Starting PathFinder AI Backend API Gateway Verification...\n');

  // Determine port
  let activeUrl = 'http://localhost:5000';
  try {
    const health5000 = await axios.get('http://localhost:5000/api/health', { timeout: 1000 });
    if (health5000.data.service === 'backend') {
      activeUrl = 'http://localhost:5000';
    }
  } catch {
    activeUrl = 'http://localhost:5001';
  }

  console.log(`🌐 Testing against API at: ${activeUrl}\n`);

  try {
    // 1. Health check
    const health = await axios.get(`${activeUrl}/api/health`);
    console.log('✅ [1. Health Check]:', health.data);

    // 2. Auth Register
    const testEmail = `test.pilot.${Date.now()}@pathfinder.ai`;
    const registerRes = await axios.post(`${activeUrl}/api/auth/register`, {
      email: testEmail,
      password: 'SecurePassword123!',
      full_name: 'Test Pilot Architect',
      role: 'student',
      target_role: 'Senior AI Engineer',
      experience_level: 'intermediate',
      bio: 'Testing full-stack API gateway integrations'
    });
    console.log('✅ [2. Auth Register]: Created user', registerRes.data.user.email, '| Token received:', !!registerRes.data.token);
    const token = registerRes.data.token;
    const userId = registerRes.data.user.id;

    // 3. Auth Login
    const loginRes = await axios.post(`${activeUrl}/api/auth/login`, {
      email: testEmail,
      password: 'SecurePassword123!'
    });
    console.log('✅ [3. Auth Login]: Logged in successfully | Token received:', !!loginRes.data.token);

    // 4. Auth Me (Protected)
    const meRes = await axios.get(`${activeUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ [4. Auth Me (Protected)]:', meRes.data.user.full_name, `(${meRes.data.user.role})`);

    // 5. Goal Parsing (AI Proxy)
    const parseRes = await axios.post(
      `${activeUrl}/api/goals/parse`,
      {
        raw_prompt: 'I want to become a Senior Distributed Systems & AI Engineer in 6 months studying 15 hours per week with project based learning'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✅ [5. Goal Parse (AI Service Proxy)]:', {
      goal_id: parseRes.data.goal_id,
      target_role: parseRes.data.parsed_data?.target_role,
      target_skills: parseRes.data.parsed_data?.target_skills
    });
    const parsedGoalId = parseRes.data.goal_id;

    // 6. Goal Recommendations (AI Proxy + DB Persistence)
    const recRes = await axios.post(
      `${activeUrl}/api/goals/recommend`,
      {
        goal_id: parsedGoalId,
        limit: 5
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✅ [6. Goal Recommend & Persist]: Evaluated:', recRes.data.total_evaluated, '| Top recommendation:', recRes.data.recommendations?.[0]?.title, `(${recRes.data.recommendations?.[0]?.match_percentage}%)`);

    // 7. Get Goal by ID
    const getGoalRes = await axios.get(`${activeUrl}/api/goals/${parsedGoalId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ [7. Get Goal By ID]:', {
      goal_id: getGoalRes.data.goal?.id,
      target_role: getGoalRes.data.goal?.target_role,
      saved_recommendations_count: getGoalRes.data.recommendations?.length
    });

    // 8. User Profile & Progress
    const profileRes = await axios.get(`${activeUrl}/api/user/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ [8. User Profile & Progress]:', {
      user: profileRes.data.user?.full_name,
      stats: profileRes.data.stats
    });

    // 9. Course Feedback
    if (recRes.data.recommendations?.[0]?.id) {
      const topCourseId = recRes.data.recommendations[0].id;
      const feedbackRes = await axios.post(
        `${activeUrl}/api/user/feedback`,
        {
          course_id: topCourseId,
          rating: 5,
          comments: 'Exceptional course on scalable architectures and vector embeddings.',
          relevance_score: 0.98
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('✅ [9. User Feedback]:', feedbackRes.data.message);
    }

    // 10. Upsert User Skill
    const skillRes = await axios.post(
      `${activeUrl}/api/user/skills`,
      {
        skill_id: '10000000-0000-0000-0000-000000000001', // Python Programming
        proficiency_level: 5,
        verified: true
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log('✅ [10. User Skill Upsert]:', skillRes.data.message, skillRes.data.skill);

    console.log('\n🎉 ALL 10 INTEGRATION TESTS PASSED WITH ZERO ERRORS!\n');
  } catch (err: any) {
    console.error('❌ Integration test failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

runTests();
