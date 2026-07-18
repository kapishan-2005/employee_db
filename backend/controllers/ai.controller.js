/**
 * AI Controller
 *
 * Endpoints:
 *  POST /api/ai/chat               - ask the role-based AI assistant a question
 *  GET  /api/ai/chat/history       - get this user's chat history
 *  GET  /api/ai/insights           - get stored insights for this user
 *  POST /api/ai/insights/generate  - generate + store fresh company/dept insights (ceo/admin)
 *  POST /api/ai/performance/:employeeId - generate an employee performance score + recommendation
 *  POST /api/ai/recruitment        - generate a job description + interview questions
 */

import AI from '../models/aiModel.js';
import { askGemini, getPersonaForRole } from '../services/ai.service.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * POST /api/ai/chat
 * Body: { question }
 */
export const chat = async (req, res) => {
  try {
    const { question } = req.body;
    const { id: userId, role, employee_id, organization_id } = req.user;

    if (!question || !question.trim()) {
      return errorResponse(res, 'Question is required', 400);
    }

    const persona = getPersonaForRole(role);

    // Build light context depending on role so answers are grounded in real data
    let contextText = '';
    if (role === 'ceo' || role === 'hr') {
      const context = await AI.getCompanyContext(organization_id);
      contextText = `Company context: ${JSON.stringify(context)}`;
    } else if (employee_id) {
      const context = await AI.getEmployeePerformanceContext(employee_id, organization_id);
      contextText = `Employee context: ${JSON.stringify(context)}`;
    }

    const prompt = `${contextText}\n\nQuestion: ${question}`;
    const answer = await askGemini(persona, prompt);

    await AI.saveChat({ user_id: userId, question, answer, organization_id });

    return successResponse(res, { answer }, 'AI response generated');
  } catch (error) {
    console.error('AI chat error:', error);
    return errorResponse(res, error.message || 'Error generating AI response');
  }
};

/**
 * GET /api/ai/chat/history
 */
export const getChatHistory = async (req, res) => {
  try {
    const history = await AI.getChatHistory(req.user.id, 30, req.user.organization_id);
    return successResponse(res, { history });
  } catch (error) {
    console.error('AI chat history error:', error);
    return errorResponse(res, error.message || 'Error fetching chat history');
  }
};

/**
 * GET /api/ai/insights
 */
export const getInsights = async (req, res) => {
  try {
    const insights = await AI.getInsightsForUser(req.user.id, 20, req.user.organization_id);
    return successResponse(res, { insights });
  } catch (error) {
    console.error('AI insights fetch error:', error);
    return errorResponse(res, error.message || 'Error fetching AI insights');
  }
};

/**
 * POST /api/ai/insights/generate
 * Generates fresh company-level insights (attendance trends, dept issues) and stores them.
 */
export const generateInsights = async (req, res) => {
  try {
    const { id: userId, role, organization_id } = req.user;
    const context = await AI.getCompanyContext(organization_id);

    const persona = getPersonaForRole(role);
    const prompt = `Given this workforce data: ${JSON.stringify(context)}
Generate 2-4 short, specific business insights about attendance trends or department
performance issues. For each insight, output one line in this exact format:
SEVERITY|TYPE|MESSAGE
Where SEVERITY is one of info, warning, critical. TYPE is a short snake_case label
like attendance_warning or performance_summary. MESSAGE is one sentence including a
concrete recommendation. Output only these lines, nothing else.`;

    const raw = await askGemini(persona, prompt);

    const lines = raw
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.includes('|'));

    const insights = [];
    for (const line of lines) {
      const [severity, insight_type, ...rest] = line.split('|');
      const message = rest.join('|').trim();
      if (!message) continue;
      const saved = await AI.saveInsight({
        user_id: userId,
        role,
        insight_type: (insight_type || 'general_insight').trim(),
        message,
        severity: ['info', 'warning', 'critical'].includes(severity.trim())
          ? severity.trim()
          : 'info',
        organization_id
      });
      insights.push(saved);
    }

    return successResponse(res, { insights }, 'Insights generated');
  } catch (error) {
    console.error('AI generate insights error:', error);
    return errorResponse(res, error.message || 'Error generating insights');
  }
};

/**
 * POST /api/ai/performance/:employeeId
 * Calculates a performance score (attendance 40%, activity 30%, task completion 30%)
 * and asks the AI for a short recommendation.
 */
export const analyzePerformance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const context = await AI.getEmployeePerformanceContext(employeeId, req.user.organization_id);

    if (!context.employee) {
      return errorResponse(res, 'Employee not found', 404);
    }

    const { attendance, activity } = context;
    const totalDays = attendance.totalDays || 0;
    const attendanceScore = totalDays
      ? (attendance.presentDays / totalDays) * 100
      : 0;

    // Activity score: cap at 20 actions/month = 100%
    const activityScore = Math.min((activity.actionCount / 20) * 100, 100);

    // Task completion isn't tracked yet in this schema; default to activity score
    // as a proxy until a tasks table exists.
    const taskScore = activityScore;

    const performanceScore = Math.round(
      attendanceScore * 0.4 + activityScore * 0.3 + taskScore * 0.3
    );

    const persona = getPersonaForRole('manager');
    const prompt = `Employee: ${context.employee.name}
Performance score: ${performanceScore}%
Attendance: ${attendance.presentDays}/${totalDays} days present, ${attendance.lateDays} late, ${attendance.absentDays} absent (last 30 days).
Activity log entries (last 30 days): ${activity.actionCount}

Write ONE short recommendation sentence for this employee's manager, in a
supportive, professional tone.`;

    const recommendation = await askGemini(persona, prompt);

    return successResponse(res, {
      employee: context.employee,
      performanceScore,
      breakdown: {
        attendanceScore: Math.round(attendanceScore),
        activityScore: Math.round(activityScore),
        taskScore: Math.round(taskScore),
      },
      recommendation,
    });
  } catch (error) {
    console.error('AI performance analysis error:', error);
    return errorResponse(res, error.message || 'Error analyzing performance');
  }
};

/**
 * GET /api/ai/attendance-intelligence
 * Detects frequent late arrivals, frequent absences, and department-level
 * attendance problems over the last 30 days, with an AI-written summary.
 */
export const attendanceIntelligence = async (req, res) => {
  try {
    const patterns = await AI.getAttendancePatterns({
      lateThreshold: 3,
      absentThreshold: 3,
      organization_id: req.user.organization_id,
    });

    const persona = getPersonaForRole(req.user.role);
    const prompt = `Here is attendance pattern data for the last 30 days:
${JSON.stringify(patterns)}

Write a short summary (3-5 sentences) highlighting the most important attendance
problems (frequent late arrivals, frequent absences, or weak departments) and one
concrete recommendation. If there is no concerning data, say attendance looks healthy.`;

    const summary = await askGemini(persona, prompt);

    return successResponse(res, { ...patterns, summary });
  } catch (error) {
    console.error('AI attendance intelligence error:', error);
    return errorResponse(res, error.message || 'Error analyzing attendance patterns');
  }
};

/**
 * POST /api/ai/recruitment
 * Body: { jobRole, experience, requiredSkills }
 */
export const generateRecruitment = async (req, res) => {
  try {
    const { jobRole, experience, requiredSkills } = req.body;

    if (!jobRole) {
      return errorResponse(res, 'jobRole is required', 400);
    }

    const persona = getPersonaForRole('hr');
    const prompt = `Create a recruitment package for this role:
Job Role: ${jobRole}
Experience level: ${experience || 'not specified'}
Required skills: ${requiredSkills || 'not specified'}

Output three clearly labeled sections:
1. JOB DESCRIPTION (2-3 sentences)
2. REQUIRED SKILLS (bullet list)
3. INTERVIEW QUESTIONS (5 questions, numbered)`;

    const result = await askGemini(persona, prompt);

    return successResponse(res, { result }, 'Recruitment content generated');
  } catch (error) {
    console.error('AI recruitment error:', error);
    return errorResponse(res, error.message || 'Error generating recruitment content');
  }
};
