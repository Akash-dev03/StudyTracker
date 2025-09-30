import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, BookOpen, TrendingUp, Calendar, Award, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { markApi, testApi, Student, Mark, Test } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

interface StudentTestData {
  test: Test;
  marks: Mark[];
  totalObtained: number;
  totalMaximum: number;
  percentage: number;
}

export function StudentDetailModal({ isOpen, onClose, student }: StudentDetailModalProps) {
  const [studentTests, setStudentTests] = useState<StudentTestData[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && student) {
      loadStudentData();
    }
  }, [isOpen, student]);

  const loadStudentData = async () => {
    if (!student) return;

    try {
      setLoading(true);
      
      // Get all marks for this student
      const marks = await markApi.getAll({ student_id: student.id });
      
      // Get all tests
      const tests = await testApi.getAll();
      
      // Group marks by test and calculate totals
      const testMarksMap = marks.reduce((acc, mark) => {
        if (!acc[mark.test_id]) {
          acc[mark.test_id] = [];
        }
        acc[mark.test_id].push(mark);
        return acc;
      }, {} as Record<number, Mark[]>);

      const studentTestData = Object.entries(testMarksMap).map(([testId, testMarks]) => {
        const test = tests.find(t => t.id === parseInt(testId));
        if (!test) return null;

        const totalObtained = testMarks.reduce((sum, mark) => sum + mark.marks_obtained, 0);
        const totalMaximum = testMarks.reduce((sum, mark) => sum + mark.max_marks, 0);
        const percentage = totalMaximum > 0 ? (totalObtained / totalMaximum) * 100 : 0;

        return {
          test,
          marks: testMarks,
          totalObtained,
          totalMaximum,
          percentage,
        };
      }).filter((data): data is StudentTestData => data !== null);

      // Sort by test date (most recent first)
      studentTestData.sort((a, b) => new Date(b.test.date).getTime() - new Date(a.test.date).getTime());

      setStudentTests(studentTestData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load student data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallStats = () => {
    if (studentTests.length === 0) return { totalObtained: 0, totalMaximum: 0, averagePercentage: 0, bestPercentage: 0 };

    const totalObtained = studentTests.reduce((sum, test) => sum + test.totalObtained, 0);
    const totalMaximum = studentTests.reduce((sum, test) => sum + test.totalMaximum, 0);
    const averagePercentage = studentTests.reduce((sum, test) => sum + test.percentage, 0) / studentTests.length;
    const bestPercentage = Math.max(...studentTests.map(test => test.percentage));

    return { totalObtained, totalMaximum, averagePercentage, bestPercentage };
  };

  const getGradeInfo = (percentage: number) => {
    if (percentage >= 90) return { grade: 'A+', color: 'badge-success' };
    if (percentage >= 80) return { grade: 'A', color: 'badge-success' };
    if (percentage >= 70) return { grade: 'B', color: 'badge-warning' };
    if (percentage >= 60) return { grade: 'C', color: 'badge-warning' };
    return { grade: 'F', color: 'badge-destructive' };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!student) return null;

  const overallStats = calculateOverallStats();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{student.name}</h2>
              <p className="text-sm text-muted-foreground">
                {student.roll_number} • {student.class_name}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Student Info */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-lg">Student Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{student.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Joined Date</p>
                <p className="font-medium">{formatDate(student.created_at)}</p>
              </div>
              {student.phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{student.phone}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Overall Performance */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Overall Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{studentTests.length}</div>
                  <div className="text-sm text-muted-foreground">Tests Taken</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{overallStats.totalObtained}</div>
                  <div className="text-sm text-muted-foreground">Total Marks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">{overallStats.averagePercentage.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Average Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning">{overallStats.bestPercentage.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Best Score</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Results */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Test Results
              </CardTitle>
              <CardDescription>
                Detailed breakdown of all test performances
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-muted rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : studentTests.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No test results found</h3>
                  <p className="text-muted-foreground">This student hasn't taken any tests yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {studentTests.map((testData, index) => {
                    const gradeInfo = getGradeInfo(testData.percentage);
                    return (
                      <motion.div
                        key={testData.test.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-foreground">{testData.test.name}</h4>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {formatDate(testData.test.date)}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={gradeInfo.color}>
                              {testData.percentage.toFixed(1)}% ({gradeInfo.grade})
                            </Badge>
                            <div className="text-sm font-mono mt-1">
                              {testData.totalObtained}/{testData.totalMaximum}
                            </div>
                          </div>
                        </div>

                        {/* Subject-wise breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {testData.marks.map((mark, markIndex) => {
                            const subjectPercentage = (mark.marks_obtained / mark.max_marks) * 100;
                            const subjectGrade = getGradeInfo(subjectPercentage);
                            return (
                              <div key={markIndex} className="flex items-center justify-between p-2 bg-background rounded border">
                                <div>
                                  <div className="text-sm font-medium">{mark.subject_name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {mark.marks_obtained}/{mark.max_marks}
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {subjectPercentage.toFixed(0)}%
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
