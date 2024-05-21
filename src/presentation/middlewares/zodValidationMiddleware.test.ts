import { describe, it, expect, jest as mock } from '@jest/globals'
import { ZodError, ZodSchema, z } from 'zod'
import zodValidationMiddleware from './zodValidationMiddleware.js'
import { Request, Response } from 'express'

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
    expect(nextMock).toBeCalledTimes(1)
    expect(nextMock).toBeCalledWith()
    expect(statusMock).not.toBeCalled()
    expect(jsonMock).not.toBeCalled()
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

    expect(nextMock).not.toBeCalled()

    const error = jsonMock.mock.calls[0][0]
    expect(error).toBeInstanceOf(ZodError)
    expect(jsonMock).toBeCalledTimes(1)

    expect(statusMock).toBeCalledTimes(1)
    expect(statusMock).toBeCalledWith(422)
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

    expect(nextMock).toBeCalledTimes(1)
    expect(nextMock).toBeCalledWith(expect.any(Error))

    expect(statusMock).not.toBeCalled()
    expect(jsonMock).not.toBeCalled()
  })
})
