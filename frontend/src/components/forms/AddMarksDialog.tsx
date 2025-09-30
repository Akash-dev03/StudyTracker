import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, User, BookOpen, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { markApi, testApi, studentApi, Test, Student, Subject } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface AddMarksDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface SubjectMark {
  subject_name: string;
  marks_obtained: number;
  max_marks: number;
}

export function AddMarksDialog({ isOpen, onClose, onSuccess }: AddMarksDialogProps) {
  const [tests, setTests] = useState<Test[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [subjectMarks, setSubjectMarks] = useState<SubjectMark[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedTest) {
      const marks = selectedTest.subjects.map(subject => ({
        subject_name: subject.name,
        marks_obtained: 0,
        max_marks: subject.max_marks,
      }));
      setSubjectMarks(marks);
    } else {
      setSubjectMarks([]);
    }
  }, [selectedTest]);

  const loadInitialData = async () => {
    try {
      const [testsData, studentsData] = await Promise.all([
        testApi.getAll(),
        studentApi.getAll(),
      ]);
      setTests(testsData);
      setStudents(studentsData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedTest) newErrors.test = 'Please select a test';
    if (!selectedStudent) newErrors.student = 'Please select a student';
    
    // Validate each subject mark
    subjectMarks.forEach((mark, index) => {
      if (mark.marks_obtained < 0) {
        newErrors[`subject_${index}`] = 'Marks cannot be negative';
      }
      if (mark.marks_obtained > mark.max_marks) {
        newErrors[`subject_${index}`] = `Marks cannot exceed ${mark.max_marks}`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      // Create marks for each subject
      for (const mark of subjectMarks) {
        await markApi.create({
          student_id: selectedStudent!.id,
          test_id: selectedTest!.id,
          subject_name: mark.subject_name,
          marks_obtained: mark.marks_obtained,
          max_marks: mark.max_marks,
        });
      }
      
      toast({
        title: "Success",
        description: "Marks added successfully",
      });
      
      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add marks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedTest(null);
    setSelectedStudent(null);
    setSubjectMarks([]);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const updateSubjectMark = (index: number, marks_obtained: number) => {
    const updated = [...subjectMarks];
    updated[index] = { ...updated[index], marks_obtained };
    setSubjectMarks(updated);
  };

  const calculateTotal = () => {
    return {
      obtained: subjectMarks.reduce((sum, mark) => sum + mark.marks_obtained, 0),
      maximum: subjectMarks.reduce((sum, mark) => sum + mark.max_marks, 0),
    };
  };

  const total = calculateTotal();
  const percentage = total.maximum > 0 ? (total.obtained / total.maximum) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Add Marks
          </DialogTitle>
          <DialogDescription>
            Enter marks for a student's test performance
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Test and Student Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="test">Select Test</Label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select
                  id="test"
                  value={selectedTest?.id || ''}
                  onChange={(e) => {
                    const test = tests.find(t => t.id === parseInt(e.target.value));
                    setSelectedTest(test || null);
                  }}
                  className={`w-full pl-10 pr-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${errors.test ? 'border-destructive' : ''}`}
                >
                  <option value="">Choose a test</option>
                  {tests.map(test => (
                    <option key={test.id} value={test.id}>
                      {test.name} - {new Date(test.date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
              {errors.test && <p className="text-sm text-destructive">{errors.test}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="student">Select Student</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <select
                  id="student"
                  value={selectedStudent?.id || ''}
                  onChange={(e) => {
                    const student = students.find(s => s.id === parseInt(e.target.value));
                    setSelectedStudent(student || null);
                  }}
                  className={`w-full pl-10 pr-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${errors.student ? 'border-destructive' : ''}`}
                >
                  <option value="">Choose a student</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.roll_number})
                    </option>
                  ))}
                </select>
              </div>
              {errors.student && <p className="text-sm text-destructive">{errors.student}</p>}
            </div>
          </div>

          {/* Subject Marks */}
          {selectedTest && selectedStudent && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Subject-wise Marks</Label>
                <Badge variant="outline">
                  {selectedTest.subjects.length} subjects
                </Badge>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {subjectMarks.map((mark, index) => (
                  <motion.div
                    key={mark.subject_name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <Badge variant="outline" className="mb-2">
                        {mark.subject_name}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        Maximum: {mark.max_marks} marks
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="number"
                          min="0"
                          max={mark.max_marks}
                          value={mark.marks_obtained}
                          onChange={(e) => updateSubjectMark(index, parseInt(e.target.value) || 0)}
                          className={`w-24 pl-10 text-center ${errors[`subject_${index}`] ? 'border-destructive' : ''}`}
                          placeholder="0"
                        />
                      </div>
                      <span className="text-muted-foreground">/ {mark.max_marks}</span>
                    </div>
                    
                    {errors[`subject_${index}`] && (
                      <p className="text-sm text-destructive">{errors[`subject_${index}`]}</p>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Total Summary */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-foreground">Total Score</span>
                  <Badge className={percentage >= 90 ? 'badge-success' : percentage >= 75 ? 'badge-warning' : percentage >= 60 ? 'badge-info' : 'badge-destructive'}>
                    {percentage.toFixed(1)}%
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-primary">
                  {total.obtained} / {total.maximum}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedStudent.name} • {selectedTest.name}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !selectedTest || !selectedStudent} 
              className="btn-primary"
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                />
              ) : (
                'Add Marks'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}