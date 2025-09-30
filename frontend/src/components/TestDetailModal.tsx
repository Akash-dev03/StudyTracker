import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Calendar, Users, Award, Trophy } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { markApi, studentApi, Test, Mark, Student } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface TestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: Test | null;
}

interface StudentTestData {
  student: Student;
  marks: Mark[];
  totalObtained: number;
  totalMaximum: number;
  percentage: number;
}

export function TestDetailModal({ isOpen, onClose, test }: TestDetailModalProps) {
  const [studentResults, setStudentResults] = useState<StudentTestData[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && test) {
      loadTestData();
    }
  }, [isOpen, test]);

  const loadTestData = async () => {
    if (!test) return;

    try {
      setLoading(true);
      
      const marks = await markApi.getAll({ test_id: test.id });
      const students = await studentApi.getAll();
      
      const studentMarksMap = marks.reduce((acc, mark) => {
        if (!acc[mark.student_id]) {
          acc[mark.student_id] = [];
        }
        acc[mark.student_id].push(mark);
        return acc;
      }, {} as Record<number, Mark[]>);

      const studentData = Object.entries(studentMarksMap).map(([studentId, studentMarks]) => {
        const student = students.find(s => s.id === parseInt(studentId));
        if (!student) return null;

        const totalObtained = studentMarks.reduce((sum, mark) => sum + mark.marks_obtained, 0);
        const totalMaximum = studentMarks.reduce((sum, mark) => sum + mark.max_marks, 0);
        const percentage = totalMaximum > 0 ? (totalObtained / totalMaximum) * 100 : 0;

        return {
          student,
          marks: studentMarks,
          totalObtained,
          totalMaximum,
          percentage,
        };
      }).filter((data): data is StudentTestData => data !== null);

      studentData.sort((a, b) => b.percentage - a.percentage);

      setStudentResults(studentData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load test data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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

  const calculateStats = () => {
    if (studentResults.length === 0) return { avgPercentage: 0, highestScore: 0, passRate: 0 };
    
    const avgPercentage = studentResults.reduce((sum, s) => sum + s.percentage, 0) / studentResults.length;
    const highestScore = Math.max(...studentResults.map(s => s.percentage));
    const passRate = (studentResults.filter(s => s.percentage >= 40).length / studentResults.length) * 100;

    return { avgPercentage, highestScore, passRate };
  };

  if (!test) return null;

  const stats = calculateStats();
  const toppers = studentResults.slice(0, 3);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{test.name}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {formatDate(test.date)}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Test Info */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-lg">Test Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{test.subjects.length}</div>
                  <div className="text-sm text-muted-foreground">Subjects</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{studentResults.length}</div>
                  <div className="text-sm text-muted-foreground">Students</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">{stats.avgPercentage.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Avg Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning">{stats.passRate.toFixed(0)}%</div>
                  <div className="text-sm text-muted-foreground">Pass Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subjects */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-lg">Subjects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {test.subjects.map((subject, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                    <span className="font-medium">{subject.name}</span>
                    <Badge variant="outline">{subject.max_marks} marks</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Performers */}
          {toppers.length > 0 && (
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-warning" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {toppers.map((result, index) => {
                    const gradeInfo = getGradeInfo(result.percentage);
                    return (
                      <div key={result.student.id} className="p-4 bg-background rounded-lg border">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="text-2xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</div>
                          <div>
                            <div className="font-semibold">{result.student.name}</div>
                            <div className="text-sm text-muted-foreground">{result.student.roll_number}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge className={gradeInfo.color}>{gradeInfo.grade}</Badge>
                          <span className="font-bold text-lg">{result.percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Student Results */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                All Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse h-20 bg-muted rounded-lg"></div>
                  ))}
                </div>
              ) : studentResults.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No results yet</h3>
                  <p className="text-muted-foreground">No marks have been recorded for this test</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Rank</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Student</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Roll No.</th>
                        {test.subjects.map((subject, idx) => (
                          <th key={idx} className="text-center py-3 px-4 font-medium text-muted-foreground">{subject.name}</th>
                        ))}
                        <th className="text-center py-3 px-4 font-medium text-muted-foreground">Total</th>
                        <th className="text-center py-3 px-4 font-medium text-muted-foreground">%</th>
                        <th className="text-center py-3 px-4 font-medium text-muted-foreground">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentResults.map((result, index) => {
                        const gradeInfo = getGradeInfo(result.percentage);
                        return (
                          <motion.tr
                            key={result.student.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b border-border hover:bg-muted/50"
                          >
                            <td className="py-3 px-4 font-semibold">{index + 1}</td>
                            <td className="py-3 px-4">{result.student.name}</td>
                            <td className="py-3 px-4">
                              <Badge variant="outline">{result.student.roll_number}</Badge>
                            </td>
                            {test.subjects.map((subject, subIdx) => {
                              const mark = result.marks.find(m => m.subject_name === subject.name);
                              return (
                                <td key={subIdx} className="py-3 px-4 text-center font-mono">
                                  {mark ? `${mark.marks_obtained}/${mark.max_marks}` : '-'}
                                </td>
                              );
                            })}
                            <td className="py-3 px-4 text-center font-bold font-mono">
                              {result.totalObtained}/{result.totalMaximum}
                            </td>
                            <td className="py-3 px-4 text-center font-semibold">
                              {result.percentage.toFixed(1)}%
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge className={gradeInfo.color}>{gradeInfo.grade}</Badge>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
