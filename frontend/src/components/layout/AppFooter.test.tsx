import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppFooter } from './AppFooter';

describe('AppFooter', () => {
  it('não repete links do cabeçalho nem afirma incorretamente que uploads são locais', () => {
    render(<AppFooter />);
    expect(screen.queryByRole('navigation', { name: /rodapé/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /início|entrar|minha conta|créditos/i })).toBeNull();
    expect(screen.getByText(/enviados temporariamente ao servidor/i)).toBeTruthy();
    expect(screen.getByText(/não realiza protocolo oficial/i)).toBeTruthy();
  });
});
