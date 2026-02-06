// Three-panel layout components
import { ReactNode } from 'react';

interface LayoutProps {
  leftPanel: ReactNode;
  centerPanel: ReactNode;
  rightPanel: ReactNode;
}

export function ThreePanelLayout({ leftPanel, centerPanel, rightPanel }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Left Navigation Panel */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {leftPanel}
      </aside>

      {/* Center Content Panel */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {centerPanel}
      </main>

      {/* Right Detail/Calendar Panel */}
      <aside className="w-96 bg-white border-l border-gray-200 flex flex-col">
        {rightPanel}
      </aside>
    </div>
  );
}
