import { fireEvent, render, screen } from '@testing-library/react';
import AppHeader from '../src/components/AppHeader';

describe('AppHeader', () => {
  it('delegates JSON export to the provided handler', () => {
    const onExportJson = jest.fn();

    render(<AppHeader isExporting={false} onExport={jest.fn()} onExportJson={onExportJson} onImportJson={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /export options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /export json/i }));

    expect(onExportJson).toHaveBeenCalledTimes(1);
  });

  it('disables JSON export while another export is running', () => {
    render(<AppHeader isExporting onExport={jest.fn()} onExportJson={jest.fn()} onImportJson={jest.fn()} />);

    expect(screen.getByRole('button', { name: /export options/i })).toBeDisabled();
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

  it('does not render a theme toggle in the header', () => {
    const onToggleTheme = jest.fn();

    render(
      <AppHeader
        isExporting={false}
        onExport={jest.fn()}
        onExportJson={jest.fn()}
        onImportJson={jest.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: /switch to light mode/i })).not.toBeInTheDocument();
    expect(onToggleTheme).not.toHaveBeenCalled();
  });
});
