import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Crown, TrendingUp, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/Layout/PageTransition';
import { reportApi, testApi, markApi, Topper, Test } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export function ToppersPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTest, setSelectedTest] = useState<number | null>(null);
  const [testToppers, setTestToppers] = useState<Topper[]>([]);
  const [globalToppers, setGlobalToppers] = useState<Topper[]>([]);
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState({
    perfectScore: 0,
    consistentPerformers: 0,
    mostImproved: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedTest) {
      loadTestToppers();
    }
  }, [selectedTest]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [testsData, globalData] = await Promise.all([
        testApi.getAll(),
        reportApi.getGlobalTopPerformers({ limit: 10 }),
      ]);
      setTests(testsData);
      setGlobalToppers(globalData);
      
      if (testsData.length > 0) {
        setSelectedTest(testsData[0].id);
      }

      // Calculate achievements
      await calculateAchievements();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load toppers data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTestToppers = async () => {
    if (!selectedTest) return;
    
    try {
      const data = await reportApi.getTestToppers(selectedTest);
      setTestToppers(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load test toppers",
        variant: "destructive",
      });
    }
  };

  const calculateAchievements = async () => {
    try {
      // Get all marks
      const allMarks = await markApi.getAll();
      const allTests = await testApi.getAll();
      
      if (allMarks.length === 0 || allTests.length === 0) {
        setAchievements({ perfectScore: 0, consistentPerformers: 0, mostImproved: 0 });
        return;
      }

      // Calculate Perfect Score (100% in any subject)
      const studentsWithPerfectScore = new Set();
      allMarks.forEach(mark => {
        const percentage = (mark.marks_obtained / mark.max_marks) * 100;
        if (percentage === 100) {
          studentsWithPerfectScore.add(mark.student_id);
        }
      });

      // Calculate Consistent Performers (80%+ overall with at least 3 subjects)
      const studentMarks: Record<number, { totalObtained: number; totalMaximum: number; subjects: number }> = {};
      
      allMarks.forEach(mark => {
        if (!studentMarks[mark.student_id]) {
          studentMarks[mark.student_id] = { totalObtained: 0, totalMaximum: 0, subjects: 0 };
        }
        studentMarks[mark.student_id].totalObtained += mark.marks_obtained;
        studentMarks[mark.student_id].totalMaximum += mark.max_marks;
        studentMarks[mark.student_id].subjects += 1;
      });

      const consistentPerformers = Object.entries(studentMarks).filter(([_, data]) => {
        const overallPercentage = (data.totalObtained / data.totalMaximum) * 100;
        return overallPercentage >= 80 && data.subjects >= 3;
      }).length;

      // Calculate Most Improved (compare last two tests)
      let mostImprovedPercentage = 0;
      
      if (allTests.length >= 2) {
        const sortedTests = [...allTests].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        const latestTest = sortedTests[0];
        const previousTest = sortedTests[1];
        
        const latestMarks = allMarks.filter(m => m.test_id === latestTest.id);
        const previousMarks = allMarks.filter(m => m.test_id === previousTest.id);
        
        const latestTotals: Record<number, { obtained: number; maximum: number }> = {};
        const previousTotals: Record<number, { obtained: number; maximum: number }> = {};
        
        latestMarks.forEach(mark => {
          if (!latestTotals[mark.student_id]) {
            latestTotals[mark.student_id] = { obtained: 0, maximum: 0 };
          }
          latestTotals[mark.student_id].obtained += mark.marks_obtained;
          latestTotals[mark.student_id].maximum += mark.max_marks;
        });
        
        previousMarks.forEach(mark => {
          if (!previousTotals[mark.student_id]) {
            previousTotals[mark.student_id] = { obtained: 0, maximum: 0 };
          }
          previousTotals[mark.student_id].obtained += mark.marks_obtained;
          previousTotals[mark.student_id].maximum += mark.max_marks;
        });
        
        const improvements: number[] = [];
        Object.keys(latestTotals).forEach(studentId => {
          const sid = parseInt(studentId);
          if (previousTotals[sid]) {
            const latestPercentage = (latestTotals[sid].obtained / latestTotals[sid].maximum) * 100;
            const previousPercentage = (previousTotals[sid].obtained / previousTotals[sid].maximum) * 100;
            const improvement = latestPercentage - previousPercentage;
            improvements.push(improvement);
          }
        });
        
        if (improvements.length > 0) {
          mostImprovedPercentage = Math.max(...improvements, 0);
        }
      }

      setAchievements({
        perfectScore: studentsWithPerfectScore.size,
        consistentPerformers: consistentPerformers,
        mostImproved: Math.round(mostImprovedPercentage)
      });

    } catch (error) {
      console.error('Error calculating achievements:', error);
      setAchievements({ perfectScore: 0, consistentPerformers: 0, mostImproved: 0 });
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <Trophy className="w-6 h-6 text-muted-foreground" />;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/20 dark:to-gray-700/20 border-gray-200 dark:border-gray-700';
      case 3:
        return 'bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-card border-border';
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Trophy className="w-8 h-8 text-primary" />
              Toppers
            </h1>
            <p className="text-muted-foreground">Student achievements and leaderboards</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="card-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{tests.length}</div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{globalToppers.length}</div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Highest Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {globalToppers[0]?.percentage.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Champion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold text-foreground">
                {globalToppers[0]?.student.name || 'N/A'}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Test-wise Toppers */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                Test Toppers
              </CardTitle>
              <CardDescription>Top performers for individual tests</CardDescription>
              <div className="pt-2">
                <select
                  value={selectedTest || ''}
                  onChange={(e) => setSelectedTest(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                >
                  {tests.map(test => (
                    <option key={test.id} value={test.id}>{test.name}</option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-muted rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : testToppers.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No data available for this test</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {testToppers.slice(0, 5).map((topper, index) => (
                    <motion.div
                      key={topper.student.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${getRankStyle(index + 1)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getRankIcon(index + 1)}
                          <div>
                            <div className="font-semibold text-foreground">
                              {topper.student.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {topper.student.class_name} • {topper.student.roll_number}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-primary">
                            {topper.percentage.toFixed(1)}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {topper.total_marks} marks
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Global Top Performers */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                Global Champions
              </CardTitle>
              <CardDescription>Overall top performers across all tests</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-muted rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : globalToppers.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No performance data available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {globalToppers.map((topper, index) => (
                    <motion.div
                      key={topper.student.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${getRankStyle(index + 1)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getRankIcon(index + 1)}
                          <div>
                            <div className="font-semibold text-foreground">
                              {topper.student.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {topper.student.class_name} • {topper.student.roll_number}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-primary">
                            {topper.percentage.toFixed(1)}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {topper.total_marks} total marks
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Achievement Highlights - NOW DYNAMIC */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Medal className="w-5 h-5 text-primary" />
              Recent Achievements
            </CardTitle>
            <CardDescription>Notable performance highlights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-success-light rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-success" />
                  <span className="font-medium text-success">Perfect Score</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Students who achieved 100% in any subject
                </p>
                <p className="text-lg font-bold text-success mt-2">{achievements.perfectScore} students</p>
              </div>
              
              <div className="p-4 bg-warning-light rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-warning" />
                  <span className="font-medium text-warning">Consistent Performer</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Students with 80%+ overall average
                </p>
                <p className="text-lg font-bold text-warning mt-2">{achievements.consistentPerformers} students</p>
              </div>
              
              <div className="p-4 bg-primary/10 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span className="font-medium text-primary">Most Improved</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Biggest improvement from last test
                </p>
                <p className="text-lg font-bold text-primary mt-2">
                  {achievements.mostImproved > 0 ? `+${achievements.mostImproved}%` : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
