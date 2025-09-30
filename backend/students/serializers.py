from rest_framework import serializers
from .models import Student, Test, Mark


class StudentSerializer(serializers.ModelSerializer):
    """Serializer for Student model matching TypeScript Student interface"""
    created_at = serializers.DateField(format="%Y-%m-%d", read_only=True)
    
    class Meta:
        model = Student
        fields = ['id', 'name', 'roll_number', 'class_name', 'email', 'phone', 'created_at']
        
    def validate_roll_number(self, value):
        """Ensure roll_number is unique (except when updating)"""
        instance = self.instance
        if Student.objects.filter(roll_number=value).exclude(pk=instance.pk if instance else None).exists():
            raise serializers.ValidationError("A student with this roll number already exists.")
        return value
    
    def validate_email(self, value):
        """Ensure email is unique (except when updating)"""
        instance = self.instance
        if Student.objects.filter(email=value).exclude(pk=instance.pk if instance else None).exists():
            raise serializers.ValidationError("A student with this email already exists.")
        return value


class SubjectSerializer(serializers.Serializer):
    """Serializer for Subject (embedded in Test) matching TypeScript Subject interface"""
    id = serializers.IntegerField(required=False, allow_null=True)
    name = serializers.CharField(max_length=100)
    max_marks = serializers.IntegerField(min_value=1)


class TestSerializer(serializers.ModelSerializer):
    """Serializer for Test model matching TypeScript Test interface"""
    subjects = SubjectSerializer(many=True)
    student_count = serializers.IntegerField(read_only=True)
    date = serializers.DateField(format="%Y-%m-%d")
    
    class Meta:
        model = Test
        fields = ['id', 'name', 'date', 'subjects', 'student_count']
    
    def validate_subjects(self, value):
        """Ensure subjects is not empty"""
        if not value:
            raise serializers.ValidationError("At least one subject is required.")
        
        # Check for duplicate subject names
        subject_names = [s['name'] for s in value]
        if len(subject_names) != len(set(subject_names)):
            raise serializers.ValidationError("Duplicate subject names are not allowed.")
        
        return value
    
    def create(self, validated_data):
        """Create test with subjects"""
        subjects_data = validated_data.pop('subjects')
        
        # Convert subjects to JSON format for storage
        subjects_json = [
            {'name': s['name'], 'max_marks': s['max_marks']}
            for s in subjects_data
        ]
        
        test = Test.objects.create(subjects=subjects_json, **validated_data)
        return test
    
    def update(self, instance, validated_data):
        """Update test with subjects"""
        subjects_data = validated_data.pop('subjects', None)
        
        # Update basic fields
        instance.name = validated_data.get('name', instance.name)
        instance.date = validated_data.get('date', instance.date)
        
        # Update subjects if provided
        if subjects_data is not None:
            subjects_json = [
                {'name': s['name'], 'max_marks': s['max_marks']}
                for s in subjects_data
            ]
            instance.subjects = subjects_json
        
        instance.save()
        return instance


class MarkSerializer(serializers.ModelSerializer):
    """Serializer for Mark model matching TypeScript Mark interface"""
    student_id = serializers.PrimaryKeyRelatedField(
        source='student',
        queryset=Student.objects.all()
    )
    test_id = serializers.PrimaryKeyRelatedField(
        source='test',
        queryset=Test.objects.all()
    )
    
    # Optional nested data for detailed responses
    student = StudentSerializer(read_only=True)
    test = TestSerializer(read_only=True)
    
    class Meta:
        model = Mark
        fields = [
            'id', 'student_id', 'test_id', 'subject_name', 
            'marks_obtained', 'max_marks', 'student', 'test'
        ]
    
    def validate(self, data):
        """Validate that marks_obtained doesn't exceed max_marks"""
        marks_obtained = data.get('marks_obtained')
        max_marks = data.get('max_marks')
        
        if marks_obtained is not None and max_marks is not None:
            if marks_obtained > max_marks:
                raise serializers.ValidationError(
                    "Marks obtained cannot exceed maximum marks."
                )
        
        # Check if subject exists in the test
        test = data.get('test')
        subject_name = data.get('subject_name')
        
        if test and subject_name:
            valid_subjects = [s['name'] for s in test.subjects]
            if subject_name not in valid_subjects:
                raise serializers.ValidationError(
                    f"Subject '{subject_name}' is not part of test '{test.name}'. "
                    f"Valid subjects: {', '.join(valid_subjects)}"
                )
        
        return data
    
    def validate_marks_obtained(self, value):
        """Ensure marks obtained is not negative"""
        if value < 0:
            raise serializers.ValidationError("Marks obtained cannot be negative.")
        return value


class TopperSerializer(serializers.Serializer):
    """Serializer for Topper response matching TypeScript Topper interface"""
    student = StudentSerializer()
    total_marks = serializers.IntegerField()
    percentage = serializers.FloatField()
    subject = serializers.CharField(required=False, allow_null=True)
