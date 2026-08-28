import React, { useState } from 'react';
import { useCommsStore } from './useCommsStore';
import { Sparkles, Send, Newspaper, ChevronRight } from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';

export const TabPressRelations: React.FC = () => {
  const { 
    isDraftingPress, 
    pressDraft, 
    setPressDraft, 
    generatePressDraft, 
    publishPressRelease,
    pressTemplates
  } = useCommsStore();

  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGenerateClick = () => {
    // Fallback to first template if none selected yet
    const targetId = selectedTemplate || (pressTemplates.length > 0 ? pressTemplates[0].id : '');
    const template = pressTemplates.find(t => t.id === targetId);
    if (template) {
      generatePressDraft(template.id); // Passing the ID to service
    }
  };

  const handlePublishConfirm = () => {
    publishPressRelease();
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[600px]">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800 flex items-center">
            <Newspaper className="w-5 h-5 mr-2 text-blue-600" />
            Media & Press Relations
          </h3>
          <p className="text-xs text-slate-500 mt-1">Generate official press releases from operational logs</p>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col space-y-5">
        
        {/* Template Selector */}
        <div className="flex flex-col space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Template</label>
          <div className="flex space-x-3">
            <select 
              value={selectedTemplate || (pressTemplates.length > 0 ? pressTemplates[0].id : '')}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="flex-1 bg-white border border-slate-300 rounded-lg p-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-[#0f2942] focus:border-[#0f2942]"
            >
              {pressTemplates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <button
              onClick={handleGenerateClick}
              disabled={isDraftingPress}
              className="flex items-center space-x-2 px-5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
            >
              {isDraftingPress ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate AI Draft</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#0f2942] focus-within:border-[#0f2942]">
          <textarea
            className="w-full flex-1 p-4 border-none resize-none text-slate-700 leading-relaxed focus:ring-0 bg-slate-50/50"
            placeholder="Generated press release will appear here. You can manually edit the content before publishing."
            value={pressDraft}
            onChange={(e) => setPressDraft(e.target.value)}
            disabled={isDraftingPress}
          />
        </div>

        {/* Action Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={!pressDraft || isDraftingPress}
            className="flex items-center space-x-2 py-2.5 px-6 bg-[#0f2942] hover:bg-[#1a3a5a] text-white rounded-lg font-medium text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <Send className="w-4 h-4" />
            <span>Publish to Press Portal</span>
            <ChevronRight className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </button>
        </div>

      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        title="Confirm Publication"
        message="This action will publish the press release to the public portal and distribute it to registered media contacts. This cannot be undone."
        confirmText="Publish to Press Portal"
        onConfirm={handlePublishConfirm}
        onCancel={() => setIsModalOpen(false)}
      />

    </div>
  );
};
