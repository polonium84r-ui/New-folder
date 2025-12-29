import { describe, test, expect } from 'vitest';

// Age calculation function (extracted from AnalysisResults.jsx for testing)
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // Adjust age if birthday hasn't occurred this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

describe('Age Calculation', () => {
  test('calculates age correctly for past dates', () => {
    // Test with a date 25 years ago
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 25);
    const dateString = birthDate.toISOString().split('T')[0];
    
    const age = calculateAge(dateString);
    expect(age).toBe(25);
  });

  test('calculates age correctly when birthday has not occurred this year', () => {
    // Test with a future birthday this year
    const today = new Date();
    const birthDate = new Date(today.getFullYear() - 30, today.getMonth() + 1, today.getDate());
    const dateString = birthDate.toISOString().split('T')[0];
    
    const age = calculateAge(dateString);
    expect(age).toBe(29); // Should be 29 because birthday hasn't occurred yet
  });

  test('calculates age correctly when birthday has occurred this year', () => {
    // Test with a past birthday this year
    const today = new Date();
    const birthDate = new Date(today.getFullYear() - 30, today.getMonth() - 1, today.getDate());
    const dateString = birthDate.toISOString().split('T')[0];
    
    const age = calculateAge(dateString);
    expect(age).toBe(30); // Should be 30 because birthday has already occurred
  });

  test('returns null for empty date', () => {
    const age = calculateAge('');
    expect(age).toBeNull();
  });

  test('returns null for null date', () => {
    const age = calculateAge(null);
    expect(age).toBeNull();
  });

  test('calculates age correctly for exact birthday today', () => {
    // Test with today's date but 25 years ago
    const today = new Date();
    const birthDate = new Date(today.getFullYear() - 25, today.getMonth(), today.getDate());
    const dateString = birthDate.toISOString().split('T')[0];
    
    const age = calculateAge(dateString);
    expect(age).toBe(25);
  });

  test('calculates age correctly for very young patient', () => {
    // Test with a date 1 year ago
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 1);
    const dateString = birthDate.toISOString().split('T')[0];
    
    const age = calculateAge(dateString);
    expect(age).toBe(1);
  });

  test('calculates age correctly for elderly patient', () => {
    // Test with a date 85 years ago
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 85);
    const dateString = birthDate.toISOString().split('T')[0];
    
    const age = calculateAge(dateString);
    expect(age).toBe(85);
  });
});