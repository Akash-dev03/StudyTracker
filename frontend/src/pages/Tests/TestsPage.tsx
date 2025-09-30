import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Calendar, Users, BookOpen, Eye, Edit, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/Layout/PageTransition';
import { testApi, Test } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { AddTestDialog } from '@/components/forms/AddTestDialog';
import { TestDetailModal } from '@/components/TestDetailModal';

export function TestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editTest, setEditTest] = useState<Test | null>(null);
  const [viewTest, setViewTest] = useState<Test | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      setLoading(true);
      const data = await testApi.getAll({ search: searchQuery || undefined });
      setTests(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load tests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this test? All associated marks will be lost.')) return;
    
    try {
      await testApi.delete(id);
      toast({
        title: "Success",
        description: "Test deleted successfully",
      });
      loadTests();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete test",
        variant: "destructive",
      });
    }
  };

  const filteredTests = tests.filter(test => 
    test.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTestStatus = (dateString: string) => {
    const testDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    testDate.setHours(0, 0, 0, 0);

    if (testDate > today) {
      return { status: 'upcoming', color: 'bg-warning text-warning-foreground' };
    } else if (testDate.getTime() === today.getTime()) {
      return { status: 'today', color: 'bg-primary text-primary-foreground' };
    } else {
      return { status: 'completed', color: 'bg-success text-success-foreground' };
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tests</h1>
            <p className="text-muted-foreground">Create and manage examinations</p>
          </div>
          <Button className="btn-primary" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Test
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="card-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{tests.length}</div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                {tests.filter(t => getTestStatus(t.date).status === 'upcoming').length}
              </div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {tests.filter(t => getTestStatus(t.date).status === 'completed').length}
              </div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Subjects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {tests.reduce((acc, test) => acc + test.subjects.length, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tests by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="card-elevated animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredTests.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No tests found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Try adjusting your search' : 'Get started by creating your first test'}
              </p>
              <Button className="btn-primary" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Test
              </Button>
            </div>
          ) : (
            filteredTests.map((test, index) => {
              const statusInfo = getTestStatus(test.date);
              return (
                <motion.div
                  key={test.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="card-elevated card-hover h-full cursor-pointer" onClick={() => setViewTest(test)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg leading-tight">{test.name}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(test.date)}
                          </CardDescription>
                        </div>
                        <Badge className={`${statusInfo.color} text-xs`}>
                          {statusInfo.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Test Info */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {test.subjects.length} subject{test.subjects.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {test.student_count || 0} student{(test.student_count || 0) !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {/* Subjects */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Subjects:</p>
                        <div className="flex flex-wrap gap-1">
                          {test.subjects.slice(0, 3).map((subject, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {subject.name}
                            </Badge>
                          ))}
                          {test.subjects.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{test.subjects.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewTest(test);
                            }}
                            className="h-8 w-8 p-0 text-primary hover:bg-primary/10"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditTest(test);
                              setIsAddDialogOpen(true);
                            }}
                            className="h-8 w-8 p-0 text-muted-foreground hover:bg-muted"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(test.id);
                            }}
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {test.subjects.reduce((sum, s) => sum + s.max_marks, 0)} marks
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Add/Edit Test Dialog */}
        <AddTestDialog
          isOpen={isAddDialogOpen}
          onClose={() => {
            setIsAddDialogOpen(false);
            setEditTest(null);
          }}
          onSuccess={loadTests}
          editTest={editTest}
        />

        {/* Test Detail Modal */}
        <TestDetailModal
          isOpen={!!viewTest}
          onClose={() => setViewTest(null)}
          test={viewTest}
        />
      </div>
    </PageTransition>
  );
}
