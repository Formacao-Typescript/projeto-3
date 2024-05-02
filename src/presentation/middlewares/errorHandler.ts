import type { NextFunction, Request, Response } from 'express'

export async function errorHandler(err: any, _: Request, res: Response, next: NextFunction) {
  if (err) {
    return res
      .status(err?.status ?? 500)
      .json({ code: err?.code ?? 'UNKNOWN_ERROR', message: err.message, name: err.name })
  }
  next()
}
