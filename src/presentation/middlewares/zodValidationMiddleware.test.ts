import { describe, it, mock } from 'node:test'
import { ZodError, ZodSchema, z } from 'zod'
import zodValidationMiddleware from './zodValidationMiddleware.js'
import { Request, Response } from 'express'
import assert from 'node:assert'

describe('zodValidationMiddleware', () => {
  const schema = z.object({
    name: z.string()
  })

  it('should call next with no error on success', () => {
    const req = {
      body: {
        name: 'any_name'
      }
    } as unknown as Request
    const jsonMock = mock.fn()
    const statusMock = mock.fn(() => {
      return {
        json: jsonMock
      }
    })
    const res = {
      status: statusMock
    } as unknown as Response
    const nextMock = mock.fn()

    zodValidationMiddleware(schema)(req, res, nextMock)
    assert.strictEqual(nextMock.mock.callCount(), 1)
    assert.ok(nextMock.mock.calls[0].arguments.length === 0)
    assert.strictEqual(statusMock.mock.callCount(), 0)
    assert.strictEqual(jsonMock.mock.callCount(), 0)
  })

  it('should not call next with error on ZodError', () => {
    const req = {
      body: {
        name: null
      }
    } as unknown as Request
    const jsonMock = mock.fn()
    const statusMock = mock.fn((_: number) => {
      return {
        json: jsonMock
      }
    })
    const res = {
      status: statusMock
    } as unknown as Response
    const nextMock = mock.fn()

    zodValidationMiddleware(schema)(req, res, nextMock)

    assert.strictEqual(nextMock.mock.callCount(), 0)

    const error = jsonMock.mock.calls[0].arguments[0]
    assert.ok(error instanceof ZodError)

    assert.strictEqual(statusMock.mock.callCount(), 1)
    assert.strictEqual(statusMock.mock.calls[0].arguments[0], 422)

    assert.strictEqual(jsonMock.mock.callCount(), 1)
    assert.deepStrictEqual(jsonMock.mock.calls[0].arguments[0], error)
  })

  it('should call next with error on any other error', () => {
    const schema = 'not a schema' as unknown as ZodSchema

    const req = {
      body: {
        name: null
      }
    } as unknown as Request
    const jsonMock = mock.fn()
    const statusMock = mock.fn((_: number) => {
      return {
        json: jsonMock
      }
    })
    const res = {
      status: statusMock
    } as unknown as Response
    const nextMock = mock.fn()

    zodValidationMiddleware(schema)(req, res, nextMock)

    assert.strictEqual(nextMock.mock.callCount(), 1)
    assert.ok(nextMock.mock.calls[0].arguments.length === 1)

    assert.strictEqual(statusMock.mock.callCount(), 0)
    assert.strictEqual(jsonMock.mock.callCount(), 0)
  })
})
