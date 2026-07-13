import { useState } from 'react';
import aiService from '../services/aiService';
import PageHeader from '../components/common/PageHeader';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const RecruitmentPage = () => {
  const [jobRole, setJobRole] = useState('');
  const [experience, setExperience] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!jobRole.trim()) return;

    setLoading(true);
    setError(null);
    setResult('');
    try {
      const res = await aiService.generateRecruitment({
        jobRole,
        experience,
        requiredSkills,
      });
      setResult(res.data.result);
    } catch (err) {
      setError(err.message || 'Failed to generate recruitment content');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <PageHeader
        title="AI Recruitment Assistant"
        subtitle="Generate job descriptions and interview questions instantly"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Form */}
        <form
          onSubmit={handleGenerate}
          className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 space-y-4 h-fit"
        >
          <div>
            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">
              Job Role *
            </label>
            <Input
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              placeholder="e.g. Senior Backend Engineer"
              required
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">
              Experience Level
            </label>
            <Input
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="e.g. 3-5 years"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">
              Required Skills
            </label>
            <Input
              value={requiredSkills}
              onChange={(e) => setRequiredSkills(e.target.value)}
              placeholder="e.g. Node.js, MySQL, REST APIs"
            />
          </div>

          <Button type="submit" disabled={loading || !jobRole.trim()} className="w-full">
            {loading ? 'Generating…' : '✨ Generate Job Posting'}
          </Button>
        </form>

        {/* Result */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 min-h-[300px]">
          <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-4">
            Generated Content
          </h3>

          {error && (
            <div className="mb-4 p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-red-300 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-white/20 border-t-indigo-400 rounded-full animate-spin" />
            </div>
          ) : result ? (
            <pre className="whitespace-pre-wrap text-sm text-white/85 font-sans leading-relaxed">
              {result}
            </pre>
          ) : (
            <p className="text-sm text-white/30">
              Fill in the job role and click generate to get an AI-written job
              description, required skills, and interview questions.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecruitmentPage;
