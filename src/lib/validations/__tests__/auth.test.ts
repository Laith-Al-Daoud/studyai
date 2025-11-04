/**
 * Unit Tests for Authentication Validation Schemas
 */

import {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updatePasswordSchema,
} from '../auth'

describe('Authentication Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'user@example.com',
        password: 'password123',
      }
      
      const result = loginSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      }
      
      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject short password', () => {
      const invalidData = {
        email: 'user@example.com',
        password: '12345',
      }
      
      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject missing fields', () => {
      const result = loginSchema.safeParse({})
      expect(result.success).toBe(false)
    })
  })

  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        email: 'newuser@example.com',
        password: 'securepass123',
        confirmPassword: 'securepass123',
      }
      
      const result = registerSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject mismatched passwords', () => {
      const invalidData = {
        email: 'user@example.com',
        password: 'password123',
        confirmPassword: 'differentpass',
      }
      
      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('confirmPassword')
      }
    })

    it('should reject invalid email in registration', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'password123',
        confirmPassword: 'password123',
      }
      
      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject short passwords', () => {
      const invalidData = {
        email: 'user@example.com',
        password: '12345',
        confirmPassword: '12345',
      }
      
      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('resetPasswordSchema', () => {
    it('should validate correct email', () => {
      const validData = {
        email: 'user@example.com',
      }
      
      const result = resetPasswordSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
      }
      
      const result = resetPasswordSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject missing email', () => {
      const result = resetPasswordSchema.safeParse({})
      expect(result.success).toBe(false)
    })
  })

  describe('updatePasswordSchema', () => {
    it('should validate matching passwords', () => {
      const validData = {
        password: 'newpassword123',
        confirmPassword: 'newpassword123',
      }
      
      const result = updatePasswordSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject mismatched passwords', () => {
      const invalidData = {
        password: 'password123',
        confirmPassword: 'different123',
      }
      
      const result = updatePasswordSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject short passwords', () => {
      const invalidData = {
        password: '123',
        confirmPassword: '123',
      }
      
      const result = updatePasswordSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})


