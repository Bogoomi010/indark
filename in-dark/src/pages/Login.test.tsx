import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const signIn = vi.fn();
vi.mock('../auth/AuthProvider', () => ({ useAuth: () => ({ signIn }) }));
vi.mock('../i18n/i18n', () => ({ useI18n: () => ({ t: (k: string) => k }) }));

import LoginPage from './Login';

describe('LoginPage', () => {
  it('calls signIn with google', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    const btn = screen.getByText('login.continueWithGoogle');
    fireEvent.click(btn);
    expect(signIn).toHaveBeenCalledWith('google');
  });
});
