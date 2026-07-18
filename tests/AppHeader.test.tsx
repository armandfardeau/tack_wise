import { fireEvent, render, screen } from '@testing-library/react';
import AppHeader from '../src/components/AppHeader';

describe('AppHeader', () => {
  it('delegates JSON export to the provided handler', () => {
    const onExportJson = jest.fn();

    render(<AppHeader isExporting={false} isSidebarOpen={false} onExport={jest.fn()} onExportJson={onExportJson} onImportJson={jest.fn()} onToggleSidebar={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /export options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /export json/i }));

    expect(onExportJson).toHaveBeenCalledTimes(1);
  });

  it('disables JSON export while another export is running', () => {
    render(<AppHeader isExporting isSidebarOpen={false} onExport={jest.fn()} onExportJson={jest.fn()} onImportJson={jest.fn()} onToggleSidebar={jest.fn()} />);

    expect(screen.getByRole('button', { name: /export options/i })).toBeDisabled();
  });

  it('passes the selected JSON file to the import handler', () => {
    const onImportJson = jest.fn();
    const file = new File(['{}'], 'scenario.json', { type: 'application/json' });

    render(<AppHeader isExporting={false} isSidebarOpen={false} onExport={jest.fn()} onExportJson={jest.fn()} onImportJson={onImportJson} onToggleSidebar={jest.fn()} />);

    fireEvent.change(screen.getByLabelText(/import scenario json file/i), {
      target: { files: [file] },
    });

    expect(onImportJson).toHaveBeenCalledWith(file);
  });

  it('toggles the controls menu from the burger button', () => {
    const onToggleSidebar = jest.fn();

    render(<AppHeader isExporting={false} isSidebarOpen={false} onExport={jest.fn()} onExportJson={jest.fn()} onImportJson={jest.fn()} onToggleSidebar={onToggleSidebar} />);

    const menuButton = screen.getByRole('button', { name: /open controls menu/i });
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(menuButton);

    expect(onToggleSidebar).toHaveBeenCalledTimes(1);
  });
});
