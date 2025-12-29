import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import Login from '../pages/Login';

// Mock the API module
vi.mock('../utils/api.js', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from '../utils/api.js';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const LoginWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
    <Toaster />
  </BrowserRouter>
);

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test('renders login form correctly', () => {
    render(
      <LoginWrapper>
        <Login />
      </LoginWrapper>
    );

    expect(screen.getByText('AI-powered Acute Lymphoblastic Leukemia Screening System')).toBeInTheDocument();
    expect(screen.getByText('Advanced Medical Diagnosis Platform')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('handles admin login successfully', async () => {
    const mockResponse = {
      data: {
        token: 'mock-jwt-token',
        user: {
          id: '1',
          email: 'radarprojects.com',
          name: 'System Administrator',
          role: 'admin'
        }
      }
    };

    api.post.mockResolvedValueOnce(mockResponse);

    render(
      <LoginWrapper>
        <Login />
      </LoginWrapper>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'radarprojects.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Radar@2028' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'radarprojects.com',
        password: 'Radar@2028'
      });
      expect(mockNavigate).toHaveBeenCalledWith('/admin-dashboard');
    });
  });

  test('handles doctor login successfully', async () => {
    const mockResponse = {
      data: {
        token: 'mock-jwt-token',
        user: {
          id: '2',
          email: 'doctor@hospital.com',
          name: 'Dr. Smith',
          role: 'doctor'
        }
      }
    };

    api.post.mockResolvedValueOnce(mockResponse);

    render(
      <LoginWrapper>
        <Login />
      </LoginWrapper>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'doctor@hospital.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/home');
    });
  });

  test('handles login error', async () => {
    api.post.mockRejectedValueOnce({
      response: {
        data: {
          error: 'Invalid credentials'
        }
      }
    });

    render(
      <LoginWrapper>
        <Login />
      </LoginWrapper>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'wrong@email.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalled();
    });
  });

  test('toggles password visibility', () => {
    render(
      <LoginWrapper>
        <Login />
      </LoginWrapper>
    );

    const passwordInput = screen.getByLabelText(/password/i);
    const toggleButton = screen.getByRole('button', { name: '' });

    expect(passwordInput.type).toBe('password');

    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('text');

    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });

  test('redirects if user already logged in', () => {
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('user', JSON.stringify({
      role: 'admin',
      name: 'Admin'
    }));

    render(
      <LoginWrapper>
        <Login />
      </LoginWrapper>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/admin-dashboard');
  });
});