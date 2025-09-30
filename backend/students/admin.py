from django.contrib import admin
from .models import Student, Test, Mark


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['roll_number', 'name', 'class_name', 'email', 'phone', 'created_at']
    list_filter = ['class_name', 'created_at']
    search_fields = ['name', 'roll_number', 'email']
    readonly_fields = ['created_at']
    ordering = ['roll_number']
    
    fieldsets = (
        ('Personal Information', {
            'fields': ('name', 'email', 'phone')
        }),
        ('Academic Information', {
            'fields': ('roll_number', 'class_name')
        }),
        ('System Information', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )


@admin.register(Test)
class TestAdmin(admin.ModelAdmin):
    list_display = ['name', 'date', 'get_subjects_count', 'student_count']
    list_filter = ['date']
    search_fields = ['name']
    ordering = ['-date']
    
    fieldsets = (
        ('Test Information', {
            'fields': ('name', 'date')
        }),
        ('Subjects', {
            'fields': ('subjects',),
            'description': 'Enter subjects as JSON array: [{"name": "Math", "max_marks": 100}]'
        }),
    )
    
    def get_subjects_count(self, obj):
        """Display number of subjects"""
        return len(obj.subjects) if obj.subjects else 0
    get_subjects_count.short_description = 'Subjects'


@admin.register(Mark)
class MarkAdmin(admin.ModelAdmin):
    list_display = ['student', 'test', 'subject_name', 'marks_obtained', 'max_marks', 'get_percentage']
    list_filter = ['test', 'subject_name', 'student__class_name']
    search_fields = ['student__name', 'student__roll_number', 'test__name', 'subject_name']
    autocomplete_fields = ['student']
    ordering = ['-test__date', 'student__roll_number']
    
    fieldsets = (
        ('Mark Information', {
            'fields': ('student', 'test', 'subject_name')
        }),
        ('Scores', {
            'fields': ('marks_obtained', 'max_marks')
        }),
    )
    
    def get_percentage(self, obj):
        """Display percentage"""
        return f"{obj.percentage:.1f}%"
    get_percentage.short_description = 'Percentage'
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """Customize foreign key displays"""
        if db_field.name == "student":
            kwargs["queryset"] = Student.objects.order_by('roll_number')
        if db_field.name == "test":
            kwargs["queryset"] = Test.objects.order_by('-date')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
