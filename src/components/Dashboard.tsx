import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocuments } from '../contexts/DocumentContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar, FileText, Clock, Folder, Plus, Trash2, Edit2, Search, Filter, Grid3x3, MoreVertical, Star, Eye, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const Dashboard = () => {
  const navigate = useNavigate();
  const { documents, createDocument, deleteDocument, updateDocument } = useDocuments();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateNew = () => {
    const newDoc = createDocument();
    navigate(`/editor/${newDoc.id}`);
  };

  // Handle file upload for txt files
  const handleUploadTxt = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const file = evt.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      // For now, just make a new doc titled after file and fill with text content
      const newDoc = createDocument();
      // Assign content
      newDoc.title = file.name.replace(/\.txt$/, '');
      newDoc.blocks = [{
        id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'paragraph',
        content: text ?? '',
      }];
      if (typeof window !== "undefined") {
        setTimeout(() => {
          useDocuments().updateDocument(newDoc.id, { title: newDoc.title, blocks: newDoc.blocks });
          navigate(`/editor/${newDoc.id}`);
        }, 100);
      }
    };
    reader.readAsText(file);
  };

  const handleEditTitle = (doc: any) => {
    setEditingId(doc.id);
    setEditingTitle(doc.title);
  };

  const handleSaveTitle = (docId: string) => {
    if (editingTitle.trim()) {
      updateDocument(docId, { title: editingTitle.trim() });
    }
    setEditingId(null);
    setEditingTitle('');
  };

  const handleKeyPress = (e: React.KeyboardEvent, docId: string) => {
    if (e.key === 'Enter') {
      handleSaveTitle(docId);
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditingTitle('');
    }
  };

  const handleDeleteDocument = (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    setDocumentToDelete(docId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (documentToDelete) {
      deleteDocument(documentToDelete);
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-background to-accent/20">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-border/50 bg-gradient-to-r from-background via-background to-accent/10 backdrop-blur-xl">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative flex items-center justify-between p-8">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-primary via-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">W</span>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-foreground text-3xl tracking-tight">Wrdo</h1>
              <p className="text-muted-foreground text-lg font-medium">Professional Document Workspace</p>
            </div>
          </div>

          {/* Enhanced action buttons */}
          <div className="flex items-center gap-3">
            {/* Search button */}
            <button className="h-12 px-4 rounded-xl bg-accent/50 hover:bg-accent border border-border/50 hover:border-border transition-all duration-300 flex items-center gap-2 group">
              <Search className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">Search</span>
            </button>
            
            {/* Filter button */}
            <button className="h-12 px-4 rounded-xl bg-accent/50 hover:bg-accent border border-border/50 hover:border-border transition-all duration-300 flex items-center gap-2 group">
              <Filter className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>

            {/* Upload file */}
            <div className="relative">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="h-12 px-6 rounded-xl bg-secondary hover:bg-secondary/80 border border-border/50 hover:border-primary/30 transition-all duration-300 flex items-center gap-2 group shadow-sm hover:shadow-md"
              >
                <Folder className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Import</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt"
                className="hidden"
                onChange={handleUploadTxt}
              />
            </div>

            {/* Create new */}
            <button
              onClick={handleCreateNew}
              className="h-12 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl font-medium group"
            >
              <Plus className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
              <span>New Document</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-8 py-12">
        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Documents</p>
                  <p className="text-3xl font-bold text-primary">{documents.length}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20 hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Today</p>
                  <p className="text-3xl font-bold text-green-600">{documents.filter(doc => 
                    new Date(doc.updatedAt).toDateString() === new Date().toDateString()
                  ).length}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 hover-lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Blocks</p>
                  <p className="text-3xl font-bold text-blue-600">{documents.reduce((acc, doc) => acc + (doc.blocks?.length || 0), 0)}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <Grid3x3 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Header with controls */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Recent Documents</h2>
            <p className="text-muted-foreground text-lg">Continue where you left off</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-accent transition-colors">
              <Grid3x3 className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className="bg-card hover:bg-card/80 border border-border/50 hover:border-primary/30 rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden group hover-lift shadow-sm hover:shadow-lg"
              onClick={() => navigate(`/editor/${doc.id}`)}
            >
              <CardContent className="p-0">
                {/* Document preview section */}
                <div className="relative h-40 bg-gradient-to-br from-accent/30 via-accent/10 to-background border-b border-border/30 overflow-hidden">
                  <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                  <div className="relative p-4 h-full">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTitle(doc);
                          }}
                          className="w-8 h-8 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-accent border border-border/50 flex items-center justify-center transition-all duration-200 hover:scale-105"
                          aria-label="Edit title"
                        >
                          <Edit2 className="w-4 h-4 text-muted-foreground hover:text-primary" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteDocument(e, doc.id)}
                          className="w-8 h-8 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-destructive/10 border border-border/50 flex items-center justify-center transition-all duration-200 hover:scale-105"
                          aria-label="Delete document"
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Star/favorite functionality can be added later
                          }}
                          className="w-8 h-8 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-yellow-500/10 border border-border/50 flex items-center justify-center transition-all duration-200 hover:scale-105"
                          aria-label="Star document"
                        >
                          <Star className="w-4 h-4 text-muted-foreground hover:text-yellow-500" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="h-2 bg-primary/20 rounded-full w-3/4" />
                      <div className="h-2 bg-primary/10 rounded-full w-1/2" />
                      <div className="h-2 bg-primary/10 rounded-full w-2/3" />
                    </div>
                  </div>
                </div>

                {/* Document info section */}
                <div className="p-6">
                  {editingId === doc.id ? (
                    <Input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={() => handleSaveTitle(doc.id)}
                      onKeyDown={(e) => handleKeyPress(e, doc.id)}
                      className="text-lg font-semibold text-foreground mb-3 bg-transparent border-primary/30 focus:border-primary"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <h3 className="text-lg font-semibold text-foreground truncate mb-3 group-hover:text-primary transition-colors">
                      {doc.title}
                    </h3>
                  )}
                  
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {(doc.blocks && doc.blocks.length > 0 && doc.blocks.some(b => b.content?.trim()))
                      ? doc.blocks.map(b => b.content).join(' ').substring(0, 80) + '...'
                      : 'Empty document - Click to start writing'}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{doc.blocks?.length || 0}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-md">
                      <Grid3x3 className="w-3 h-3 text-primary" />
                      <span className="text-primary font-medium">{doc.blocks?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {documents.length === 0 && (
          <div className="text-center py-20">
            <div className="relative mx-auto mb-8 w-32 h-32">
              <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-primary/10 rounded-3xl flex items-center justify-center shadow-lg">
                <FileText className="w-16 h-16 text-primary" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-green-500 to-green-400 rounded-full flex items-center justify-center shadow-md">
                <Plus className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">Welcome to Wrdo</h3>
            <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
              Your professional document workspace is ready. Create your first document and start writing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={handleCreateNew}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                Create New Document
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-8 py-4 rounded-xl font-semibold transition-all duration-300 border border-border/50 hover:border-primary/30 flex items-center gap-2"
              >
                <Folder className="w-5 h-5" />
                Import Document
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Custom Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
