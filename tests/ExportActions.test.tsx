import { fireEvent, render, screen } from '@testing-library/react';
import ExportActions from '../src/components/ExportActions';

const baseProps = {
  isExporting: false,
  onExport: jest.fn(),
  onExportJson: jest.fn(),
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
    render(<ExportActions {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /file options/i }));
    fireEvent.click(screen.getByRole('button', { name: /file options/i }));
    fireEvent.click(screen.getByRole('button', { name: /file options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^export$/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^export$/i }));

    expect(screen.getByRole('menu', { name: /file options/i })).toBeInTheDocument();
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

  it('closes an open menu when exporting starts', () => {
    const { rerender } = render(<ExportActions {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /file options/i }));
    expect(screen.getByRole('menu', { name: /file options/i })).toBeInTheDocument();

    rerender(<ExportActions {...baseProps} isExporting />);

    expect(screen.queryByRole('menu', { name: /file options/i })).not.toBeInTheDocument();
  });
});
