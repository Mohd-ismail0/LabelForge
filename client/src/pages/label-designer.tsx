import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import FileUpload from "@/components/file-upload";
import DesignCanvas from "@/components/design-canvas";
import ElementProperties from "@/components/element-properties";
import ExportControls from "@/components/export-controls";
import { LabelElement, LabelProject } from "@shared/schema";

export default function LabelDesigner() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentProject, setCurrentProject] = useState<LabelProject | null>(null);
  const [selectedElement, setSelectedElement] = useState<LabelElement | null>(null);
  const [dataColumns, setDataColumns] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [currentDataRow, setCurrentDataRow] = useState(0);

  // Create new project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/projects', data);
      return response.json();
    },
    onSuccess: (project) => {
      setCurrentProject(project);
      toast({
        title: "Project Created",
        description: "New label project has been created successfully.",
      });
    },
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest('PUT', `/api/projects/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    },
  });

  // File upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: (data) => {
      setDataColumns(data.columns);
      setPreviewData(data.preview);
      toast({
        title: "File Uploaded",
        description: `Successfully uploaded ${data.filename} with ${data.rowCount} rows.`,
      });
    },
  });

  // Initialize a new project
  const handleCreateProject = useCallback(() => {
    createProjectMutation.mutate({
      name: "New Label Project",
      width: "2.625", // Avery 5160 default
      height: "1.000",
      elements: [],
      dataMapping: {},
    });
  }, [createProjectMutation]);

  // Handle file upload
  const handleFileUpload = useCallback((file: File) => {
    if (!currentProject) {
      handleCreateProject();
      // Wait for project creation before uploading
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', currentProject.id);
    uploadFileMutation.mutate(formData);
  }, [currentProject, uploadFileMutation, handleCreateProject]);

  // Update project elements
  const handleUpdateElements = useCallback((elements: LabelElement[]) => {
    if (!currentProject) return;
    
    updateProjectMutation.mutate({
      id: currentProject.id,
      data: { elements }
    });
    
    setCurrentProject(prev => prev ? { ...prev, elements } : null);
  }, [currentProject, updateProjectMutation]);

  // Update data mapping
  const handleUpdateMapping = useCallback((mapping: { [key: string]: string }) => {
    if (!currentProject) return;
    
    updateProjectMutation.mutate({
      id: currentProject.id,
      data: { dataMapping: mapping }
    });
    
    setCurrentProject(prev => prev ? { ...prev, dataMapping: mapping } : null);
  }, [currentProject, updateProjectMutation]);

  // Initialize with a project if none exists
  if (!currentProject && !createProjectMutation.isPending) {
    handleCreateProject();
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Professional Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">LabelCraft Pro</h1>
                  <p className="text-sm text-slate-500 font-medium">Professional Label Design Platform</p>
                </div>
              </div>
              
              <div className="hidden md:flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm">
                  Designer
                </button>
                <button className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                  Templates
                </button>
                <button className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                  Analytics
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                data-testid="button-help"
              >
                <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Help
              </button>
              <button 
                className="px-6 py-2.5 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-sm"
                data-testid="button-export"
              >
                <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export PDF
              </button>
              <button 
                className="px-6 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm"
                data-testid="button-save"
              >
                <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save Project
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-85px)]">
        {/* Left Sidebar */}
        <div className="w-80 bg-white border-r border-slate-200 overflow-y-auto">
          <FileUpload
            onFileUpload={handleFileUpload}
            isUploading={uploadFileMutation.isPending}
            dataColumns={dataColumns}
            previewData={previewData}
          />
        </div>

        {/* Main Canvas */}
        <div className="flex-1 flex flex-col bg-slate-100">
          {/* Data Row Navigation */}
          {previewData.length > 1 && (
            <div className="bg-white border-b border-slate-200 px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-slate-700">Data Preview:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentDataRow(Math.max(0, currentDataRow - 1))}
                      disabled={currentDataRow === 0}
                      className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full min-w-[80px] text-center">
                      {currentDataRow + 1} of {previewData.length}
                    </span>
                    <button
                      onClick={() => setCurrentDataRow(Math.min(previewData.length - 1, currentDataRow + 1))}
                      disabled={currentDataRow === previewData.length - 1}
                      className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="text-sm text-slate-500">
                  See how your label will look with different data
                </div>
              </div>
            </div>
          )}
          
          <DesignCanvas
            project={currentProject}
            onUpdateElements={handleUpdateElements}
            onSelectElement={setSelectedElement}
            selectedElement={selectedElement}
            previewData={previewData}
            currentDataRow={currentDataRow}
          />
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-white border-l border-slate-200 overflow-y-auto">
          <ElementProperties
            selectedElement={selectedElement}
            dataColumns={dataColumns}
            previewData={previewData}
            onUpdateElement={(element) => {
              if (!currentProject) return;
              const elements = (currentProject.elements as LabelElement[]) || [];
              const updated = elements.map(el => el.id === element.id ? element : el);
              handleUpdateElements(updated);
            }}
            onUpdateMapping={(elementId, columnName) => {
              // Update the data mapping in the project
              if (!currentProject) return;
              const currentMapping = (currentProject.dataMapping as { [key: string]: string }) || {};
              const updatedMapping = { ...currentMapping, [elementId]: columnName };
              handleUpdateMapping(updatedMapping);
            }}
          />
          
          <ExportControls
            project={currentProject}
            totalRows={previewData.length}
            previewData={previewData}
            onExport={(format) => {
              console.log(`Export triggered: ${format}`);
            }}
          />
        </div>
      </div>
    </div>
  );
}
