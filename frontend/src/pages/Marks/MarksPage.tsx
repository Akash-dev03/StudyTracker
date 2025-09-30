import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, BookOpen, User, TrendingUp, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/Layout/PageTransition';
import { markApi, testApi, studentApi, Mark, Test, Student } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { AddMarksDialog } from '@/components/forms/AddMarksDialog';
import { StudentDetailModal } from '@/components/StudentDetailModal';

export function MarksPage() {
  const [marks, setMarks] = useState<Mark[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [studentDetailModal, setStudentDetailModal] = useState<Student | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadMarks();
  }, [selectedTest, selectedStudent]);

  const loadInitialData = async () => {
    try {
      const [testsData, studentsData] = await Promise.all([
        testApi.getAll(),
        studentApi.getAll(),
      ]);
      setTests(testsData);
      setStudents(studentsData);
      loadMarks();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load initial data",
        variant: "destructive",
      });
    }
  };

  const loadMarks = async () => {
    try {
      setLoading(true);
      const data = await markApi.getAll({
        test_id: selectedTest || undefined,
        student_id: selectedStudent || undefined,
      });
      setMarks(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load marks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this mark entry?')) return;
    
    try {
      await markApi.delete(id);
      toast({
        title: "Success",
        description: "Mark deleted successfully",
      });
      loadMarks();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete mark",
        variant: "destructive",
      });
    }
  };

  const getStudentName = (studentId: number) => {
    return students.find(s => s.id === studentId)?.name || 'Unknown Student';
  };

  const getTestName = (testId: number) => {
    return tests.find(t => t.id === testId)?.name || 'Unknown Test';
  };

  const calculateStats = () => {
    if (marks.length === 0) return { totalMarks: 0, avgPercentage: 0, highestScore: 0 };

    const totalMarks = marks.reduce((sum, mark) => sum + mark.marks_obtained, 0);
    const totalPossible = marks.reduce((sum, mark) => sum + mark.max_marks, 0);
    const avgPercentage = totalPossible > 0 ? (totalMarks / totalPossible) * 100 : 0;
    const highestScore = Math.max(...marks.map(m => (m.marks_obtained / m.max_marks) * 100));

    return { totalMarks, avgPercentage, highestScore };
  };

  const stats = calculateStats();

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Marks</h1>
            <p className="text-muted-foreground">Manage student test scores and performance</p>
          </div>
          <Button className="btn-primary" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Marks
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="card-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{marks.length}</div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Marks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalMarks}</div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average %</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.avgPercentage.toFixed(1)}%</div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Highest Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.highestScore.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Filter by Test</label>
                <select
                  value={selectedTest || ''}
                  onChange={(e) => setSelectedTest(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                >
                  <option value="">All Tests</option>
                  {tests.map(test => (
                    <option key={test.id} value={test.id}>{test.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Filter by Student</label>
                <select
                  value={selectedStudent || ''}
                  onChange={(e) => setSelectedStudent(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                >
                  <option value="">All Students</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>{student.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedTest(null);
                    setSelectedStudent(null);
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Marks Table */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Mark Entries</CardTitle>
            <CardDescription>
              {marks.length} mark entr{marks.length !== 1 ? 'ies' : 'y'} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-muted rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : marks.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No marks found</h3>
                <p className="text-muted-foreground mb-4">
                  {selectedTest || selectedStudent ? 'Try adjusting your filters' : 'Get started by adding marks for a test'}
                </p>
                <Button className="btn-primary" onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Marks
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Student</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Test</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Subject</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Score</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Percentage</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="table-zebra table-hover">
                    {marks.map((mark, index) => {
                      const percentage = (mark.marks_obtained / mark.max_marks) * 100;
                      const getGrade = (percentage: number) => {
                        if (percentage >= 90) return { grade: 'A+', color: 'badge-success' };
                        if (percentage >= 80) return { grade: 'A', color: 'badge-success' };
                        if (percentage >= 70) return { grade: 'B', color: 'badge-warning' };
                        if (percentage >= 60) return { grade: 'C', color: 'badge-warning' };
                        return { grade: 'F', color: 'badge-destructive' };
                      };
                      const gradeInfo = getGrade(percentage);

                      return (
                        <motion.tr
                          key={mark.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-border last:border-0"
                        >
                          <td className="py-4 px-4">
                            <div 
                              className="flex items-center space-x-3 cursor-pointer hover:bg-muted/50 rounded-md p-2 -m-2 transition-colors"
                              onClick={() => {
                                const student = students.find(s => s.id === mark.student_id);
                                if (student) setStudentDetailModal(student);
                              }}
                            >
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-primary" />
                              </div>
                              <div className="font-medium text-foreground">
                                {getStudentName(mark.student_id)}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <BookOpen className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-foreground">
                                {getTestName(mark.test_id)}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant="outline">
                              {mark.subject_name}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="font-mono text-sm">
                              <span className="font-semibold text-primary">{mark.marks_obtained}</span>
                              <span className="text-muted-foreground">/{mark.max_marks}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <Badge className={gradeInfo.color}>
                              {percentage.toFixed(1)}% ({gradeInfo.grade})
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground hover:bg-muted"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(mark.id)}
                                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
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

        {/* Add Marks Dialog */}
        <AddMarksDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onSuccess={loadMarks}
        />

        {/* Student Detail Modal */}
        <StudentDetailModal
          isOpen={!!studentDetailModal}
          onClose={() => setStudentDetailModal(null)}
          student={studentDetailModal}
        />
      </PageTransition>
    );
  }