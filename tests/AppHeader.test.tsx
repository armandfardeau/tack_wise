import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import AppHeader from '../src/components/AppHeader';

const renderHeader = (overrides: Partial<ComponentProps<typeof AppHeader>> = {}) => render(
  <AppHeader
    isExporting={false}
    onExport={jest.fn()}
    onImportJson={jest.fn()}
    {...overrides}
  />,
);

function openExportDialog() {
  fireEvent.click(screen.getByRole('button', { name: /file options/i }));
  fireEvent.click(screen.getByRole('menuitem', { name: /^export$/i }));
}

describe('AppHeader', () => {
  it('renders and updates the scenario title', () => {
    const onScenarioTitleChange = jest.fn();

    render(
      <AppHeader
        isExporting={false}
        scenarioTitle="Mark Room"
        onScenarioTitleChange={onScenarioTitleChange}
        onExport={jest.fn()}
        onImportJson={jest.fn()}
      />,
    );

    const titleInput = screen.getByRole('textbox', { name: /scenario title/i });
    expect(titleInput).toHaveValue('Mark Room');

    fireEvent.change(titleInput, { target: { value: 'Upwind Crossing' } });

    expect(onScenarioTitleChange).toHaveBeenCalledWith('Upwind Crossing');
  });

  it('renders the File menu in the top-level scenario tools bar', () => {
    renderHeader();

    const scenarioTools = document.querySelector('.header-tools');

    expect(scenarioTools).toContainElement(screen.getByRole('button', { name: /file options/i }));
    expect(scenarioTools).toContainElement(screen.getByRole('button', { name: /copy share link/i }));
    expect(scenarioTools).toContainElement(screen.getByRole('button', { name: /view options/i }));
  });

  it('delegates JSON export through the export dialog', () => {
    const onExport = jest.fn();
    renderHeader({ onExport });

    openExportDialog();
    fireEvent.change(screen.getByRole('combobox', { name: /export format/i }), { target: { value: 'json' } });
    fireEvent.click(screen.getByRole('button', { name: /export json scenario/i }));

    expect(onExport).toHaveBeenCalledWith({ format: 'json', theme: 'dark', fps: 20 });
  });

  it('keeps Import JSON direct and opens Export as a modal', () => {
    renderHeader();

    fireEvent.click(screen.getByRole('button', { name: /file options/i }));
    expect(screen.getByRole('menuitem', { name: /import json/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('menuitem', { name: /^export$/i }));

    expect(screen.getByRole('dialog', { name: /export/i })).toBeInTheDocument();
  });

  it('lists and loads situation templates from the File menu', () => {
    const onLoadTemplate = jest.fn();
    const template = { id: 'tacking-basics', title: 'Getting Started', frames: [] };

    renderHeader({ onLoadTemplate, templates: [template] });

    fireEvent.click(screen.getByRole('button', { name: /file options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^templates$/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /getting started/i }));

    expect(onLoadTemplate).toHaveBeenCalledWith(template);
  });

  it('filters situation templates from the template search bar', () => {
    const templates = [
      { id: 'tacking-basics', title: 'Getting Started', frames: [] },
      { id: 'r10', title: 'R10 — Opposite Tacks', frames: [] },
    ];

    renderHeader({ templates });

    fireEvent.click(screen.getByRole('button', { name: /file options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^templates$/i }));
    fireEvent.change(screen.getByRole('searchbox', { name: /search templates/i }), { target: { value: 'r10' } });

    expect(screen.getByRole('menuitem', { name: /r10 — opposite tacks/i })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /getting started/i })).not.toBeInTheDocument();
  });

  it('shows all format choices in the export dialog', () => {
    renderHeader();

    openExportDialog();

    const formatSelect = screen.getByRole('combobox', { name: /export format/i });
    expect(formatSelect).toHaveValue('png');
    expect(screen.getByRole('option', { name: /png image/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /jpg image/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /gif animation/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /webm video/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /mp4 video/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /json scenario/i })).toBeInTheDocument();
  });

  it('delegates WEBM and MP4 exports with their selected FPS', () => {
    const onExport = jest.fn();
    renderHeader({ onExport });

    openExportDialog();
    fireEvent.change(screen.getByRole('combobox', { name: /export format/i }), { target: { value: 'webm' } });
    fireEvent.click(screen.getByRole('button', { name: /export webm video/i }));

    openExportDialog();
    fireEvent.change(screen.getByRole('combobox', { name: /export format/i }), { target: { value: 'mp4' } });
    fireEvent.change(screen.getByRole('combobox', { name: /export fps/i }), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: /export mp4 video/i }));

    expect(onExport).toHaveBeenNthCalledWith(1, { format: 'webm', theme: 'dark', fps: 20 });
    expect(onExport).toHaveBeenNthCalledWith(2, { format: 'mp4', theme: 'dark', fps: 10 });
  });

  it('disables the File menu while another export is running', () => {
    renderHeader({ isExporting: true });

    expect(screen.getByRole('button', { name: /file options/i })).toBeDisabled();
  });

  it('passes the selected JSON file to the import handler', () => {
    const onImportJson = jest.fn();
    const file = new File(['{}'], 'scenario.json', { type: 'application/json' });

    renderHeader({ onImportJson });

    fireEvent.change(screen.getByLabelText(/import scenario json file/i), {
      target: { files: [file] },
    });

    expect(onImportJson).toHaveBeenCalledWith(file);
  });

  it('does not render a burger menu trigger', () => {
    renderHeader();

    expect(screen.queryByRole('button', { name: /open controls menu/i })).not.toBeInTheDocument();
  });

  it('groups theme and presenter controls under the View menu', () => {
    const onToggleTheme = jest.fn();
    const onTogglePresenter = jest.fn();

    renderHeader({ onToggleTheme, onTogglePresenter, theme: 'dark' });

    fireEvent.click(screen.getByRole('button', { name: /view options/i }));
    expect(screen.getByRole('menuitem', { name: /switch to light mode/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /presenter mode/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('menuitem', { name: /switch to light mode/i }));
    expect(onToggleTheme).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /view options/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /presenter mode/i }));
    expect(onTogglePresenter).toHaveBeenCalledTimes(1);
  });

  it('copies a share link through the optional handler', () => {
    const onShareScenario = jest.fn();

    renderHeader({ onShareScenario });

    fireEvent.click(screen.getByRole('button', { name: /copy share link/i }));

    expect(onShareScenario).toHaveBeenCalledTimes(1);
  });

  it('shows Stripe and GitHub sponsorship links when configured', () => {
    renderHeader({
      sponsorship: {
        stripeUrl: 'https://buy.stripe.com/test-link',
        githubUrl: 'https://github.com/sponsors/armandfardeau',
      },
    });

    fireEvent.click(screen.getByRole('button', { name: /support tack wise/i }));

    expect(screen.getByRole('menuitem', { name: /support with stripe/i })).toHaveAttribute('href', 'https://buy.stripe.com/test-link');
    expect(screen.getByRole('menuitem', { name: /sponsor on github/i })).toHaveAttribute('href', 'https://github.com/sponsors/armandfardeau');
  });

  it('shows an open-source donation link when configured', () => {
    renderHeader({ sponsorship: { donationUrl: 'https://opencollective.com/tack-wise' } });

    fireEvent.click(screen.getByRole('button', { name: /support tack wise/i }));

    expect(screen.getByRole('menuitem', { name: /donate to open source/i })).toHaveAttribute('href', 'https://opencollective.com/tack-wise');
  });

  it('shows the Stripe Checkout donation form with a publishable key', () => {
    renderHeader({ sponsorship: { stripePublishableKey: 'pk_test_example' } });

    fireEvent.click(screen.getByRole('button', { name: /support tack wise/i }));

    expect(screen.getByRole('spinbutton', { name: /^donation amount$/i })).toHaveValue(10);
    expect(screen.getByRole('button', { name: /continue to stripe checkout/i })).toBeInTheDocument();
  });

  it('does not show sponsorship controls without a configured destination', () => {
    renderHeader();

    expect(screen.queryByRole('button', { name: /support tack wise/i })).not.toBeInTheDocument();
  });
});
