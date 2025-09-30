import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Calendar, Plus, X, BookOpen, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { testApi, Test, Subject } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface AddTestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editTest?: Test | null;
}

const commonSubjects = [
  { name: 'Mathematics', max_marks: 100 },
  { name: 'Science', max_marks: 100 },
  { name: 'English', max_marks: 80 },
  { name: 'History', max_marks: 80 },
  { name: 'Geography', max_marks: 80 },
  { name: 'Computer Science', max_marks: 100 },
];

export function AddTestDialog({ isOpen, onClose, onSuccess, editTest }: AddTestDialogProps) {
  const [formData, setFormData] = useState({
    name: editTest?.name || '',
    date: editTest?.date || '',
  });
  const [subjects, setSubjects] = useState<Subject[]>(editTest?.subjects || []);
  const [customSubject, setCustomSubject] = useState({ name: '', max_marks: 100 });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Test name is required';
    if (!formData.date) newErrors.date = 'Test date is required';
    if (subjects.length === 0) newErrors.subjects = 'At least one subject is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      const testData = {
        ...formData,
        subjects: subjects,
      };

      if (editTest) {
        await testApi.update(editTest.id, testData);
        toast({
          title: "Success",
          description: "Test updated successfully",
        });
      } else {
        await testApi.create(testData);
        toast({
          title: "Success",
          description: "Test created successfully",
        });
      }
      
      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${editTest ? 'update' : 'create'} test`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', date: '' });
    setSubjects([]);
    setCustomSubject({ name: '', max_marks: 100 });
    setErrors({});
  };

  const handleClose = () => {
    if (!editTest) resetForm();
    onClose();
  };

  const addCommonSubject = (subject: Subject) => {
    if (!subjects.find(s => s.name === subject.name)) {
      setSubjects([...subjects, subject]);
    }
  };

  const addCustomSubject = () => {
    if (!customSubject.name.trim()) return;
    if (subjects.find(s => s.name === customSubject.name)) {
      toast({
        title: "Error",
        description: "Subject already exists",
        variant: "destructive",
      });
      return;
    }

    setSubjects([...subjects, customSubject]);
    setCustomSubject({ name: '', max_marks: 100 });
  };

  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const updateSubjectMarks = (index: number, max_marks: number) => {
    const updated = [...subjects];
    updated[index] = { ...updated[index], max_marks };
    setSubjects(updated);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {editTest ? 'Edit Test' : 'Create New Test'}
          </DialogTitle>
          <DialogDescription>
            {editTest ? 'Update test information and subjects' : 'Set up a new test with subjects and maximum marks'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="test_name">Test Name</Label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="test_name"
                  placeholder="Mid-Term Exam"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`pl-10 ${errors.name ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="test_date">Test Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="test_date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className={`pl-10 ${errors.date ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
            </div>
          </div>

          {/* Common Subjects */}
          <div className="space-y-3">
            <Label>Quick Add Subjects</Label>
            <div className="flex flex-wrap gap-2">
              {commonSubjects.map((subject, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addCommonSubject(subject)}
                  disabled={subjects.find(s => s.name === subject.name) !== undefined}
                  className="text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {subject.name} ({subject.max_marks})
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Subject */}
          <div className="space-y-3">
            <Label>Add Custom Subject</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Subject name"
                  value={customSubject.name}
                  onChange={(e) => setCustomSubject({ ...customSubject, name: e.target.value })}
                />
              </div>
              <div className="w-24">
                <Input
                  type="number"
                  placeholder="100"
                  min="1"
                  max="200"
                  value={customSubject.max_marks}
                  onChange={(e) => setCustomSubject({ ...customSubject, max_marks: parseInt(e.target.value) || 100 })}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={addCustomSubject}
                disabled={!customSubject.name.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Selected Subjects */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Selected Subjects ({subjects.length})</Label>
              {errors.subjects && <p className="text-sm text-destructive">{errors.subjects}</p>}
            </div>
            
            {subjects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No subjects added yet</p>
                <p className="text-sm">Add subjects using the buttons above</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                <AnimatePresence>
                  {subjects.map((subject, index) => (
                    <motion.div
                      key={`${subject.name}-${index}`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                      <div className="flex-1 flex items-center gap-3">
                        <Badge variant="outline">{subject.name}</Badge>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Max marks:</span>
                          <Input
                            type="number"
                            min="1"
                            max="200"
                            value={subject.max_marks}
                            onChange={(e) => updateSubjectMarks(index, parseInt(e.target.value) || 0)}
                            className="w-16 h-8 text-center"
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSubject(index)}
                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <p className="font-medium mb-1">Total Maximum Marks: {subjects.reduce((sum, s) => sum + s.max_marks, 0)}</p>
            <p>This test will have {subjects.length} subject{subjects.length !== 1 ? 's' : ''}</p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="btn-primary">
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                />
              ) : (
                editTest ? 'Update Test' : 'Create Test'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}