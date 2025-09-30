from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Student(models.Model):
    """Student model with personal and academic information"""
    name = models.CharField(max_length=255)
    roll_number = models.CharField(max_length=50, unique=True)
    class_name = models.CharField(max_length=50)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateField(auto_now_add=True)

    class Meta:
        ordering = ['roll_number']
        indexes = [
            models.Index(fields=['roll_number']),
            models.Index(fields=['class_name']),
        ]

    def __str__(self):
        return f"{self.name} ({self.roll_number})"


class Test(models.Model):
    """Test/Exam model with subjects stored as JSON"""
    name = models.CharField(max_length=255)
    date = models.DateField()
    subjects = models.JSONField(
        help_text="Array of subjects with name and max_marks. Example: [{'name': 'Math', 'max_marks': 100}]"
    )

    class Meta:
        ordering = ['-date']
        indexes = [
            models.Index(fields=['date']),
        ]

    def __str__(self):
        return f"{self.name} - {self.date}"

    @property
    def student_count(self):
        """Count unique students who have marks for this test"""
        return Mark.objects.filter(test=self).values('student').distinct().count()


class Mark(models.Model):
    """Mark model linking students to tests with subject-specific scores"""
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='marks'
    )
    test = models.ForeignKey(
        Test,
        on_delete=models.CASCADE,
        related_name='marks'
    )
    subject_name = models.CharField(max_length=100)
    marks_obtained = models.IntegerField(
        validators=[MinValueValidator(0)]
    )
    max_marks = models.IntegerField(
        validators=[MinValueValidator(1)]
    )

    class Meta:
        ordering = ['-test__date', 'student__roll_number']
        unique_together = ['student', 'test', 'subject_name']
        indexes = [
            models.Index(fields=['student', 'test']),
            models.Index(fields=['test']),
        ]

    def __str__(self):
        return f"{self.student.name} - {self.test.name} - {self.subject_name}: {self.marks_obtained}/{self.max_marks}"

    @property
    def percentage(self):
        """Calculate percentage for this mark"""
        if self.max_marks > 0:
            return (self.marks_obtained / self.max_marks) * 100
        return 0

    def clean(self):
        """Validate that marks_obtained doesn't exceed max_marks"""
        from django.core.exceptions import ValidationError
        if self.marks_obtained > self.max_marks:
            raise ValidationError("Marks obtained cannot exceed maximum marks")
