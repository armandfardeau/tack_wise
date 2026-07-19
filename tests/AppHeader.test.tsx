import { fireEvent, render, screen } from '@testing-library/react';
import AppHeader from '../src/components/AppHeader';

describe('AppHeader', () => {
  it('renders the File menu in the top-level scenario tools bar', () => {
    render(<AppHeader isExporting={false} onExport={jest.fn()} onExportJson={jest.fn()} onImportJson={jest.fn()} />);

    const scenarioTools = document.querySelector('.header-tools');

    expect(scenarioTools).toContainElement(screen.getByRole('button', { name: /file options/i }));
    expect(scenarioTools).toContainElement(screen.getByRole('button', { name: /copy share link/i }));
    expect(scenarioTools).toContainElement(screen.getByRole('button', { name: /view options/i }));
  });

  it('delegates JSON export to the provided handler', () => {
    const onExportJson = jest.fn();

    render(<AppHeader isExporting={false} onExport={jest.fn()} onExportJson={onExportJson} onImportJson={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /file options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^export$/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /export json/i }));

    expect(onExportJson).toHaveBeenCalledTimes(1);
  });

  it('keeps Import JSON direct and groups export under the File menu', () => {
    render(<AppHeader isExporting={false} onExport={jest.fn()} onExportJson={jest.fn()} onImportJson={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /file options/i }));
    expect(screen.getByRole('menuitem', { name: /import json/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('menuitem', { name: /^export$/i }));

    expect(screen.getByRole('menu', { name: /export options/i })).toBeInTheDocument();
  });

  it('lists and loads situation templates from the File menu', () => {
    const onLoadTemplate = jest.fn();
    const template = { id: 'tacking-basics', title: 'Tacking Basics', frames: [] };

    render(
      <AppHeader
        isExporting={false}
        onExport={jest.fn()}
        onExportJson={jest.fn()}
        onImportJson={jest.fn()}
        onLoadTemplate={onLoadTemplate}
        templates={[template]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /file options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^templates$/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /tacking basics/i }));

    expect(onLoadTemplate).toHaveBeenCalledWith(template);
  });

  it('filters situation templates from the template search bar', () => {
    const templates = [
      { id: 'tacking-basics', title: 'Tacking Basics', frames: [] },
      { id: 'r10', title: 'R10 — Opposite Tacks', frames: [] },
    ];

    render(
      <AppHeader
        isExporting={false}
        onExport={jest.fn()}
        onExportJson={jest.fn()}
        onImportJson={jest.fn()}
        templates={templates}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /file options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^templates$/i }));
    fireEvent.change(screen.getByRole('searchbox', { name: /search templates/i }), { target: { value: 'r10' } });

    expect(screen.getByRole('menuitem', { name: /r10 — opposite tacks/i })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /tacking basics/i })).not.toBeInTheDocument();
  });

  it('provides titles for export menu items', () => {
    render(<AppHeader isExporting={false} onExport={jest.fn()} onExportJson={jest.fn()} onImportJson={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /file options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^export$/i }));

    expect(screen.getByRole('menuitem', { name: /export json/i })).toHaveAttribute('title', 'Export JSON');
    expect(screen.getByRole('menuitem', { name: /export gif/i })).toHaveAttribute('title', 'Export GIF');
    expect(screen.getByRole('menuitem', { name: /export video \(webm\)/i })).toHaveAttribute('title', 'Export Video (WebM)');
  });

  it('disables JSON export while another export is running', () => {
    render(<AppHeader isExporting onExport={jest.fn()} onExportJson={jest.fn()} onImportJson={jest.fn()} />);

    expect(screen.getByRole('button', { name: /file options/i })).toBeDisabled();
  });

  it('passes the selected JSON file to the import handler', () => {
    const onImportJson = jest.fn();
    const file = new File(['{}'], 'scenario.json', { type: 'application/json' });

    render(<AppHeader isExporting={false} onExport={jest.fn()} onExportJson={jest.fn()} onImportJson={onImportJson} />);

    fireEvent.change(screen.getByLabelText(/import scenario json file/i), {
      target: { files: [file] },
    });

    expect(onImportJson).toHaveBeenCalledWith(file);
  });

  it('does not render a burger menu trigger', () => {
    render(<AppHeader isExporting={false} onExport={jest.fn()} onExportJson={jest.fn()} onImportJson={jest.fn()} />);

    expect(screen.queryByRole('button', { name: /open controls menu/i })).not.toBeInTheDocument();
  });

  it('groups theme and presenter controls under the View menu', () => {
    const onToggleTheme = jest.fn();
    const onTogglePresenter = jest.fn();

    render(
      <AppHeader
        isExporting={false}
        onExport={jest.fn()}
        onExportJson={jest.fn()}
        onImportJson={jest.fn()}
        onToggleTheme={onToggleTheme}
        onTogglePresenter={onTogglePresenter}
        theme="dark"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /view options/i }));
    expect(screen.getByRole('menuitem', { name: /switch to light mode/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /presenter mode/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('menuitem', { name: /switch to light mode/i }));

    expect(onToggleTheme).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /view options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /presenter mode/i }));

    expect(onTogglePresenter).toHaveBeenCalledTimes(1);
  });
});
