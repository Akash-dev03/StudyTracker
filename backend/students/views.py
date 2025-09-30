from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Sum, F, Q, Count
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Student, Test, Mark
from .serializers import (
    StudentSerializer, TestSerializer, MarkSerializer, TopperSerializer
)


# ============ Authentication Views ============

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    Register a new user
    Body: { username, email, password, first_name?, last_name? }
    """
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    
    # Validation
    if not username or not email or not password:
        return Response(
            {'error': 'Username, email, and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if user already exists
    if User.objects.filter(username=username).exists():
        return Response(
            {'error': 'Username already exists'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if User.objects.filter(email=email).exists():
        return Response(
            {'error': 'Email already exists'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create user
    try:
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'User created successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            },
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }
        }, status=status.HTTP_201_CREATED)
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """
    Login user
    Body: { username, password }
    """
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response(
            {'error': 'Username and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Authenticate user
    user = authenticate(username=username, password=password)
    
    if user is None:
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Generate tokens
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
        },
        'tokens': {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """
    Get current authenticated user information
    """
    user = request.user
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """
    Logout user (client should remove tokens)
    """
    return Response({
        'message': 'Successfully logged out'
    }, status=status.HTTP_200_OK)


# ============ Student ViewSet ============

class StudentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Student CRUD operations
    Supports filtering by search (name, roll_number) and class
    """
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['class_name']
    search_fields = ['name', 'roll_number', 'email']
    ordering_fields = ['name', 'roll_number', 'created_at']
    ordering = ['roll_number']

    def get_queryset(self):
        """
        Optionally filter by class and search query
        """
        queryset = Student.objects.all()
        
        class_name = self.request.query_params.get('class', None)
        if class_name:
            queryset = queryset.filter(class_name=class_name)
        
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(roll_number__icontains=search) |
                Q(email__icontains=search)
            )
        
        return queryset


# ============ Test ViewSet ============

class TestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Test CRUD operations
    Includes student_count in responses
    """
    queryset = Test.objects.all()
    serializer_class = TestSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['date', 'name']
    ordering = ['-date']

    def get_queryset(self):
        """
        Optionally filter by search query
        """
        queryset = Test.objects.all()
        
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(name__icontains=search)
        
        return queryset


# ============ Mark ViewSet ============

class MarkViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Mark CRUD operations
    Supports filtering by student_id and test_id
    """
    queryset = Mark.objects.select_related('student', 'test').all()
    serializer_class = MarkSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['student', 'test', 'subject_name']
    ordering_fields = ['test__date', 'marks_obtained']
    ordering = ['-test__date']

    def get_queryset(self):
        """
        Optionally filter by student_id and test_id
        """
        queryset = Mark.objects.select_related('student', 'test').all()
        
        student_id = self.request.query_params.get('student_id', None)
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        
        test_id = self.request.query_params.get('test_id', None)
        if test_id:
            queryset = queryset.filter(test_id=test_id)
        
        return queryset


# ============ Report Views ============

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_topper(request):
    """
    Get topper(s) for a specific test
    Query params: test_id (required)
    
    Returns list of toppers with student info, total_marks, and percentage
    """
    test_id = request.query_params.get('test_id')
    
    if not test_id:
        return Response(
            {'error': 'test_id query parameter is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        test = Test.objects.get(id=test_id)
    except Test.DoesNotExist:
        return Response(
            {'error': 'Test not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    marks = Mark.objects.filter(test_id=test_id).select_related('student')
    
    if not marks.exists():
        return Response([], status=status.HTTP_200_OK)
    
    student_totals = {}
    for mark in marks:
        student_id = mark.student.id
        if student_id not in student_totals:
            student_totals[student_id] = {
                'student': mark.student,
                'total_obtained': 0,
                'total_maximum': 0
            }
        student_totals[student_id]['total_obtained'] += mark.marks_obtained
        student_totals[student_id]['total_maximum'] += mark.max_marks
    
    toppers = []
    for student_id, data in student_totals.items():
        percentage = (data['total_obtained'] / data['total_maximum'] * 100) if data['total_maximum'] > 0 else 0
        toppers.append({
            'student': data['student'],
            'total_marks': data['total_obtained'],
            'percentage': round(percentage, 2)
        })
    
    toppers.sort(key=lambda x: x['total_marks'], reverse=True)
    
    serializer = TopperSerializer(toppers, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def global_top_performers(request):
    """
    Get global top performers across all tests
    Query params: class (optional), limit (optional, default=10)
    
    Returns list of top performing students with total marks and average percentage
    """
    class_name = request.query_params.get('class')
    limit = int(request.query_params.get('limit', 10))
    
    marks_queryset = Mark.objects.select_related('student', 'test').all()
    
    if class_name:
        marks_queryset = marks_queryset.filter(student__class_name=class_name)
    
    if not marks_queryset.exists():
        return Response([], status=status.HTTP_200_OK)
    
    student_totals = {}
    for mark in marks_queryset:
        student_id = mark.student.id
        if student_id not in student_totals:
            student_totals[student_id] = {
                'student': mark.student,
                'total_obtained': 0,
                'total_maximum': 0
            }
        student_totals[student_id]['total_obtained'] += mark.marks_obtained
        student_totals[student_id]['total_maximum'] += mark.max_marks
    
    performers = []
    for student_id, data in student_totals.items():
        percentage = (data['total_obtained'] / data['total_maximum'] * 100) if data['total_maximum'] > 0 else 0
        performers.append({
            'student': data['student'],
            'total_marks': data['total_obtained'],
            'percentage': round(percentage, 2)
        })
    
    performers.sort(key=lambda x: (x['percentage'], x['total_marks']), reverse=True)
    
    performers = performers[:limit]
    
    serializer = TopperSerializer(performers, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)
