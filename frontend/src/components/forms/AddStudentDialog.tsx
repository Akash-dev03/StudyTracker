import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Hash, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { studentApi, Student } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface AddStudentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editStudent?: Student | null;
}

export function AddStudentDialog({ isOpen, onClose, onSuccess, editStudent }: AddStudentDialogProps) {
  const [formData, setFormData] = useState({
    name: editStudent?.name || '',
    roll_number: editStudent?.roll_number || '',
    class_name: editStudent?.class_name || '',
    email: editStudent?.email || '',
    phone: editStudent?.phone || '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCustomClass, setIsCustomClass] = useState(false);
  const { toast } = useToast();

  const classes = ['8A', '8B', '9A', '9B', '10A', '10B'];

  // Reset form when editStudent changes
  useEffect(() => {
    if (editStudent) {
      setFormData({
        name: editStudent.name,
        roll_number: editStudent.roll_number,
        class_name: editStudent.class_name,
        email: editStudent.email,
        phone: editStudent.phone || '',
      });
      // Check if the class is custom (not in predefined list)
      setIsCustomClass(!classes.includes(editStudent.class_name));
    } else {
      resetForm();
    }
  }, [editStudent]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.roll_number.trim()) newErrors.roll_number = 'Roll number is required';
    if (!formData.class_name.trim()) newErrors.class_name = 'Class is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      if (editStudent) {
        await studentApi.update(editStudent.id, formData);
        toast({
          title: "Success",
          description: "Student updated successfully",
        });
      } else {
        await studentApi.create(formData);
        toast({
          title: "Success",
          description: "Student added successfully",
        });
      }
      
      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${editStudent ? 'update' : 'add'} student`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      roll_number: '',
      class_name: '',
      email: '',
      phone: '',
    });
    setErrors({});
    setIsCustomClass(false);
  };

  const handleClose = () => {
    if (!editStudent) resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            {editStudent ? 'Edit Student' : 'Add New Student'}
          </DialogTitle>
          <DialogDescription>
            {editStudent ? 'Update student information' : 'Enter student details to add them to the system'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="name"
                placeholder="Enter student's full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`pl-10 ${errors.name ? 'border-destructive' : ''}`}
              />
            </div>
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="roll_number">Roll Number</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="roll_number"
                  placeholder="ST001"
                  value={formData.roll_number}
                  onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                  className={`pl-10 ${errors.roll_number ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.roll_number && <p className="text-sm text-destructive">{errors.roll_number}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="class_name">Class</Label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                {isCustomClass ? (
                  <Input
                    id="class_name"
                    placeholder="Enter custom class name"
                    value={formData.class_name}
                    onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                    className={`pl-10 ${errors.class_name ? 'border-destructive' : ''}`}
                  />
                ) : (
                  <select
                    id="class_name"
                    value={formData.class_name}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomClass(true);
                        setFormData({ ...formData, class_name: '' });
                      } else {
                        setFormData({ ...formData, class_name: e.target.value });
                      }
                    }}
                    className={`w-full pl-10 pr-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${errors.class_name ? 'border-destructive' : ''}`}
                  >
                    <option value="">Select Class</option>
                    {classes.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                    <option value="__custom__">+ Add Custom Class</option>
                  </select>
                )}
              </div>
              {isCustomClass && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="text-xs px-0 h-auto"
                  onClick={() => {
                    setIsCustomClass(false);
                    setFormData({ ...formData, class_name: '' });
                  }}
                >
                  ← Back to class list
                </Button>
              )}
              {errors.class_name && <p className="text-sm text-destructive">{errors.class_name}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="student@school.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
              />
            </div>
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+91 9639114022"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
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
                editStudent ? 'Update Student' : 'Add Student'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
