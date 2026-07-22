import { fireEvent, render, screen } from '@testing-library/react';
import ExportActions from '../src/components/ExportActions';

const baseProps = {
  isExporting: false,
  onExport: jest.fn(),
  onImportJson: jest.fn(),
};

describe('ExportActions menu behavior', () => {
  beforeEach(() => jest.clearAllMocks());

  it('opens import through the hidden file input and clears the menu', () => {
    const inputClick = jest.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => undefined);

    render(<ExportActions {...baseProps} />);
    fireEvent.click(screen.getByRole('button', { name: /file options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /import json/i }));

    expect(inputClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu', { name: /file options/i })).not.toBeInTheDocument();
    inputClick.mockRestore();
  });

  it('creates a new diagram through the File menu', () => {
    const onNewScenario = jest.fn();

    render(<ExportActions {...baseProps} onNewScenario={onNewScenario} />);
    fireEvent.click(screen.getByRole('button', { name: /file options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /new diagram/i }));

    expect(onNewScenario).toHaveBeenCalledTimes(1);
  });

  it('ignores an import change when no file is selected', () => {
    render(<ExportActions {...baseProps} />);

    fireEvent.change(screen.getByLabelText(/import scenario json file/i), { target: { files: [] } });

    expect(baseProps.onImportJson).not.toHaveBeenCalled();
  });

  it('closes open menus from outside pointer events and Escape', () => {
    render(<ExportActions {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /file options/i }));
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('menu', { name: /file options/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /file options/i }));
    fireEvent.pointerDown(screen.getByRole('button', { name: /file options/i }));
    fireEvent.keyDown(document, { key: 'ArrowDown' });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu', { name: /file options/i })).not.toBeInTheDocument();
  });

  it('resets submenu state when toggling the file menu repeatedly', () => {
    render(<ExportActions {...baseProps} templates={[{ id: 'one', title: 'One', frames: [] }]} />);

    fireEvent.click(screen.getByRole('button', { name: /file options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^templates$/i }));
    fireEvent.click(screen.getByRole('button', { name: /file options/i }));
    fireEvent.click(screen.getByRole('button', { name: /file options/i }));

    expect(screen.queryByRole('menu', { name: /templates/i })).not.toBeInTheDocument();
  });

  it('shows an empty search result and resets the search when toggled', () => {
    render(<ExportActions {...baseProps} templates={[{ id: 'one', title: 'One', frames: [] }]} />);

    fireEvent.click(screen.getByRole('button', { name: /file options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^templates$/i }));
    fireEvent.change(screen.getByRole('searchbox', { name: /search templates/i }), { target: { value: 'missing' } });
    expect(screen.getByRole('status')).toHaveTextContent('No templates found');

    fireEvent.click(screen.getByRole('menuitem', { name: /^templates$/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^templates$/i }));
    expect(screen.getByRole('searchbox', { name: /search templates/i })).toHaveValue('');
  });

  it('dismisses the template sheet from its close control and backdrop', () => {
    render(<ExportActions {...baseProps} templates={[{ id: 'one', title: 'One', frames: [] }]} />);

    fireEvent.click(screen.getByRole('button', { name: /file options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^templates$/i }));
    fireEvent.change(screen.getByRole('searchbox', { name: /search templates/i }), { target: { value: 'one' } });
    fireEvent.click(screen.getByRole('button', { name: /close templates sheet/i }));

    expect(screen.queryByRole('menu', { name: /templates/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('menuitem', { name: /^templates$/i }));
    fireEvent.click(screen.getByRole('button', { name: /dismiss template sheet/i }));

    expect(screen.queryByRole('menu', { name: /templates/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('menuitem', { name: /^templates$/i }));
    expect(screen.getByRole('searchbox', { name: /search templates/i })).toHaveValue('');
  });

  it('keeps template results inside the dedicated list container', () => {
    render(<ExportActions {...baseProps} templates={[{ id: 'one', title: 'One', frames: [] }]} />);

    fireEvent.click(screen.getByRole('button', { name: /file options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^templates$/i }));

    const templateItem = screen.getByRole('menuitem', { name: /one/i });
    const templateList = templateItem.parentElement;
    expect(templateList).not.toBeNull();
    expect(templateList).toContainElement(templateItem);
    expect(templateList).not.toContainElement(screen.getByRole('searchbox', { name: /search templates/i }));
  });

  it('offers new and update template contribution actions', () => {
    const onContributeTemplate = jest.fn();
    const onUpdateTemplate = jest.fn();

    render(
      <ExportActions
        {...baseProps}
        templates={[{ id: 'r18', title: 'R18', frames: [] }]}
        onContributeTemplate={onContributeTemplate}
        onUpdateTemplate={onUpdateTemplate}
        canUpdateTemplate
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /file options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^templates$/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /submit current diagram/i }));
    expect(onContributeTemplate).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /file options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^templates$/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /update current template/i }));
    expect(onUpdateTemplate).toHaveBeenCalledTimes(1);
  });

  it('disables updating when no built-in template is loaded', () => {
    render(
      <ExportActions
        {...baseProps}
        templates={[{ id: 'r18', title: 'R18', frames: [] }]}
        onUpdateTemplate={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /file options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^templates$/i }));

    expect(screen.getByRole('menuitem', { name: /update current template/i })).toBeDisabled();
  });

  it('opens the export settings dialog with the current theme and format controls', () => {
    render(<ExportActions {...baseProps} theme="light" />);

    fireEvent.click(screen.getByRole('button', { name: /file options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^export$/i }));

    expect(screen.getByRole('dialog', { name: /export/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /export format/i })).toHaveValue('png');
    expect(screen.getByRole('radio', { name: /light/i })).toBeChecked();
    expect(screen.queryByRole('combobox', { name: /export fps/i })).not.toBeInTheDocument();
  });

  it('enters, traps, and returns focus for the export dialog', () => {
    render(<ExportActions {...baseProps} />);

    const fileTrigger = screen.getByRole('button', { name: /file options/i });
    fireEvent.click(fileTrigger);
    fireEvent.click(screen.getByRole('menuitem', { name: /^export$/i }));

    const formatSelect = screen.getByRole('combobox', { name: /export format/i });
    const closeButton = screen.getByRole('button', { name: /close export dialog/i });
    const exportButton = screen.getByRole('button', { name: /export png image/i });

    expect(formatSelect).toHaveFocus();

    fireEvent.keyDown(exportButton, { key: 'Tab' });
    expect(closeButton).toHaveFocus();

    fireEvent.keyDown(closeButton, { key: 'Tab', shiftKey: true });
    expect(exportButton).toHaveFocus();

    fireEvent.change(formatSelect, { target: { value: 'json' } });
    const jsonExportButton = screen.getByRole('button', { name: /export json scenario/i });
    fireEvent.keyDown(jsonExportButton, { key: 'Tab' });
    expect(closeButton).toHaveFocus();
    fireEvent.keyDown(closeButton, { key: 'Tab', shiftKey: true });
    expect(jsonExportButton).toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(fileTrigger).toHaveFocus();

    fireEvent.click(fileTrigger);
    fireEvent.click(screen.getByRole('menuitem', { name: /^export$/i }));
    fireEvent.click(screen.getByRole('button', { name: /export png image/i }));
    expect(fileTrigger).toHaveFocus();
  });

  it('shows FPS for animation formats and submits all selected options', () => {
    render(<ExportActions {...baseProps} theme="light" />);

    fireEvent.click(screen.getByRole('button', { name: /file options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^export$/i }));
    fireEvent.change(screen.getByRole('combobox', { name: /export format/i }), { target: { value: 'webm' } });
    fireEvent.click(screen.getByRole('radio', { name: /dark/i }));
    fireEvent.change(screen.getByRole('combobox', { name: /export fps/i }), { target: { value: '30' } });
    fireEvent.click(screen.getByRole('button', { name: /export webm video/i }));

    expect(baseProps.onExport).toHaveBeenCalledWith({ format: 'webm', theme: 'dark', fps: 30, autoFit: true });
    expect(screen.queryByRole('dialog', { name: /export/i })).not.toBeInTheDocument();
  });

  it('hides visual-only settings for JSON exports', () => {
    render(<ExportActions {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /file options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^export$/i }));
    fireEvent.change(screen.getByRole('combobox', { name: /export format/i }), { target: { value: 'json' } });

    expect(screen.queryByRole('radio', { name: /dark/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: /light/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: /export fps/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: /auto-fit canvas/i })).not.toBeInTheDocument();
  });

  it('supports cancel, Escape, and backdrop dismissal', () => {
    render(<ExportActions {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /file options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^export$/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('dialog', { name: /export/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /file options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^export$/i }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: /export/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /file options/i })).toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: /file options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^export$/i }));
    fireEvent.mouseDown(document.querySelector('.export-dialog-backdrop')!);
    expect(screen.queryByRole('dialog', { name: /export/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /file options/i })).toHaveFocus();
  });

  it('closes an open menu and dialog when exporting starts', () => {
    const { rerender } = render(<ExportActions {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /file options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^export$/i }));

    rerender(<ExportActions {...baseProps} isExporting />);

    expect(screen.queryByRole('menu', { name: /file options/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: /export/i })).not.toBeInTheDocument();
  });

  it('allows selecting a faster export quality', () => {
    const onExportQualityChange = jest.fn();

    render(<ExportActions {...baseProps} onExportQualityChange={onExportQualityChange} />);
    fireEvent.click(screen.getByRole('button', { name: /file options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^export$/i }));
    fireEvent.change(screen.getByRole('combobox', { name: /export format/i }), { target: { value: 'webm' } });
    fireEvent.change(screen.getByRole('combobox', { name: /export quality/i }), { target: { value: 'fast' } });

    expect(onExportQualityChange).toHaveBeenCalledWith('fast');
  });
});
