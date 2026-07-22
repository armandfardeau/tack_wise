import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import AppHeader from '../src/components/AppHeader';

const rect = (top: number, right: number, bottom: number, left = 0, width = right - left, height = bottom - top) => ({
  bottom,
  height,
  left,
  right,
  top,
  width,
  x: left,
  y: top,
  toJSON: () => ({}),
}) as DOMRect;

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

    expect(onExport).toHaveBeenCalledWith({ format: 'json', theme: 'dark', fps: 20, autoFit: false });
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

    expect(onExport).toHaveBeenNthCalledWith(1, { format: 'webm', theme: 'dark', fps: 20, autoFit: true });
    expect(onExport).toHaveBeenNthCalledWith(2, { format: 'mp4', theme: 'dark', fps: 10, autoFit: true });
  });

  it('allows auto-fitting visual exports', () => {
    const onExport = jest.fn();
    renderHeader({ onExport });

    openExportDialog();
    const autoFit = screen.getByRole('checkbox', { name: /auto-fit canvas/i });
    expect(autoFit).toBeChecked();
    fireEvent.click(autoFit);
    fireEvent.click(screen.getByRole('button', { name: /export png image/i }));

    expect(onExport).toHaveBeenCalledWith({ format: 'png', theme: 'dark', fps: 20, autoFit: false });
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

  it('groups about, support, and sharing in the compact More menu', () => {
    const onShareScenario = jest.fn();
    const onOpenAbout = jest.fn();

    renderHeader({
      onShareScenario,
      onOpenAbout,
      sponsorship: {
        stripeUrl: 'https://buy.stripe.com/test-link',
      },
    });

    fireEvent.click(screen.getByRole('button', { name: /more options/i }));

    expect(screen.getByRole('menu', { name: /about and support/i })).toBeInTheDocument();
    expect(screen.getByText('About Tack Wise')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /support with stripe/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('menuitem', { name: /open about page/i }));
    expect(onOpenAbout).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /more options/i }));

    fireEvent.click(screen.getByRole('menuitem', { name: /copy share link/i }));

    expect(onShareScenario).toHaveBeenCalledTimes(1);
  });

  it('offers Featurebase feedback from the compact More menu when configured', () => {
    renderHeader({ feedbackEnabled: true });

    expect(screen.getByRole('button', { name: /send feedback/i })).toHaveAttribute('data-featurebase-feedback');

    fireEvent.click(screen.getByRole('button', { name: /more options/i }));

    expect(screen.getByRole('menuitem', { name: /send feedback/i })).toHaveAttribute('data-featurebase-feedback');
  });

  it('keeps the More menu inside a narrow viewport', () => {
    const getBoundingClientRect = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function getRect(this: HTMLElement) {
      if (this.classList.contains('header-more-trigger')) return rect(40, 318, 74, 284, 34, 34);
      if (this.classList.contains('header-more-menu')) return rect(0, 280, 250, 0, 280, 250);
      return rect(0, 0, 0);
    });
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 320 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 768 });

    render(<AppHeader isExporting={false} onExport={jest.fn()} onImportJson={jest.fn()} onOpenAbout={jest.fn()} onShareScenario={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /more options/i }));

    expect(screen.getByRole('menu', { name: /about and support/i })).toHaveStyle({
      top: '82px',
      left: '28px',
      maxHeight: '674px',
      visibility: 'visible',
    });

    getBoundingClientRect.mockRestore();
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalInnerWidth });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: originalInnerHeight });
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
