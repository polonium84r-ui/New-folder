import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import AdminDashboard from '../pages/AdminDashboard';

// Mock the API module
vi.mock('../utils/api.js', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
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

const AdminDashboardWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
    <Toaster />
  </BrowserRouter>
);

describe('AdminDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('user', JSON.stringify({
      role: 'admin',
      name: 'System Administrator'
    }));
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('renders admin dashboard correctly', async () => {
    const mockUsersResponse = {
      data: {
        users: [
          {
            _id: '1',
            name: 'Dr. Smith',
            email: 'smith@hospital.com',
            role: 'doctor',
            analysisCount: 15,
            lastLogin: new Date().toISOString(),
            createdAt: '2024-01-01T00:00:00Z'
          }
        ]
      }
    };

    api.get.mockResolvedValueOnce(mockUsersResponse);

    render(
      <AdminDashboardWrapper>
        <AdminDashboard />
      </AdminDashboardWrapper>
    );

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Monitor doctor activity and system usage • Auto-refreshes every 30 seconds')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      expect(screen.getByText('smith@hospital.com')).toBeInTheDocument();
    });
  });

  test('displays empty state when no doctors', async () => {
    const mockUsersResponse = {
      data: {
        users: []
      }
    };

    api.get.mockResolvedValueOnce(mockUsersResponse);

    render(
      <AdminDashboardWrapper>
        <AdminDashboard />
      </AdminDashboardWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('No Doctors Found')).toBeInTheDocument();
      expect(screen.getByText('No doctor accounts have been created yet.')).toBeInTheDocument();
    });
  });

  test('handles refresh button click', async () => {
    const mockUsersResponse = {
      data: {
        users: []
      }
    };

    api.get.mockResolvedValue(mockUsersResponse);

    render(
      <AdminDashboardWrapper>
        <AdminDashboard />
      </AdminDashboardWrapper>
    );

    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/auth/users');
    });
  });

  test('calculates statistics correctly', async () => {
    const mockUsersResponse = {
      data: {
        users: [
          {
            _id: '1',
            name: 'Dr. Smith',
            email: 'smith@hospital.com',
            role: 'doctor',
            analysisCount: 25,
            lastLogin: new Date().toISOString(),
            createdAt: '2024-01-01T00:00:00Z'
          },
          {
            _id: '2',
            name: 'Dr. Johnson',
            email: 'johnson@hospital.com',
            role: 'doctor',
            analysisCount: 35,
            lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: '2024-01-01T00:00:00Z'
          }
        ]
      }
    };

    api.get.mockResolvedValueOnce(mockUsersResponse);

    render(
      <AdminDashboardWrapper>
        <AdminDashboard />
      </AdminDashboardWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Total doctors
      expect(screen.getByText('60')).toBeInTheDocument(); // Total analyses
      expect(screen.getByText('30')).toBeInTheDocument(); // Average per doctor
    });
  });

  test('redirects non-admin users', () => {
    localStorage.setItem('user', JSON.stringify({
      role: 'doctor',
      name: 'Dr. Smith'
    }));

    render(
      <AdminDashboardWrapper>
        <AdminDashboard />
      </AdminDashboardWrapper>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });

  test('redirects when no token', () => {
    localStorage.clear();

    render(
      <AdminDashboardWrapper>
        <AdminDashboard />
      </AdminDashboardWrapper>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});