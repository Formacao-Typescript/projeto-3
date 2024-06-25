import { describe, expect, it } from 'vitest'
import { randomUUID } from 'node:crypto'
import { ZodError } from 'zod'
import { Class, ClassCreationType } from './Class.js'

describe('Class', () => {
  const classEntityObj: ClassCreationType = {
    code: '1A-M',
    teacher: randomUUID()
  }

  it('should return an instance of the entity with the correct data', () => {
    const classEntity = new Class(classEntityObj)
    expect(classEntity).toBeInstanceOf(Class)
  })
  it('should return the correct data on toObject', () => {
    const classEntity = new Class(classEntityObj)
    expect(classEntity.toObject()).toEqual({
      ...classEntityObj,
      id: classEntity.id
    })
  })

  it('should return the correct data on toJSON', () => {
    const classEntity = new Class(classEntityObj)
    expect(classEntity.toJSON()).toEqual(JSON.stringify(classEntity.toObject()))
  })

  it('should return an instance of the entity with the correct data from fromObject', () => {
    const classEntity = Class.fromObject(classEntityObj)
    expect(classEntity).toBeInstanceOf(Class)
    expect(classEntity.toObject()).toEqual({
      ...classEntityObj,
      id: classEntity.id
    })
  })

  it('should return an error upon invalid data', () => {
    expect(() => {
      new Class({ ...classEntityObj, code: 'invalid' })
    }).toThrow(ZodError)
    expect(() => {
      new Class({ ...classEntityObj, teacher: 'invalid' })
    }).toThrow(ZodError)
  })
})
