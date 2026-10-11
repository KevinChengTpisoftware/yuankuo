const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetImport = `import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';`;
const replaceImport = `import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';`;
code = code.replace(targetImport, replaceImport);

const heatmapTarget = `  const heatmapData = useMemo(() => {`;
const radarDataCode = `  const radarData = useMemo(() => {
    return ['食', '衣', '住', '行', '育', '樂'].map(cat => {
      const catTasks = TASKS.filter(t => t.category === cat);
      const total = catTasks.length;
      const completed = catTasks.filter(t => completedTasks.has(t.id)).length;
      const score = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        subject: cat,
        score,
        completed,
        total,
        fullMark: 100
      };
    });
  }, [completedTasks]);

  const heatmapData = useMemo(() => {`;
code = code.replace(heatmapTarget, radarDataCode);

const radarChartTarget = `                {/* Heatmap */}`;
const radarChartCode = `                {/* Radar Chart */}
                <div className="bg-[#FCFAF5] p-5 md:p-6 rounded-3xl border border-stone-200 shadow-sm mb-8">
                  <h2 className="text-lg font-bold text-stone-800 mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-600" />
                    六大生活能力雷達圖
                  </h2>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#57534e', fontSize: 14, fontWeight: 600 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="能力值" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.5} />
                        <Tooltip 
                          formatter={(value, name, props) => [\`\${props.payload.completed} / \${props.payload.total} 項\`, name]}
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', padding: '12px 16px' }}
                          itemStyle={{ fontWeight: 600 }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Heatmap */}`;
code = code.replace(radarChartTarget, radarChartCode);

fs.writeFileSync('src/App.tsx', code);
